<?php

use App\Http\Controllers\Admin\DriveController;
use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::get('google/redirect', [AuthController::class, 'redirectToGoogle'])->name('auth.google.redirect');
    Route::get('google/callback', [AuthController::class, 'handleGoogleCallback'])->name('auth.google.callback');

    if (app()->environment('local')) {
        Route::get('dev/login/{email}', [AuthController::class, 'devLogin'])->name('auth.dev.login');
    }
});

Route::middleware('admin')->prefix('drive/oauth')->group(function () {
    Route::get('/start', [DriveController::class, 'start'])->name('drive.oauth.start');
    Route::get('/callback', [DriveController::class, 'callback'])->name('drive.oauth.callback');
});

/*
 * SPA fallback: serve the built React app (public/index.html) for any
 * non-API / non-asset path so client-side routing works. API/auth/storage
 * misses still return proper JSON/404.
 */
Route::fallback(function (Illuminate\Http\Request $request) {
    if ($request->is('api/*', 'auth/*', 'sanctum/*', 'drive/*', 'storage/*')) {
        abort(404);
    }

    $index = public_path('index.html');

    if (! file_exists($index)) {
        abort(404);
    }

    return response()->file($index);
});
