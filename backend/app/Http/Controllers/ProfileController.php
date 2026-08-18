<?php

namespace App\Http\Controllers;

use App\Models\InboxMessage;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function purchases(Request $request): JsonResponse
    {
        $limit = min((int) $request->input('limit', 100), 500);

        $orders = Order::query()
            ->with(['product', 'fulfillment'])
            ->where('user_id', $request->user()->id)
            ->where('status', 'paid')
            ->orderByDesc('paid_at')
            ->limit($limit)
            ->get()
            ->map(fn (Order $order) => [
                'id' => $order->id,
                'status' => $order->status,
                'total_idr' => $order->total_idr,
                'total_formatted' => 'Rp'.number_format($order->total_idr, 0, ',', '.'),
                'payment_type' => $order->payment_type,
                'paid_at' => $order->paid_at?->toDateTimeString(),
                'product' => [
                    'id' => $order->product?->id,
                    'title' => $order->product?->title,
                    'slug' => $order->product?->slug,
                    'cover_url' => $order->product?->cover_image
                        ? url('storage/'.$order->product->cover_image)
                        : null,
                ],
                'drive_link' => $order->fulfillment->firstWhere('status', 'delivered')?->drive_link,
                'fulfilled' => $order->fulfillment()->where('status', 'delivered')->exists(),
            ]);

        return response()->json($orders);
    }

    public function inbox(Request $request): JsonResponse
    {
        $messages = InboxMessage::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('is_read')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (InboxMessage $m) => [
                'id' => $m->id,
                'subject' => $m->subject,
                'body' => $m->body,
                'button_label' => $m->button_label,
                'button_url' => $m->button_url,
                'is_read' => $m->is_read,
                'created_at' => $m->created_at->toDateTimeString(),
            ]);

        return response()->json($messages);
    }

    public function inboxUnread(Request $request): JsonResponse
    {
        $unread = InboxMessage::query()
            ->where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->count();

        return response()->json(['unread' => $unread]);
    }

    public function markRead(Request $request, int $id): JsonResponse
    {
        $message = InboxMessage::query()
            ->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if (! $message->is_read) {
            $message->update(['is_read' => true, 'read_at' => now()]);
        }

        return response()->json(['ok' => true]);
    }
}
