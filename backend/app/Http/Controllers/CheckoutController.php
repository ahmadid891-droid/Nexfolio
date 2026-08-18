<?php

namespace App\Http\Controllers;

use App\Jobs\DeliverOrderJob;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Midtrans\Config as MidtransConfig;
use Midtrans\Snap;

class CheckoutController extends Controller
{
    public function __construct()
    {
        MidtransConfig::$serverKey = config('services.midtrans.server_key');
        MidtransConfig::$isProduction = (bool) config('services.midtrans.is_production');
        MidtransConfig::$isSanitized = true;
        MidtransConfig::$is3ds = true;
    }

    public function config(): JsonResponse
    {
        return response()->json([
            'client_key' => config('services.midtrans.client_key'),
            'is_production' => (bool) config('services.midtrans.is_production'),
        ]);
    }

    public function checkout(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer'],
        ]);

        $product = Product::query()->where('id', $data['product_id'])->where('is_active', true)->first();

        if (! $product) {
            throw ValidationException::withMessages(['product_id' => 'Produk tidak ditemukan atau tidak aktif.']);
        }

        if ($product->price_idr > 0 && empty(config('services.midtrans.server_key'))) {
            throw ValidationException::withMessages([
                'payment' => 'Konfigurasi pembayaran belum siap. Silakan coba lagi nanti.',
            ]);
        }

        $user = $request->user();

        $existingPaid = Order::query()
            ->where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->where('status', 'paid')
            ->latest()
            ->first();

        if ($existingPaid) {
            return response()->json([
                'status' => 'already_purchased',
                'order' => $existingPaid->load(['product', 'fulfillment']),
            ]);
        }

        $pending = Order::query()
            ->where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->where('status', 'pending')
            ->latest()
            ->first();

        if ($pending) {
            return $this->preparePendingOrder($pending, $product);
        }

        $order = DB::transaction(function () use ($user, $product) {
            return Order::create([
                'user_id' => $user->id,
                'product_id' => $product->id,
                'total_idr' => $product->price_idr,
                'status' => 'pending',
                'midtrans_order_id' => 'NEX-'.Str::upper(Str::random(12)),
            ]);
        });

        return $this->preparePendingOrder($order, $product);
    }

    protected function preparePendingOrder(Order $order, Product $product): JsonResponse
    {
        if ($product->price_idr <= 0) {
            $order->update([
                'status' => 'paid',
                'payment_type' => 'free',
                'paid_at' => now(),
            ]);

            dispatch(new DeliverOrderJob($order->fresh()));

            return response()->json([
                'status' => 'paid',
                'order' => $order->load(['product', 'fulfillment']),
            ]);
        }

        if (empty(config('services.midtrans.server_key'))) {
            throw ValidationException::withMessages([
                'payment' => 'Konfigurasi pembayaran belum siap. Silakan coba lagi nanti.',
            ]);
        }

        $params = [
            'transaction_details' => [
                'order_id' => $order->midtrans_order_id,
                'gross_amount' => $order->total_idr,
            ],
            'item_details' => [[
                'id' => $product->id,
                'price' => $order->total_idr,
                'quantity' => 1,
                'name' => Str::limit($product->title, 50),
            ]],
            'customer_details' => [
                'first_name' => $order->user->name,
                'email' => $order->user->email,
            ],
        ];

        try {
            $snap = Snap::createTransaction($params);
        } catch (\Throwable $e) {
            report($e);

            throw ValidationException::withMessages([
                'payment' => 'Gagal membuat pembayaran. Periksa konfigurasi Midtrans.',
            ]);
        }

        return response()->json([
            'status' => 'pending_payment',
            'snap_token' => $snap->token,
            'snap_redirect_url' => $snap->redirect_url,
            'order' => $order->load(['product', 'fulfillment']),
        ]);
    }
}
