<?php

namespace App\Http\Controllers;

use App\Jobs\DeliverOrderJob;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentNotificationController extends Controller
{
    public function notification(Request $request): JsonResponse
    {
        $payload = $request->json()->all();

        try {
            $this->verifySignature($payload, $request);
        } catch (\Throwable $e) {
            Log::warning('Midtrans signature invalid: '.$e->getMessage());

            return response()->json(['status' => 'invalid'], 400);
        }

        $orderRef = data_get($payload, 'order_id');
        if (! $orderRef) {
            return response()->json(['status' => 'ok']);
        }

        $order = Order::query()->where('midtrans_order_id', $orderRef)->first();

        if (! $order) {
            Log::warning('Midtrans notification: order tidak ditemukan '.$orderRef);

            return response()->json(['status' => 'ok']); // jangan trigger retry utk order tak dikenal
        }

        $transactionStatus = (string) data_get($payload, 'transaction_status');
        $fraudStatus = (string) data_get($payload, 'fraud_status');

        $paid = in_array($transactionStatus, ['capture', 'settlement'])
            && (! in_array($fraudStatus, ['challenge', 'deny']) || $fraudStatus === 'accept');

        if ($transactionStatus === 'capture' && $fraudStatus === 'challenge') {
            $paid = false;
        }

        if ($paid && (int) data_get($payload, 'gross_amount') !== (int) $order->total_idr) {
            Log::warning("Midtrans gross_amount mismatch order {$order->id}: expected {$order->total_idr}, got ".data_get($payload, 'gross_amount'));
            $paid = false;
        }

        $status = match (true) {
            $paid => 'paid',
            in_array($transactionStatus, ['deny', 'cancel', 'expire']) => 'failed',
            default => 'pending',
        };

        $order->update([
            'status' => $status,
            'payment_type' => 'midtrans',
            'payment_method' => data_get($payload, 'payment_type') ?: data_get($payload, 'channel'),
            'payment_info' => [
                'transaction_status' => $transactionStatus,
                'fraud_status' => $fraudStatus,
                'transaction_id' => data_get($payload, 'transaction_id'),
            ],
            'paid_at' => $status === 'paid' ? now() : $order->paid_at,
        ]);

        if ($status === 'paid') {
            dispatch(new DeliverOrderJob($order->fresh()));
        }

        return response()->json(['status' => 'ok']);
    }

    protected function verifySignature(array $payload, Request $request): void
    {
        $signatureKey = data_get($payload, 'signature_key');
        $orderId = (string) data_get($payload, 'order_id');
        $statusCode = (string) data_get($payload, 'status_code');
        $grossAmount = (string) data_get($payload, 'gross_amount');
        $serverKey = (string) config('services.midtrans.server_key');

        if (! $serverKey) {
            throw new \RuntimeException('Server key belum dikonfigurasi.');
        }

        $expected = hash('sha512', $orderId.$statusCode.$grossAmount.$serverKey);

        if (! hash_equals($expected, (string) $signatureKey)) {
            throw new \RuntimeException('Signature tidak cocok.');
        }
    }
}