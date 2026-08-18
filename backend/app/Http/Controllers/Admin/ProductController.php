<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAudit;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductFile;
use App\Services\GoogleDriveService;
use App\Services\MediaFireLinkResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    public function __construct(private GoogleDriveService $drive, private MediaFireLinkResolver $resolver)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $limit = min((int) $request->input('limit', 100), 500);

        $products = Product::with(['category:id,name,slug,has_demo,kind', 'files'])
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn (Product $product) => $this->shape($product));

        return response()->json($products);
    }

    protected function shape(Product $product): array
    {
        return [
            'id' => $product->id,
            'title' => $product->title,
            'slug' => $product->slug,
            'description' => $product->description,
            'price_idr' => $product->price_idr,
            'price_formatted' => $product->price_formatted,
            'demo_url' => $product->demo_url,
            'cover_image' => $product->cover_image,
            'cover_url' => $product->coverUrl(),
            'drive_file_id' => $product->drive_file_id,
            'drive_folder_id' => $product->drive_folder_id,
            'storage_provider' => $product->storage_provider ?? 'google_drive',
            'mediafire_link' => $product->mediafire_link,
            'mediafire_page_url' => $product->mediafire_page_url,
            'mediafire_link_resolved_at' => $product->mediafire_link_resolved_at?->toDateTimeString(),
            'category_id' => $product->category_id,
            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
                'slug' => $product->category->slug,
                'has_demo' => $product->category->has_demo,
                'kind' => $product->category->kind,
            ] : null,
            'files' => $product->files->map(fn (ProductFile $f) => [
                'id' => $f->id,
                'file_name' => $f->file_name,
                'drive_file_id' => $f->drive_file_id,
            ]),
            'files_count' => $product->files->count(),
            'is_active' => $product->is_active,
            'created_at' => $product->created_at?->toDateTimeString(),
            'updated_at' => $product->updated_at?->toDateTimeString(),
        ];
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $category = $this->resolveCategory($request->input('category_id'));

        if (! $category || ! $category->has_demo) {
            $data['demo_url'] = null;
        }

        $provider = $request->input('storage_provider', 'google_drive');
        $data['storage_provider'] = $provider;

        $product = new Product($data);
        $product->category_id = $category?->id;
        $product->is_active = $request->boolean('is_active', true);

        if ($request->hasFile('cover')) {
            foreach ($this->storeCover($request->file('cover')) as $key => $value) {
                $product->$key = $value;
            }
        }

        $files = [];

        if ($provider === 'google_drive') {
            $files = $this->collectFiles($request, $category);

            if (count($files) > 0) {
                $folderId = $this->drive->ensureProductFolder($this->folderName($request->input('title')));
                $product->drive_folder_id = $folderId;

                $rows = [];
                $firstFileId = null;

                foreach ($files as $index => $file) {
                    $uploaded = $this->uploadToDrive($file, $folderId);
                    $firstFileId ??= $uploaded['id'];

                    $rows[] = [
                        'drive_file_id' => $uploaded['id'],
                        'file_name' => $uploaded['name'],
                        'sort_order' => $index,
                    ];
                }

                $product->drive_file_id = $firstFileId;
            }
        } else {
            foreach ($this->resolveMediaFireLink($request) as $key => $value) {
                $product->$key = $value;
            }
        }

        $product->save();

        if (isset($rows)) {
            $product->files()->createMany($rows);
        }

        AdminAudit::log('product.create', $product, [
            'title' => $product->title,
            'price_idr' => $product->price_idr,
            'category' => $category?->name,
            'files' => count($files),
        ]);

        return response()->json($this->shape($product->load(['category:id,name,slug,has_demo,kind', 'files'])), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $product = Product::query()->findOrFail($id);

        $data = $this->validated($request);
        $data['is_active'] = $request->boolean('is_active', $product->is_active);
        $data['category_id'] = $request->input('category_id');

        $provider = $request->input('storage_provider', $product->storage_provider ?? 'google_drive');
        $data['storage_provider'] = $provider;

        $category = $this->resolveCategory($request->input('category_id'));

        if (! $category || ! $category->has_demo) {
            $data['demo_url'] = null;
        }

        if ($request->hasFile('cover')) {
            $this->deleteCover($product);
            $data = array_merge($data, $this->storeCover($request->file('cover')));
        }

        if ($provider === 'google_drive') {
            $files = $this->collectFiles($request, $category);

            if (count($files) > 0) {
                $folderId = $this->drive->ensureProductFolder($this->folderName($request->input('title', $product->title)));
                $data['drive_folder_id'] = $folderId;

                $sortOrder = $product->files()->max('sort_order') ?? 0;

                foreach ($files as $file) {
                    $uploaded = $this->uploadToDrive($file, $folderId);

                    $product->files()->create([
                        'drive_file_id' => $uploaded['id'],
                        'file_name' => $uploaded['name'],
                        'sort_order' => ++$sortOrder,
                    ]);
                }

                if (! $product->drive_file_id) {
                    $data['drive_file_id'] = $product->files()->orderBy('sort_order')->orderBy('id')->value('drive_file_id');
                }
            }
        } else {
            $data = array_merge($data, $this->resolveMediaFireLink($request));
        }

        $product->fill($data);
        $product->save();

        AdminAudit::log('product.update', $product, [
            'title' => $product->title,
            'price_idr' => $product->price_idr,
            'category' => $category?->name,
        ]);

        return response()->json($this->shape($product->load(['category:id,name,slug,has_demo,kind', 'files'])));
    }

    public function destroy(int $id): JsonResponse
    {
        $product = Product::query()->findOrFail($id);

        $this->deleteCover($product);

        AdminAudit::log('product.delete', $product, ['title' => $product->title]);

        $product->delete();

        return response()->json(['ok' => true]);
    }

    public function destroyFile(int $id, int $fileId): JsonResponse
    {
        $product = Product::query()->findOrFail($id);

        $file = $product->files()->findOrFail($fileId);

        if ($file->drive_file_id) {
            $this->drive->trashFile($file->drive_file_id);
        }

        AdminAudit::log('product.file.delete', $product, [
            'title' => $product->title,
            'file_name' => $file->file_name,
        ]);

        $file->delete();

        if ($product->drive_file_id === $file->drive_file_id) {
            $next = $product->files()->orderBy('sort_order')->orderBy('id')->first();
            $product->update(['drive_file_id' => $next?->drive_file_id]);
        }

        return response()->json(['ok' => true]);
    }

    protected function collectFiles(Request $request, ?Category $category): array
    {
        $files = $request->file('files', []);

        if (! is_array($files)) {
            $files = [];
        }

        if ($request->hasFile('file')) {
            $files[] = $request->file('file');
        }

        if (count($files) === 0) {
            return [];
        }

        $allowedList = $category
            ? $category->allowedExtensions()
            : (new Category)->allowedExtensions();

        $files = array_values(array_filter($files, fn ($file) => $file instanceof UploadedFile));

        foreach ($files as $file) {
            $extension = strtolower($file->getClientOriginalExtension());

            if (! in_array($extension, $allowedList, true)) {
                throw ValidationException::withMessages([
                    'files' => 'File "'.$file->getClientOriginalName().'" tidak diizinkan untuk kategori ini. Diizinkan: '.implode(', ', $allowedList).'.',
                ]);
            }
        }

        return $files;
    }

    protected function resolveCategory(mixed $categoryId): ?Category
    {
        if (! $categoryId) {
            return null;
        }

        $category = Category::query()->find((int) $categoryId);

        if (! $category) {
            throw ValidationException::withMessages([
                'category_id' => 'Kategori tidak ditemukan.',
            ]);
        }

        return $category;
    }

    protected function uploadToDrive(UploadedFile $file, string $folderId): array
    {
        if (! $this->drive->isConfigured()) {
            throw ValidationException::withMessages([
                'files' => 'Google Drive belum terhubung. Klik "Hubungkan Google Drive" terlebih dahulu.',
            ]);
        }

        try {
            return $this->drive->uploadIntoFolder($folderId, $file->getRealPath(), $file->getClientOriginalName());
        } catch (\Throwable $e) {
            Log::error('Upload file produk ke Google Drive gagal: '.$e->getMessage());

            throw ValidationException::withMessages([
                'files' => 'Gagal mengunggah file ke Google Drive. Periksa koneksi Drive lalu coba lagi.',
            ]);
        }
    }

    protected function validated(Request $request): array
    {
        $rules = [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price_idr' => ['required', 'integer', 'min:0'],
            'demo_url' => ['nullable', 'url'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'storage_provider' => ['sometimes', 'string', 'in:google_drive,mediafire'],
            'mediafire_link' => ['nullable', 'string', 'max:2000'],
            'mediafire_page_url' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['sometimes', 'in:0,1,true,false'],
            'cover' => ['nullable', 'image', 'max:4096'],
            'files' => ['nullable', 'array'],
            'files.*' => ['nullable', 'file', 'max:204800'],
            'file' => ['nullable', 'file', 'max:204800'],
        ];

        return $request->validate($rules);
    }

    protected function storeCover(UploadedFile $file): array
    {
        // Simpan cover ke Google Drive bila terhubung (awet saat redeploy hosting
        // ephemeral), dengan fallback ke disk lokal agar produk tetap bisa dibuat.
        if ($this->drive->isConfigured()) {
            try {
                $fileId = $this->drive->uploadCover($file->getRealPath(), $file->getClientOriginalName());

                return ['cover_drive_file_id' => $fileId];
            } catch (\Throwable $e) {
                Log::warning('Upload cover ke Google Drive gagal, fallback ke penyimpanan lokal: '.$e->getMessage());
            }
        }

        return ['cover_image' => $file->store('covers', 'public')];
    }

    protected function deleteCover(Product $product): void
    {
        if ($product->cover_drive_file_id) {
            $this->drive->trashFile($product->cover_drive_file_id);
        }

        if ($product->cover_image) {
            Storage::disk('public')->delete($product->cover_image);
        }
    }

    protected function folderName(string $title): string
    {
        $name = preg_replace('/[^\p{L}\p{N} _\-]/u', '', $title);

        return mb_substr($name ?: 'Produk', 0, 60);
    }

    protected function resolveMediaFireLink(Request $request): array
    {
        $pageUrl = trim((string) $request->input('mediafire_page_url'));

        if ($pageUrl === '') {
            return [];
        }

        try {
            $link = $this->resolver->resolve($pageUrl);
        } catch (\Throwable $e) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'mediafire_page_url' => $e->getMessage(),
            ]);
        }

        return [
            'mediafire_link' => $link,
            'mediafire_page_url' => $pageUrl,
            'mediafire_link_resolved_at' => now(),
        ];
    }
}