import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { CheckoutModal } from '../components/CheckoutModal'
import {
  getPublicProduct,
  getProductComments,
  createProductComment,
  deleteProductComment,
  toggleCommentLike,
  type Comment,
  type Product,
} from '../api/products'
import { useAuth } from '../context/AuthContext'
import { Skeleton } from '../components/ui/Skeleton'
import { CoverImage } from '../components/ui/CoverImage'

type CommentMode = 'open' | 'minimized' | 'maximized'

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [loginPrompt, setLoginPrompt] = useState(false)

  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentBody, setCommentBody] = useState('')
  const [commentError, setCommentError] = useState('')
  const [commentSending, setCommentSending] = useState(false)
  const [commentMode, setCommentMode] = useState<CommentMode>('minimized')
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [replySending, setReplySending] = useState(false)
  const [replyingError, setReplyingError] = useState('')

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    getPublicProduct(slug)
      .then((p) => {
        setProduct(p)
        setNotFound(false)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))

    setCommentsLoading(true)
    getProductComments(slug)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false))
  }, [slug])

  useEffect(() => {
    const onToggle = () =>
      setCommentMode((m) => (m === 'open' ? 'minimized' : 'open'))
    window.addEventListener('nexfolio:toggle-comments', onToggle)
    return () => window.removeEventListener('nexfolio:toggle-comments', onToggle)
  }, [])

  const handleBuy = () => {
    if (authLoading) return
    if (!user) {
      setLoginPrompt(true)
      return
    }
    setCheckoutOpen(true)
  }

  const handleCheckoutSuccess = () => {
    setCheckoutOpen(false)
    navigate('/dashboard/purchases')
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = commentBody.trim()
    if (!slug || !body) return
    setCommentSending(true)
    setCommentError('')
    try {
      const created = await createProductComment(slug, body)
      setComments((prev) => [created, ...prev])
      setCommentBody('')
    } catch {
      setCommentError('Gagal mengirim komentar. Coba lagi.')
    } finally {
      setCommentSending(false)
    }
  }

  const handleDeleteComment = async (id: number) => {
    if (!window.confirm('Hapus komentar ini?')) return
    try {
      await deleteProductComment(id)
      setComments((prev) => prev.filter((c) => c.id !== id))
    } catch {
      setCommentError('Gagal menghapus komentar.')
    }
  }

  const handleToggleLike = async (comment: Comment) => {
    if (!user) return
    try {
      const result = await toggleCommentLike(comment.id)
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === comment.id) return { ...c, liked: result.liked, likes_count: result.likes_count }
          if (c.replies.some((r) => r.id === comment.id)) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === comment.id ? { ...r, liked: result.liked, likes_count: result.likes_count } : r,
              ),
            }
          }
          return c
        }),
      )
    } catch {
      // ignore
    }
  }

  const handleSubmitReply = async (parentId: number) => {
    const body = replyBody.trim()
    if (!slug || !body) return
    setReplySending(true)
    setReplyingError('')
    try {
      const created = await createProductComment(slug, body, parentId)
      const appendReply = (list: Comment[]): Comment[] =>
        list.map((c) => {
          if (c.id === parentId) return { ...c, replies: [...c.replies, created] }
          if (c.replies.some((r) => r.id === parentId)) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === parentId ? { ...r, replies: [...r.replies, created] } : r,
              ),
            }
          }
          return { ...c, replies: appendReply(c.replies) }
        })
      setComments((prev) => appendReply(prev))
      setReplyBody('')
      setReplyingTo(null)
    } catch {
      setReplyingError('Gagal mengirim balasan. Coba lagi.')
    } finally {
      setReplySending(false)
    }
  }

  const avatarOf = (name: string, avatar: string | null) =>
    avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`

  const canDelete = (commentUserId: number) => user?.id === commentUserId || user?.is_admin === true

  const countComments = (list: Comment[]): number =>
    list.reduce((acc, c) => acc + 1 + countComments(c.replies), 0)

  const totalComments = countComments(comments)

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('nexfolio:comment-count', { detail: { count: totalComments } }))
  }, [totalComments])

  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('nexfolio:comment-count', { detail: { count: 0 } }))
    }
  }, [])

  if (loading) {
    return (
      <Layout>
        <section className="max-w-4xl mx-auto px-4 py-10">
          <div className="mt-6 flex flex-col lg:flex-row gap-8">
            <div className="flex-shrink-0 w-80 lg:w-96">
              <Skeleton className="w-full aspect-video rounded-2xl" />
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <Skeleton className="h-9 w-2/3" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-10 w-40 rounded-lg mt-2" />
              <Skeleton className="h-40 w-full rounded-xl mt-2" />
            </div>
          </div>
        </section>
      </Layout>
    )
  }

  if (notFound || !product) {
    return (
      <Layout>
        <section className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-semibold">Produk tidak ditemukan</h1>
          <Link to="/" className="mt-4 inline-block text-sm text-cyan-300 hover:underline">
            ← Kembali ke Beranda
          </Link>
        </section>
      </Layout>
    )
  }

  return (
    <Layout>
       <section className="max-w-4xl mx-auto px-4 py-10">
         <Link to="/" className="text-sm text-slate-400 hover:text-white">
           ← Kembali ke Beranda
         </Link>

         <div className="mt-6 flex flex-col lg:flex-row gap-8">
           {/* Left: product image */}
           <div className="flex-shrink-0 w-80 lg:w-96">
              <CoverImage
                src={product.cover_url}
                alt={product.title}
                className="w-full rounded-2xl border border-white/15 object-cover aspect-video"
                markClassName="w-24 h-24 opacity-90"
              />

             <div className="mt-4 flex items-center gap-2">
               <span className="chip text-slate-200">{product.is_paid ? 'Berbayar' : 'Gratis'}</span>
               {product.category && (
                 <span className="chip text-slate-200">{product.category.name}</span>
               )}
               {product.demo_url && (
                 <a
                   href={product.demo_url}
                   target="_blank"
                   rel="noreferrer"
                   className="inline-block px-2 py-1 rounded-md text-xs font-medium bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 transition"
                 >
                   Coba Demo
                 </a>
               )}
             </div>
           </div>

            {/* Right: product details and comments */}
            <div className="flex-1 flex flex-col gap-6">
              {/* Product details */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight">{product.title}</h1>
                {product.price_idr > 0 && (
                  <p className="mt-3 text-2xl font-semibold text-indigo-300">{product.price_formatted}</p>
                )}

                {product.files_count ? (
                  <p className="mt-2 text-sm text-slate-400">
                    {product.files_count} file siap diunduh setelah pembelian
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Belum ada file lampiran</p>
                )}

                <div className="mt-4 text-slate-300 whitespace-pre-line">
                  {product.description || 'Belum ada deskripsi.'}
                </div>

                {product.demo_url && (
                  <a
                    href={product.demo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex items-center justify-center px-6 py-3 btn-ghost"
                  >
                    Akses Demo Gratis
                  </a>
                )}

                <button
                  onClick={handleBuy}
                  className="mt-3 inline-flex items-center justify-center px-6 py-3 btn-primary"
                >
                  {product.is_paid ? 'Beli Sekarang' : 'Dapatkan Gratis'}
                </button>

                {loginPrompt && (
                  <div className="mt-4 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/40 text-sm text-amber-300">
                    Silakan <Link to="/login" className="underline">masuk</Link> terlebih dahulu untuk
                    membeli produk.
                  </div>
                )}
              </div>

{product && (
                <CheckoutModal
                  productId={product.id}
                  title={product.title}
                  priceFormatted={product.price_formatted ?? `Rp${product.price_idr}`}
                  isPaid={product.is_paid ?? false}
                  open={checkoutOpen}
                  onClose={() => setCheckoutOpen(false)}
                  onSuccess={handleCheckoutSuccess}
                />
              )}
            </div>
          </div>

          <div
            className={`comment-panel ${
              commentMode === 'minimized'
                ? 'comment-panel-minimized'
                : commentMode === 'maximized'
                  ? 'comment-panel-maximized'
                  : ''
            }`}
          >
              <div className="comment-panel-header">
                <div className="comment-win-controls">
                  <button
                    className="comment-ctl comment-ctl-close"
                    title="Tutup"
                    onClick={() => setCommentMode('minimized')}
                  />
                  <button
                    className="comment-ctl comment-ctl-min"
                    title="Minimalkan"
                    onClick={() => setCommentMode('minimized')}
                  />
                  <button
                    className="comment-ctl comment-ctl-max"
                    title="Maksimalkan"
                    onClick={() =>
                      setCommentMode((m) => (m === 'maximized' ? 'open' : 'maximized'))
                    }
                  />
                </div>
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  Komentar
                  {totalComments > 0 && <span className="comment-count">{totalComments}</span>}
                </h2>
              </div>

              <div className="comment-box">
                {user ? (
                  <form onSubmit={handleSubmitComment} className="comment-item">
                    <img
                      src={avatarOf(user.name, user.avatar)}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200">{user.name}</p>
                      <textarea
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                        placeholder="Tulis komentar Anda..."
                        rows={2}
                        maxLength={1000}
                        className="comment-textarea"
                      />
                      {commentError && <p className="mt-2 text-xs text-rose-300">{commentError}</p>}
                      <button
                        type="submit"
                        disabled={commentSending || !commentBody.trim()}
                        className="mt-3 inline-flex items-center justify-center px-5 py-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {commentSending ? 'Mengirim...' : 'Kirim Komentar'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="comment-item">
                    <div className="text-sm text-slate-400">
                      Silakan{' '}
                      <Link to="/login" className="text-cyan-300 underline">
                        masuk
                      </Link>{' '}
                      terlebih dahulu untuk berkomentar.
                    </div>
                  </div>
                )}

                <div className="comment-list">
                  {commentsLoading ? (
                    <div className="space-y-4 mt-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="comment-item !items-start">
                          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-slate-500">Belum ada komentar. Jadilah yang pertama!</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id}>
                        <CommentItem
                          comment={c}
                          user={user}
                          avatarOf={avatarOf}
                          canDelete={canDelete}
                          onToggleLike={handleToggleLike}
                          onDelete={handleDeleteComment}
                          replyingTo={replyingTo}
                          setReplyingTo={setReplyingTo}
                          replyBody={replyBody}
                          setReplyBody={setReplyBody}
                          replySending={replySending}
                          replyError={replyingError}
                          onReply={handleSubmitReply}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
       </section>
    </Layout>
  )
}

interface CommentItemProps {
  comment: Comment
  user: { id: number; name: string; avatar: string | null } | null
  avatarOf: (name: string, avatar: string | null) => string
  canDelete: (commentUserId: number) => boolean
  onToggleLike: (comment: Comment) => void
  onDelete: (id: number) => void
  replyingTo: number | null
  setReplyingTo: (id: number | null) => void
  replyBody: string
  setReplyBody: (body: string) => void
  replySending: boolean
  replyError: string
  onReply: (parentId: number) => void
}

function CommentItem({
  comment,
  user,
  avatarOf,
  canDelete,
  onToggleLike,
  onDelete,
  replyingTo,
  setReplyingTo,
  replyBody,
  setReplyBody,
  replySending,
  replyError,
  onReply,
}: CommentItemProps) {
  const isReplying = replyingTo === comment.id

  return (
    <div className="comment-item">
      <img
        src={avatarOf(comment.user?.name ?? 'User', comment.user?.avatar ?? null)}
        alt={comment.user?.name ?? 'User'}
        referrerPolicy="no-referrer"
        className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-100">{comment.user?.name ?? 'User'}</span>
          <span className="text-xs text-slate-500">{comment.created_at}</span>
          {comment.user && canDelete(comment.user.id) && (
            <button
              onClick={() => onDelete(comment.id)}
              className="ml-auto text-xs text-rose-300/80 hover:text-rose-300 transition"
            >
              Hapus
            </button>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-300 whitespace-pre-line">{comment.body}</p>

        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={() => onToggleLike(comment)}
            disabled={!user}
            className={`text-xs font-medium inline-flex items-center gap-1 transition ${
              comment.liked ? 'text-cyan-300' : 'text-slate-400 hover:text-cyan-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <svg
              viewBox="0 0 24 24"
              fill={comment.liked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.8"
              className="w-3.5 h-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 10v10M7 10l4-7a3 3 0 0 1 3 3v4h4.5a2 2 0 0 1 2 2.5l-1.6 6A2 2 0 0 1 16.9 20H7"
              />
            </svg>
            {comment.likes_count > 0 ? comment.likes_count : 'Suka'}
          </button>

          <button
            onClick={() => {
              if (!user) return
              setReplyingTo(isReplying ? null : comment.id)
              setReplyBody('')
            }}
            className="text-xs font-medium text-slate-400 hover:text-cyan-300 transition inline-flex items-center gap-1"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="w-3.5 h-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 10c0-3-3-6-7-6s-7 3-7 6 3 6 7 6c.6 0 1.2 0 1.8-.1L19 19v-5.5a5.7 5.7 0 0 0 0-3.5z"
              />
            </svg>
            Balas
          </button>
        </div>

        {isReplying && (
          <div className="mt-2 flex items-start gap-2">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Tulis balasan..."
              rows={1}
              maxLength={1000}
              className="comment-reply-input"
            />
            <button
              onClick={() => onReply(comment.id)}
              disabled={replySending || !replyBody.trim()}
              className="shrink-0 px-3 py-1.5 text-xs font-medium btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {replySending ? '...' : 'Kirim'}
            </button>
          </div>
        )}
        {isReplying && replyError && (
          <p className="mt-2 text-xs text-rose-300">{replyError}</p>
        )}

        {comment.replies.length > 0 && (
          <div className="mt-3 space-y-3 border-l border-white/10 pl-3">
            {comment.replies.map((r) => (
              <CommentItem
                key={r.id}
                comment={r}
                user={user}
                avatarOf={avatarOf}
                canDelete={canDelete}
                onToggleLike={onToggleLike}
                onDelete={onDelete}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                replyBody={replyBody}
                setReplyBody={setReplyBody}
                replySending={replySending}
                replyError={replyError}
                onReply={onReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
