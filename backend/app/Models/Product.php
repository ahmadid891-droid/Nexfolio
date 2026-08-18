<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Product extends Model
{
    /** @use HasFactory<\Database\Factories\ProductFactory> */
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'price_idr',
        'demo_url',
        'cover_image',
        'drive_file_id',
        'drive_folder_id',
        'storage_provider',
        'mediafire_link',
        'mediafire_page_url',
        'mediafire_link_resolved_at',
        'category_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price_idr' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(ProductFile::class)->orderBy('sort_order')->orderBy('id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->orderByDesc('id');
    }

    protected static function booted(): void
    {
        static::saving(function (Product $product) {
            if (empty($product->slug)) {
                $product->slug = Str::slug($product->title).'-'.Str::lower(Str::random(5));
            }
        });
    }

    public function getPriceFormattedAttribute(): string
    {
        return 'Rp'.number_format($this->price_idr, 0, ',', '.');
    }
}
