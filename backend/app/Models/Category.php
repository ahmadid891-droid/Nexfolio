<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Category extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'has_demo',
        'kind',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'has_demo' => 'boolean',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Category $category) {
            if (empty($category->slug)) {
                $slug = Str::slug($category->name);

                $exists = Category::query()
                    ->where('slug', $slug)
                    ->where('id', '!=', $category->id)
                    ->exists();

                $category->slug = $exists
                    ? $slug.'-'.Str::lower(Str::random(4))
                    : $slug;
            }
        });
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function getIsCodeAttribute(): bool
    {
        return $this->kind === 'code';
    }

    public function allowedExtensions(): array
    {
        $base = ['pdf', 'md', 'doc', 'docx', 'txt'];

        if ($this->kind === 'code') {
            return [...$base, 'zip', 'rar', '7z', 'dll'];
        }

        return $base;
    }
}
