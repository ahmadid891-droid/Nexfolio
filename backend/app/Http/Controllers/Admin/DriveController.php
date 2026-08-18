<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\GoogleDriveService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;

class DriveController extends Controller
{
    public function __construct(private GoogleDriveService $drive)
    {
    }

    public function start(): RedirectResponse
    {
        if ($this->drive->isConfigured()) {
            return Redirect::to(rtrim(config('app.frontend_url'), '/').'/admin/drive-status?status=connected');
        }

        return Redirect::to($this->drive->authUrl());
    }

    public function callback(Request $request): RedirectResponse
    {
        try {
            if (! $request->filled('code')) {
                throw new \RuntimeException('Google tidak mengembalikan kode OAuth.');
            }

            $this->drive->exchangeCode($request->string('code')->toString());
            $this->drive->ensureFolder();

            $status = 'ok';
        } catch (\Throwable $e) {
            Log::error('Drive OAuth callback failed: '.$e->getMessage());
            $status = 'error';
        }

        return Redirect::to(rtrim(config('app.frontend_url'), '/').'/admin/drive-status?status='.$status);
    }
}
