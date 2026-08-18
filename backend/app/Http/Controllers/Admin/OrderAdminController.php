<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\DeliverOrderJob;
use App\Models\AdminAudit;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Midtrans\Config as MidtransConfig;
use Midtrans\Transaction;

class OrderAdminController extends Controller
{
    public function __construct()
    {
        MidtransConfig::$serverKey = config('services.midtrans.server_key');
        MidtransConfig::$isProduction = (bool) config('services.midtrans.is_production');
        MidtransConfig::$isSanitized = true;
        MidtransConfig::$is3ds = true;
    }

    public function index(Request $request): JsonResponse
    {
        $limit = min((int) $request->input('limit', 100), 500);

        $orders = Order::query()
            ->with(['user', 'product', 'fulfillment'])
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn (Order $order) => [
                'id' => $order->id,
                'order_ref' => $order->midtrans_order_id,
                'status' => $order->status,
                'total_idr' => $order->total_idr,
                'total_formatted' => 'Rp'.number_format($order->total_idr, 0, ',', '.'),
                'payment_type' => $order->payment_type,
                'payment_method' => $order->payment_method,
                'paid_at' => $order->paid_at?->toDateTimeString(),
                'created_at' => $order->created_at->toDateTimeString(),
                'user' => [
                    'name' => $order->user?->name,
                    'email' => $order->user?->email,
                ],
                'product' => [
                    'title' => $order->product?->title,
                    'slug' => $order->product?->slug,
                ],
                'fulfillment' => [
                    'status' => $order->fulfillment->first()?->status ?? 'none',
                    'drive_link' => $order->fulfillment->firstWhere('status', 'delivered')?->drive_link,
                    'granted_to' => $order->fulfillment->first()?->granted_to,
                    'delivered_at' => $order->fulfillment->first()?->delivered_at?->toDateTimeString(),
                ],
            ]);

        $summary = [
            'total' => Order::count(),
            'pending' => Order::where('status', 'pending')->count(),
            'paid' => Order::where('status', 'paid')->count(),
            'failed' => Order::where('status', 'failed')->count(),
            'delivery_failed' => Order::where('status', 'paid')
                ->whereHas('fulfillment', fn ($q) => $q->where('status', 'failed'))
                ->count(),
        ];

        return response()->json(['orders' => $orders, 'summary' => $summary]);
    }

    public function retry(Request $request, int $id): JsonResponse
    {
        $order = Order::query()->with(['fulfillment'])->findOrFail($id);

        if ($order->status !== 'paid') {
            throw ValidationException::withMessages([
                'order' => 'Hanya pesanan berstatus paid yang bisa dikirim ulang.',
            ]);
        }

        dispatch(new DeliverOrderJob($order->fresh()));

        AdminAudit::log('order.retry_delivery', $order, ['order_ref' => $order->midtrans_order_id]);

        return response()->json(['ok' => true, 'message' => 'Pengiriman dijadwalkan ulang.']);
    }

    public function sync(Request $request, int $id): JsonResponse
    {
        $order = Order::query()->with(['fulfillment'])->findOrFail($id);

        if (! $order->midtrans_order_id) {
            throw ValidationException::withMessages([
                'order' => 'Pesanan ini tidak memiliki referensi pembayaran Midtrans.',
            ]);
        }

        if (empty(config('services.midtrans.server_key'))) {
            throw ValidationException::withMessages([
                'order' => 'Konfigurasi Midtrans belum siap.',
            ]);
        }

        try {
            $status = Transaction::status($order->midtrans_order_id);
        } catch (\Throwable $e) {
            report($e);

            throw ValidationException::withMessages([
                'order' => 'Gagal mengecek status ke Midtrans: '.$e->getMessage(),
            ]);
        }

        $transactionStatus = (string) data_get($status, 'transaction_status');
        $fraudStatus = (string) data_get($status, 'fraud_status');

        $paid = in_array($transactionStatus, ['capture', 'settlement'])
            && (! in_array($fraudStatus, ['challenge', 'deny']) || $fraudStatus === 'accept');

        if ($transactionStatus === 'capture' && $fraudStatus === 'challenge') {
            $paid = false;
        }

        if ($paid && (int) data_get($status, 'gross_amount') !== (int) $order->total_idr) {
            $paid = false;
        }

        $newStatus = match (true) {
            $paid => 'paid',
            in_array($transactionStatus, ['deny', 'cancel', 'expire']) => 'failed',
            default => 'pending',
        };

        $order->update([
            'status' => $newStatus,
            'payment_type' => 'midtrans',
            'payment_method' => data_get($status, 'payment_type') ?: data_get($status, 'channel'),
            'payment_info' => [
                'transaction_status' => $transactionStatus,
                'fraud_status' => $fraudStatus,
                'transaction_id' => data_get($status, 'transaction_id'),
            ],
            'paid_at' => $newStatus === 'paid' ? now() : $order->paid_at,
        ]);

        if ($newStatus === 'paid') {
            dispatch(new DeliverOrderJob($order->fresh()));
        }

        AdminAudit::log('order.sync_status', $order, [
            'order_ref' => $order->midtrans_order_id,
            'transaction_status' => $transactionStatus,
            'new_status' => $newStatus,
        ]);

        return response()->json([
            'ok' => true,
            'message' => "Status diperbarui menjadi {$newStatus}.",
            'status' => $newStatus,
        ]);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $order = Order::query()->with(['fulfillment'])->findOrFail($id);

        if ($order->status !== 'pending') {
            throw ValidationException::withMessages([
                'order' => 'Hanya pesanan pending yang bisa dibatalkan.',
            ]);
        }

        $order->update([
            'status' => 'failed',
            'payment_info' => array_merge((array) $order->payment_info, ['cancelled_by' => 'admin']),
        ]);

        AdminAudit::log('order.cancel', $order, ['order_ref' => $order->midtrans_order_id]);

        return response()->json(['ok' => true, 'message' => 'Pesanan dibatalkan.']);
    }

    public function stats(): JsonResponse
    {
        $summary = [
            'total' => Order::count(),
            'pending' => Order::where('status', 'pending')->count(),
            'paid' => Order::where('status', 'paid')->count(),
            'failed' => Order::where('status', 'failed')->count(),
            'delivery_failed' => Order::where('status', 'paid')
                ->whereHas('fulfillment', fn ($q) => $q->where('status', 'failed'))
                ->count(),
            'revenue_idr' => Order::where('status', 'paid')->sum('total_idr'),
        ];

        $daily = collect(range(6, 0))->map(function (int $d) {
            $day = now()->subDays($d);

            $orders = Order::whereDate('created_at', $day->toDateString());

            return [
                'date' => $day->toDateString(),
                'label' => $day->format('D'),
                'orders' => (clone $orders)->count(),
                'revenue_idr' => (clone $orders)->where('status', 'paid')->sum('total_idr'),
            ];
        })->values();

        return response()->json(['summary' => $summary, 'daily' => $daily]);
    }
}
