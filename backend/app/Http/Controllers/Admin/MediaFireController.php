<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAudit;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MediaFireController extends Controller
{
    public const ACCOUNT_KEY = 'mediafire_account';

    public function status(): JsonResponse
    {
        $account = Setting::get(self::ACCOUNT_KEY);

        return response()->json([
            'connected' => (bool) $account,
            'account' => $account,
        ]);
    }

    public function connect(Request $request): JsonResponse
    {
        $account = trim((string) $request->input('account'));

        if ($account === '') {
            return response()->json(['message' => 'Referensi akun MediaFire wajib diisi.'], 422);
        }

        Setting::set(self::ACCOUNT_KEY, $account);

        AdminAudit::log('mediafire.connect', null, ['account' => $account]);

        return response()->json([
            'ok' => true,
            'connected' => true,
            'account' => $account,
        ]);
    }

    public function disconnect(): JsonResponse
    {
        Setting::set(self::ACCOUNT_KEY, null);

        AdminAudit::log('mediafire.disconnect');

        return response()->json(['ok' => true]);
    }
}
