import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardShell } from '../components/layout/DashboardShell'
import { useAuth } from '../context/AuthContext'
import {
  getInbox,
  getPurchases,
  markInboxRead,
  type InboxMessage,
  type Purchase,
} from '../api/orders'
import { BellIcon, CreditCardIcon, GiftIcon, ShoppingBagIcon } from '../components/ui/icons'
import { Skeleton } from '../components/ui/Skeleton'
import { CoverImage } from '../components/ui/CoverImage'

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bubble-card p-5 flex items-center gap-4">
      <span className="kpi-icon">{icon}</span>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-slate-400 mt-1.5">{label}</p>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { user } = useAuth()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [inbox, setInbox] = useState<InboxMessage[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [p, m] = await Promise.all([getPurchases(), getInbox()])
      setPurchases(p)
      setInbox(m)
    } catch {
      // abaikan
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const unread = inbox.filter((m) => !m.is_read).length
  const paidCount = purchases.filter((p) => p.total_idr > 0).length
  const freeCount = purchases.filter((p) => p.total_idr === 0).length

  const handleOpenMessage = async (m: InboxMessage) => {
    if (!m.is_read) {
      setInbox((prev) => prev.map((x) => (x.id === m.id ? { ...x, is_read: true } : x)))
      await markInboxRead(m.id)
    }
    if (m.button_url) {
      window.open(m.button_url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <DashboardShell
      title="Dashboard"
      subtitle={`Selamat datang, ${user?.name ?? ''}`}
      actions={
        user?.is_admin ? (
          <Link to="/admin/products" className="px-4 py-2 btn-ghost">
            Kelola Produk
          </Link>
        ) : undefined
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={<ShoppingBagIcon />} label="Total Pembelian" value={purchases.length} />
        <Kpi icon={<CreditCardIcon />} label="Berbayar" value={paidCount} />
        <Kpi icon={<GiftIcon />} label="Gratis" value={freeCount} />
        <Kpi icon={<BellIcon />} label="Pesan Belum Dibaca" value={unread} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h2 className="text-lg font-semibold mb-4">Pembelian Saya</h2>
          {loading ? (
            <ul className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="bubble-card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <Skeleton className="w-14 h-14 rounded-xl" />
                    <div className="min-w-0 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-16" />
                </li>
              ))}
            </ul>
          ) : purchases.length === 0 ? (
            <div className="bubble-card p-6 text-sm text-slate-400">
              Belum ada pembelian.{' '}
              <Link to="/" className="text-cyan-300 hover:underline">
                Jelajahi produk →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {purchases.map((p) => (
                <li key={p.id} className="bubble-card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <CoverImage
                      src={p.product.cover_url}
                      alt={p.product.title}
                      className="w-14 h-14 rounded-xl object-cover"
                      markClassName="w-7 h-7 opacity-90"
                    />
                    <div className="min-w-0">
                      <Link
                        to={`/product/${p.product.slug}`}
                        className="text-sm font-semibold truncate hover:text-indigo-300"
                      >
                        {p.product.title}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.paid_at ? new Date(p.paid_at).toLocaleString('id-ID') : ''} ·{' '}
                        {p.total_formatted}
                      </p>
                    </div>
                  </div>
                  {p.drive_link ? (
                    <a
                      href={p.drive_link}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 px-4 py-2 btn-primary text-xs"
                    >
                      Buka File
                    </a>
                  ) : (
                    <span className="shrink-0 text-xs text-amber-300">
                      {p.fulfilled ? 'Siap' : 'Menunggu file...'}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            Inbox
            {unread > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-xs font-bold">
                {unread}
              </span>
            )}
          </h2>
          {loading ? (
            <ul className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="bubble-card p-4 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </li>
              ))}
            </ul>
          ) : inbox.length === 0 ? (
            <div className="bubble-card p-6 text-sm text-slate-400">Belum ada pesan.</div>
          ) : (
            <ul className="space-y-3">
              {inbox.map((m) => (
                <li
                  key={m.id}
                  className={`bubble-card p-4 transition ${
                    m.is_read ? 'opacity-75' : 'border-indigo-400/40'
                  }`}
                >
                  <p className="text-sm font-semibold">{m.subject}</p>
                  <p className="mt-1 text-xs text-slate-400">{m.body}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {new Date(m.created_at).toLocaleString('id-ID')}
                    </span>
                    {m.button_url && (
                      <button
                        onClick={() => handleOpenMessage(m)}
                        className="text-xs text-cyan-300 hover:underline"
                      >
                        Buka File
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
