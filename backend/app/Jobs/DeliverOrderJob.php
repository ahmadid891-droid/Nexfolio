<?php

namespace App\Jobs;

use App\Models\InboxMessage;
use App\Models\Order;
use App\Services\GoogleDriveService;
use App\Services\MediaFireLinkResolver;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class DeliverOrderJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 30;

    public function __construct(public Order $order)
    {
    }

    public function handle(GoogleDriveService $drive, MediaFireLinkResolver $resolver): void
    {
        if ($this->order->status !== 'paid') {
            return;
        }

        $existing = $this->order->fulfillment()
            ->where('status', 'delivered')
            ->exists();

        if ($existing) {
            return;
        }

        $product = $this->order->product;
        $buyer = $this->order->user;

        if (($product->storage_provider ?? 'google_drive') === 'mediafire') {
            $link = $product->mediafire_link;

            if ($product->mediafire_page_url
                && (! $product->mediafire_link_resolved_at
                    || $product->mediafire_link_resolved_at->lt(now()->subHours(6)))
            ) {
                try {
                    $link = $resolver->resolve($product->mediafire_page_url);
                    $product->mediafire_link = $link;
                    $product->mediafire_link_resolved_at = now();
                    $product->save();
                } catch (\Throwable $e) {
                    Log::warning('DeliverOrderJob: gagal refresh mediafire link order '.$this->order->id.': '.$e->getMessage());
                }
            }

            if (! $link) {
                $this->order->fulfillment()->updateOrCreate(
                    ['order_id' => $this->order->id],
                    ['status' => 'failed', 'granted_to' => $buyer->email, 'provider' => 'mediafire']
                );
                Log::error('DeliverOrderJob: produk mediafire tidak memiliki mediafire_link. Order '.$this->order->id);

                return;
            }

            $this->order->fulfillment()->updateOrCreate(
                ['order_id' => $this->order->id],
                [
                    'provider' => 'mediafire',
                    'drive_link' => $link,
                    'granted_to' => $buyer->email,
                    'status' => 'delivered',
                    'delivered_at' => now(),
                ]
            );

            InboxMessage::create([
                'user_id' => $buyer->id,
                'order_id' => $this->order->id,
                'subject' => 'Pesanan: '.$product->title,
                'body' => 'Pembayaran Anda telah berhasil. "'.$product->title.'" sudah siap diunduh. Klik tombol di bawah untuk membukanya di MediaFire.',
                'button_label' => 'Buka di MediaFire',
                'button_url' => $link,
                'is_read' => false,
            ]);

            return;
        }

        $files = $product->files()->orderBy('sort_order')->orderBy('id')->get();

        $targetId = null;
        $targetLink = null;

        if ($product->drive_folder_id) {
            $targetId = $product->drive_folder_id;
            $targetLink = 'https://drive.google.com/drive/folders/'.$targetId;
            $kind = 'folder';
        } elseif ($files->count() > 0) {
            $first = $files->first();
            $targetId = $first->drive_file_id;
            $targetLink = 'https://drive.google.com/file/d/'.$targetId.'/view?usp=sharing';
            $kind = 'file';
        } elseif ($product->drive_file_id) {
            $targetId = $product->drive_file_id;
            $targetLink = 'https://drive.google.com/file/d/'.$targetId.'/view?usp=sharing';
            $kind = 'file';
        } else {
            $this->order->fulfillment()->updateOrCreate(
                ['order_id' => $this->order->id],
                ['status' => 'failed', 'granted_to' => $buyer->email]
            );
            Log::error('DeliverOrderJob: produk tidak memiliki file/folder Drive. Order '.$this->order->id);

            return;
        }

        try {
            if ($kind === 'folder') {
                $drive->grantAccess($targetId, $buyer->email);
            } else {
                foreach ($files as $file) {
                    if ($file->drive_file_id) {
                        $drive->grantAccess($file->drive_file_id, $buyer->email);
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::error('DeliverOrderJob grantAccess gagal order '.$this->order->id.': '.$e->getMessage());
            $this->order->fulfillment()->updateOrCreate(
                ['order_id' => $this->order->id],
                ['status' => 'failed', 'granted_to' => $buyer->email]
            );

            return;
        }

        $this->order->fulfillment()->updateOrCreate(
            ['order_id' => $this->order->id],
            [
                'provider' => 'google_drive',
                'drive_file_id' => $targetId,
                'drive_link' => $targetLink,
                'granted_to' => $buyer->email,
                'status' => 'delivered',
                'delivered_at' => now(),
            ]
        );

        $fileCount = $kind === 'folder' ? $product->files()->count() : $files->count();
        $fileLabel = $fileCount > 1 ? ' (' . $fileCount . ' file)' : '';

        InboxMessage::create([
            'user_id' => $buyer->id,
            'order_id' => $this->order->id,
            'subject' => 'Pesanan: '.$product->title,
            'body' => 'Pembayaran Anda telah berhasil. "'.$product->title.'"'.$fileLabel.' sudah siap diunduh. Klik tombol di bawah untuk membukanya di Google Drive.',
            'button_label' => $kind === 'folder' ? 'Buka Folder di Drive' : 'Buka File di Drive',
            'button_url' => $targetLink,
            'is_read' => false,
        ]);
    }
}