<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;

class LoginLog extends Model
{
    protected $fillable = [
        'user_id',
        'ip_address',
        'user_agent',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function record(Model $user, Request $request): void
    {
        self::create([
            'user_id' => $user->getKey(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }

    public static function recent(int $limit = 100): array
    {
        $logs = self::query()
            ->with('user')
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn (self $log) => [
                'id' => $log->id,
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'created_at' => $log->created_at->toDateTimeString(),
                'user' => $log->user ? [
                    'name' => $log->user->name,
                    'email' => $log->user->email,
                    'avatar' => $log->user->avatar,
                ] : null,
            ]);

        return [
            'logs' => $logs,
            'total' => self::query()->count(),
            'unique_ips' => self::query()->distinct('ip_address')->count('ip_address'),
        ];
    }
}
