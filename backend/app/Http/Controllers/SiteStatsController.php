<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SiteStatsController extends Controller
{
    public function index(): JsonResponse
    {
        $base = Product::query()->where('is_active', true);

        return response()->json([
            'total' => (clone $base)->count(),
            'paid' => (clone $base)->where('price_idr', '>', 0)->count(),
            'free' => (clone $base)->where('price_idr', 0)->count(),
            'with_demo' => (clone $base)->whereNotNull('demo_url')->count(),
        ]);
    }

    public function online(): JsonResponse
    {
        $window = now()->getTimestamp() - 300;

        $usersOnline = DB::table('sessions')
            ->whereNotNull('user_id')
            ->where('last_activity', '>', $window)
            ->distinct('user_id')
            ->count('user_id');

        $startOfDay = now()->startOfDay()->getTimestamp();

        $visitorsToday = DB::table('sessions')
            ->where('last_activity', '>=', $startOfDay)
            ->count();

        return response()->json([
            'users_online' => (int) $usersOnline,
            'visitors_today' => (int) $visitorsToday,
        ]);
    }
}
