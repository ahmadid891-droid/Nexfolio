<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $base = Product::query()
            ->with(['category:id,name,slug,has_demo', 'files:id,product_id,file_name'])
            ->where('is_active', true);

        if ($request->filled('category')) {
            $category = Category::query()
                ->where('slug', $request->input('category'))
                ->where('is_active', true)
                ->first();

            if (! $category) {
                return response()->json([]);
            }

            $base->where('category_id', $category->id);
        }

        $products = $base->orderByDesc('id')->get()->map(fn (Product $product) => $this->shape($product));

        return response()->json($products);
    }

    public function show(string $slug): JsonResponse
    {
        $product = Product::query()
            ->with(['category:id,name,slug,has_demo', 'files:id,product_id,file_name'])
            ->where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        return response()->json($this->shape($product));
    }

    protected function shape(Product $product): array
    {
        $files = $product->files->map(fn ($file) => [
            'id' => $file->id,
            'file_name' => $file->file_name,
        ]);

        return [
            'id' => $product->id,
            'title' => $product->title,
            'slug' => $product->slug,
            'description' => $product->description,
            'price_idr' => $product->price_idr,
            'price_formatted' => $product->price_formatted,
            'is_paid' => $product->price_idr > 0,
            'demo_url' => $product->demo_url,
            'cover_url' => $product->cover_image
                ? url('storage/'.$product->cover_image)
                : null,
            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
                'slug' => $product->category->slug,
                'has_demo' => $product->category->has_demo,
            ] : null,
            'category_id' => $product->category_id,
            'files' => $files,
            'files_count' => $files->count(),
            'has_drive_file' => $files->count() > 0 || ! is_null($product->drive_file_id),
        ];
    }
}