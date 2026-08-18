<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAudit;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::query()
            ->withCount('products')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'has_demo' => $category->has_demo,
                'kind' => $category->kind,
                'sort_order' => $category->sort_order,
                'is_active' => $category->is_active,
                'product_count' => $category->products_count,
            ]);

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $category = Category::create($data);

        AdminAudit::log('category.create', $category, ['name' => $category->name]);

        return response()->json($category, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $category = Category::query()->findOrFail($id);

        $data = $this->validated($request);

        if ($request->filled('name') && $data['name'] !== $category->name) {
            $data['slug'] = $this->generateUniqueSlug($data['name'], $category->id);
        }

        $category->fill($data);
        $category->save();

        AdminAudit::log('category.update', $category, ['name' => $category->name]);

        return response()->json($category);
    }

    public function destroy(int $id): JsonResponse
    {
        $category = Category::query()->findOrFail($id);

        AdminAudit::log('category.delete', $category, ['name' => $category->name]);

        $category->delete();

        return response()->json(['ok' => true]);
    }

    protected function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'has_demo' => ['sometimes', 'boolean'],
            'kind' => ['nullable', 'string', 'in:documents,code'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }

    protected function generateUniqueSlug(string $name, int $ignoreId = 0): string
    {
        $slug = Str::slug($name);

        $exists = Category::query()
            ->where('slug', $slug)
            ->where('id', '!=', $ignoreId)
            ->exists();

        return $exists ? $slug.'-'.Str::lower(Str::random(4)) : $slug;
    }
}
