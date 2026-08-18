import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import {
  getPublicCategories,
  getPublicProducts,
  getSiteStats,
  type Category,
  type Product,
  type SiteStats,
} from '../api/products'
import { CreditCardIcon, FolderIcon, GiftIcon, PlayIcon } from '../components/ui/icons'
import { WipeReveal } from '../components/ui/WipeReveal'
import { Skeleton } from '../components/ui/Skeleton'
import { CoverImage } from '../components/ui/CoverImage'

export function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<SiteStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getPublicProducts(), getPublicCategories(), getSiteStats()])
      .then(([p, c, s]) => {
        setProducts(p)
        setCategories(c)
        setStats(s)
      })
      .catch(() => {
        setProducts([])
        setCategories([])
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!selected) return products
    return products.filter((p) => p.category?.slug === selected)
  }, [products, selected])

  const activeCategory = categories.find((c) => c.slug === selected) ?? null

  const catButton = (
    slug: string | null,
    label: string,
    count?: number,
    active = false,
  ) => (
    <button
      key={slug ?? 'all'}
      onClick={() => setSelected(slug)}
      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-between gap-2 ${
        active
          ? 'bg-white/10 text-white'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className="truncate">{label}</span>
      {typeof count === 'number' && (
        <span className="text-xs text-slate-500 shrink-0">{count}</span>
      )}
    </button>
  )

  return (
    <Layout>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-bg.svg')", zIndex: -10 }}
      />
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
          Karya terbaik,
          <br />
          <span className="text-gradient">di satu tempat.</span>
        </h1>
        <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto">
          Jelajahi proyek, coba demo, dan dapatkan produk digital pilihan — lengkap dengan
          akses instan setelah pembelian.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <a href="#proyek" className="px-6 py-3 btn-primary">
            Lihat Proyek
          </a>
        </div>

        {stats && (
          <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="bubble-card p-5 flex items-center gap-4">
              <span className="kpi-icon">
                <FolderIcon />
              </span>
              <div>
                <p className="text-2xl font-bold leading-none">{stats.total}</p>
                <p className="text-xs text-slate-400 mt-1.5">Total Proyek</p>
              </div>
            </div>
            <div className="bubble-card p-5 flex items-center gap-4">
              <span className="kpi-icon">
                <CreditCardIcon />
              </span>
              <div>
                <p className="text-2xl font-bold leading-none">{stats.paid}</p>
                <p className="text-xs text-slate-400 mt-1.5">Berbayar</p>
              </div>
            </div>
            <div className="bubble-card p-5 flex items-center gap-4">
              <span className="kpi-icon">
                <GiftIcon />
              </span>
              <div>
                <p className="text-2xl font-bold leading-none">{stats.free}</p>
                <p className="text-xs text-slate-400 mt-1.5">Gratis</p>
              </div>
            </div>
            <div className="bubble-card p-5 flex items-center gap-4">
              <span className="kpi-icon">
                <PlayIcon />
              </span>
              <div>
                <p className="text-2xl font-bold leading-none">{stats.with_demo}</p>
                <p className="text-xs text-slate-400 mt-1.5">Demo Tersedia</p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section id="proyek" className="max-w-6xl mx-auto px-4 pb-24">
        <h2 className="text-2xl font-bold mb-8">
          {activeCategory ? activeCategory.name : 'Proyek Unggulan'}
        </h2>

        {/* Mobile category chips */}
        <div className="lg:hidden mb-6 flex items-center gap-2 overflow-x-auto pb-2">
          {catButton(null, 'Semua Proyek', products.length, selected === null)}
          {categories.map((c) =>
            catButton(c.slug, c.name, c.product_count, selected === c.slug),
          )}
        </div>

        <div className="lg:flex lg:gap-10">
          {/* Left sidebar categories */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24 space-y-1">
              <p className="px-3 pb-2 text-xs uppercase tracking-wider text-slate-500">
                Kategori
              </p>
              {catButton(null, 'Semua Proyek', products.length, selected === null)}
              {categories.map((c) =>
                catButton(c.slug, c.name, c.product_count, selected === c.slug),
              )}
            </div>
          </aside>

          {/* Center grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="glass-card overflow-hidden">
                    <Skeleton className="w-full h-40 rounded-none" />
                    <div className="p-6 space-y-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-slate-400">
                {selected
                  ? 'Belum ada produk dalam kategori ini.'
                  : 'Belum ada produk yang ditampilkan.'}
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((p, i) => (
                  <WipeReveal key={p.id} delay={(i % 3) * 70}>
                    <div className="glass-card overflow-hidden">
                    <Link to={`/product/${p.slug}`}>
                      <CoverImage
                        src={p.cover_url}
                        alt={p.title}
                        className="w-full h-40 object-cover"
                        markClassName="w-16 h-16 opacity-90"
                      />
                    </Link>
                    <div className="p-6">
                      <div className="flex items-center justify-between gap-2">
                        <span className="chip text-slate-200">{p.is_paid ? 'Berbayar' : 'Gratis'}</span>
                        {p.price_idr > 0 && (
                          <span className="text-sm font-semibold text-indigo-300">
                            {p.price_formatted}
                          </span>
                        )}
                      </div>
                      {p.category && (
                        <span className="mt-2 inline-block text-xs text-cyan-300">
                          {p.category.name}
                        </span>
                      )}
                      <Link to={`/product/${p.slug}`}>
                        <h3 className="mt-1 text-lg font-semibold hover:text-indigo-300 transition">
                          {p.title}
                        </h3>
                      </Link>
                      <p className="mt-2 text-sm text-slate-400 line-clamp-2">{p.description}</p>
                      <div className="mt-4 flex items-center gap-4">
                        {p.demo_url && (
                          <a
                            href={p.demo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-cyan-300 hover:underline"
                          >
                            Coba Demo →
                          </a>
                        )}
                        <Link to={`/product/${p.slug}`} className="text-sm text-indigo-300 hover:underline">
                          Detail →
                        </Link>
                      </div>
                    </div>
                    </div>
                  </WipeReveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  )
}