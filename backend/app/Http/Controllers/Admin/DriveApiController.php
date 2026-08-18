<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAudit;
use App\Services\GoogleDriveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DriveApiController extends Controller
{
    public function __construct(private GoogleDriveService $drive)
    {
    }

    public function status(Request $request): JsonResponse
    {
        $folderId = \App\Models\Setting::get(GoogleDriveService::FOLDER_KEY);

        if (! $this->drive->isConfigured()) {
            return response()->json([
                'connected' => false,
                'account_email' => null,
                'storage_used' => null,
                'storage_quota' => null,
                'folder_id' => $folderId,
            ]);
        }

        try {
            $about = $this->drive->drive()->about->get([
                'fields' => 'user(emailAddress),storageQuota(limit,usage)',
            ]);

            $user = $about->getUser();
            $quota = $about->getStorageQuota();

            return response()->json([
                'connected' => true,
                'account_email' => $user?->getEmailAddress(),
                'storage_used' => $quota?->getUsage(),
                'storage_quota' => $quota?->getLimit(),
                'folder_id' => $folderId,
            ]);
        } catch (\Throwable $e) {
            Log::error('Drive status check failed: '.$e->getMessage());

            return response()->json([
                'connected' => false,
                'account_email' => null,
                'storage_used' => null,
                'storage_quota' => null,
                'folder_id' => $folderId,
                'error' => 'Koneksi Google Drive bermasalah. Silakan hubungkan ulang.',
            ]);
        }
    }

    public function disconnect(): JsonResponse
    {
        \App\Models\Setting::set(GoogleDriveService::TOKEN_KEY, null);
        \App\Models\Setting::set(GoogleDriveService::FOLDER_KEY, null);

        AdminAudit::log('drive.disconnect');

        return response()->json(['ok' => true]);
    }
}
