<?php

use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\DriveApiController;
use App\Http\Controllers\Admin\MediaFireController;
use App\Http\Controllers\Admin\LoginLogController;
use App\Http\Controllers\Admin\OrderAdminController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\PaymentNotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicCategoryController;
use App\Http\Controllers\PublicProductController;
use App\Http\Controllers\SiteStatsController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:api')->group(function () {
    Route::get('/health', function () {
        return response()->json(['status' => 'ok']);
    });

    Route::get('/categories', [PublicCategoryController::class, 'index']);
    Route::get('/products', [PublicProductController::class, 'index']);
    Route::get('/products/{slug}', [PublicProductController::class, 'show']);
    Route::get('/products/{slug}/comments', [CommentController::class, 'index']);
    Route::get('/site/stats', [SiteStatsController::class, 'index']);
    Route::get('/online', [SiteStatsController::class, 'online']);

    Route::post('/payments/notification', [PaymentNotificationController::class, 'notification'])
        ->middleware('throttle:payments');
    Route::get('/payment/config', [CheckoutController::class, 'config']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/logout', [AuthController::class, 'logout']);

        Route::post('/checkout', [CheckoutController::class, 'checkout'])->middleware('throttle:checkout');

        Route::post('/products/{slug}/comments', [CommentController::class, 'store']);
        Route::post('/comments/{comment}/like', [CommentController::class, 'toggleLike']);
        Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);

        Route::get('/my/purchases', [ProfileController::class, 'purchases']);
        Route::get('/my/inbox', [ProfileController::class, 'inbox']);
        Route::get('/my/inbox/unread', [ProfileController::class, 'inboxUnread']);
        Route::post('/my/inbox/{id}/read', [ProfileController::class, 'markRead']);
    });

    Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
        Route::get('/products', [ProductController::class, 'index']);
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{id}', [ProductController::class, 'update']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);
        Route::delete('/products/{id}/files/{fileId}', [ProductController::class, 'destroyFile']);

        Route::get('/categories', [CategoryController::class, 'index']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

        Route::get('/drive/status', [DriveApiController::class, 'status']);
        Route::post('/drive/disconnect', [DriveApiController::class, 'disconnect']);

        Route::get('/mediafire/status', [MediaFireController::class, 'status']);
        Route::post('/mediafire/connect', [MediaFireController::class, 'connect']);
        Route::post('/mediafire/disconnect', [MediaFireController::class, 'disconnect']);

        Route::get('/orders', [OrderAdminController::class, 'index']);
        Route::get('/orders/stats', [OrderAdminController::class, 'stats']);
        Route::post('/orders/{id}/retry', [OrderAdminController::class, 'retry']);
        Route::post('/orders/{id}/sync', [OrderAdminController::class, 'sync']);
        Route::post('/orders/{id}/cancel', [OrderAdminController::class, 'cancel']);

        Route::get('/login-logs', [LoginLogController::class, 'index']);
    });
});
