<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Request $request, string $slug): JsonResponse
    {
        $product = Product::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        $userId = $request->user()?->id;

        $comments = $product->comments()
            ->whereNull('parent_id')
            ->with(['user:id,name,avatar', 'replies.user:id,name,avatar'])
            ->get()
            ->map(fn (Comment $comment) => $this->shape($comment, $userId));

        return response()->json($comments);
    }

    public function store(Request $request, string $slug): JsonResponse
    {
        $product = Product::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        $data = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
            'parent_id' => ['nullable', 'integer', 'exists:comments,id'],
        ]);

        if (isset($data['parent_id'])) {
            $parent = Comment::query()->where('id', $data['parent_id'])->firstOrFail();
            abort_if($parent->product_id !== $product->id, 422, 'Komentar induk tidak valid.');
        }

        $comment = $product->comments()->create([
            'user_id' => $request->user()->id,
            'parent_id' => $data['parent_id'] ?? null,
            'body' => trim($data['body']),
        ]);

        $comment->load(['user:id,name,avatar', 'replies.user:id,name,avatar']);

        return response()->json($this->shape($comment, $request->user()->id), 201);
    }

    public function toggleLike(Request $request, Comment $comment): JsonResponse
    {
        $user = $request->user();

        $exists = $comment->likedByUsers()->where('users.id', $user->id)->exists();

        if ($exists) {
            $comment->likedByUsers()->detach($user->id);
            $comment->decrement('likes_count');
            $liked = false;
        } else {
            $comment->likedByUsers()->attach($user->id);
            $comment->increment('likes_count');
            $liked = true;
        }

        return response()->json([
            'id' => $comment->id,
            'liked' => $liked,
            'likes_count' => $comment->fresh()->likes_count,
        ]);
    }

    public function destroy(Request $request, Comment $comment): JsonResponse
    {
        $user = $request->user();

        if ($comment->user_id !== $user->id && ! $user->is_admin) {
            abort(403, 'Anda tidak berwenang menghapus komentar ini.');
        }

        $comment->delete();

        return response()->json(['message' => 'Komentar dihapus.']);
    }

    protected function shape(Comment $comment, ?int $userId = null): array
    {
        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'parent_id' => $comment->parent_id,
            'likes_count' => (int) $comment->likes_count,
            'liked' => $userId && $comment->likedByUsers()->where('users.id', $userId)->exists(),
            'created_at' => $comment->created_at?->format('d M Y, H:i'),
            'created_at_raw' => $comment->created_at?->toISOString(),
            'user' => $comment->user ? [
                'id' => $comment->user->id,
                'name' => $comment->user->name,
                'avatar' => $comment->user->avatar,
            ] : null,
            'replies' => $comment->relationLoaded('replies')
                ? $comment->replies
                    ->map(fn (Comment $reply) => $this->shape($reply, $userId))
                    ->values()
                : [],
        ];
    }
}