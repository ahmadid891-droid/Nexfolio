<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'product_id',
        'total_idr',
        'status',
        'payment_type',
        'midtrans_order_id',
        'payment_method',
        'payment_info',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'total_idr' => 'integer',
            'payment_info' => 'array',
            'paid_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function fulfillment(): HasMany
    {
        return $this->hasMany(OrderFulfillment::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(InboxMessage::class);
    }
}