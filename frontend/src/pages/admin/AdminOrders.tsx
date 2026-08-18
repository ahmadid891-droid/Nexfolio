import { useCallback, useEffect, useState } from 'react'
import { DashboardShell } from '../../components/layout/DashboardShell'
import { Skeleton } from '../../components/ui/Skeleton'
import {
  getAdminOrders,
  getAdminOrderStats,
  retryOrderDelivery,
  syncOrderStatus,
  cancelOrder,
  type AdminOrder,
  type AdminOrderStatsResponse,
  type AdminOrdersResponse,
} from '../../api/orders'
import { extractError } from '../../lib/errors'
import {
  BanknotesIcon,
  CheckBadgeIcon,
  ClipboardIcon,
  ClockIcon,
  TruckIcon,
  XCircleIcon,
} from '../../components/ui/icons'

function statusBadge(status: string): { label: string; cls: string } {
  switch (status) {
    case 'paid':
      return { label: 'Paid', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40' }
    case 'pending':
      return { label: 'Pending', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/40' }
    case 'failed':
      return { label: 'Gagal', cls: 'text-red-400 bg-red-500/10 border-red-500/40' }
    default:
      return { label: status, cls: 'text-slate-400 bg-slate-700/20 border-slate-700' }
  }
}

function fulfillmentBadge(status: string): { label: string; cls: string } {
  switch (status) {
    case 'delivered':
      return { label: 'Terkirim', cls: 'text-emerald-400' }
    case 'failed':
      return { label: 'Gagal kirim', cls: 'text-red-400' }
    case 'pending':
      return { label: 'Menunggu', cls: 'text-amber-300' }
    default:
      return { label: 'Belum', cls: 'text-slate-500' }
  }
}

function Kpi({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="bubble-card p-5 flex items-center gap-4">
      <span className="kpi-icon">{icon}</span>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-none truncate">{value}</p>
        <p className="text-xs text-slate-400 mt-1.5">{label}</p>
      </div>
    </div>
  )
}

function OrdersChart({ daily }: { daily: AdminOrderStatsResponse['daily'] }) {
  const max = Math.max(1, ...daily.map((d) => d.orders))

  return (
    <div className="bubble-card p-6">
      <h3 className="text-sm font-semibold">Order 7 Hari Terakhir</h3>
      <p className="text-xs text-slate-500 mt-0.5">Jumlah pesanan (bar) & revenue harian</p>
      <div className="mt-6 h-40 flex items-end gap-3">
        {daily.map((d) => (
          <div key={d.date} className="flex-1 h-full flex items-end">
            <div
              className="w-full rounded-lg bg-gradient-to-t from-indigo-500 to-cyan-400 transition-opacity"
              style={{ height: `${Math.max(4, (d.orders / max) * 100)}%` }}
              title={`${d.label}: ${d.orders} order · Rp${d.revenue_idr.toLocaleString('id-ID')}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3">
        {daily.map((d) => (
          <div key={d.date} className="flex-1 text-center text-xs text-slate-500">
            {d.label}
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-3">
        {daily.map((d) => (
          <div key={d.date} className="flex-1 text-center text-[10px] text-indigo-300">
            {d.revenue_idr > 0 ? `${Math.round(d.revenue_idr / 1000)}k` : '-'}
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminOrders() {
  const [data, setData] = useState<AdminOrdersResponse | null>(null)
  const [stats, setStats] = useState<AdminOrderStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState<number | null>(null)
  const [syncing, setSyncing] = useState<number | null>(null)
  const [cancelling, setCancelling] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      const [orders, st] = await Promise.all([getAdminOrders(), getAdminOrderStats()])
      setData(orders)
      setStats(st)
      setError(null)
    } catch (e) {
      setError(extractError(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleRetry = async (o: AdminOrder) => {
    if (!confirm(`Jadwalkan ulang pengiriman untuk pesanan #${o.id}?`)) return
    setRetrying(o.id)
    try {
      await retryOrderDelivery(o.id)
      setError(null)
      await load()
    } catch (e) {
      setError(extractError(e))
    } finally {
      setRetrying(null)
    }
  }

  const handleSync = async (o: AdminOrder) => {
    setSyncing(o.id)
    try {
      const res = await syncOrderStatus(o.id)
      setError(null)
      await load()
      setError(res.message)
    } catch (e) {
      setError(extractError(e))
    } finally {
      setSyncing(null)
    }
  }

  const handleCancel = async (o: AdminOrder) => {
    if (!confirm(`Batalkan pesanan #${o.id}?`)) return
    setCancelling(o.id)
    try {
      await cancelOrder(o.id)
      setError(null)
      await load()
    } catch (e) {
      setError(extractError(e))
    } finally {
      setCancelling(null)
    }
  }

  const handleCopyLink = async (o: AdminOrder) => {
    const link = o.fulfillment.drive_link
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(o.id)
      setTimeout(() => setCopiedId((prev) => (prev === o.id ? null : prev)), 1500)
    } catch {
      setError('Gagal menyalin link.')
    }
  }

  const s = stats?.summary

  return (
    <DashboardShell
      title="Pesanan"
      subtitle="Pantau order, status pembayaran, dan pengiriman file."
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi icon={<ClipboardIcon />} label="Total" value={s?.total ?? 0} />
        <Kpi icon={<ClockIcon />} label="Pending" value={s?.pending ?? 0} />
        <Kpi icon={<CheckBadgeIcon />} label="Paid" value={s?.paid ?? 0} />
        <Kpi icon={<XCircleIcon />} label="Gagal" value={s?.failed ?? 0} />
        <Kpi icon={<TruckIcon />} label="Kirim gagal" value={s?.delivery_failed ?? 0} />
        <Kpi
          icon={<BanknotesIcon />}
          label="Revenue"
          value={`Rp${(s?.revenue_idr ?? 0).toLocaleString('id-ID')}`}
        />
      </div>

      <div className="mt-6">{stats?.daily ? <OrdersChart daily={stats.daily} /> : null}</div>

      {error && (
        <div className="mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/40 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-6 overflow-x-auto">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : !data || data.orders.length === 0 ? (
          <p className="text-slate-400">Belum ada pesanan.</p>
        ) : (
          <div className="glass overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-white/10">
                  <th className="py-3 pr-4 pl-5">#</th>
                  <th className="py-3 pr-4">Produk</th>
                  <th className="py-3 pr-4">Pembeli</th>
                  <th className="py-3 pr-4">Total</th>
                  <th className="py-3 pr-4">Pembayaran</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Pengiriman</th>
                  <th className="py-3 pr-5">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.orders.map((o) => {
                  const st = statusBadge(o.status)
                  const f = fulfillmentBadge(o.fulfillment.status)
                  return (
                    <tr key={o.id} className="hover:bg-white/5 transition">
                      <td className="py-3 pr-4 pl-5 text-slate-500">#{o.id}</td>
                      <td className="py-3 pr-4">{o.product.title ?? '-'}</td>
                      <td className="py-3 pr-4">
                        <p className="truncate max-w-[180px]">{o.user.name ?? '-'}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[180px]">{o.user.email}</p>
                      </td>
                      <td className="py-3 pr-4">{o.total_formatted}</td>
                      <td className="py-3 pr-4 text-xs text-slate-400">
                        {o.payment_type === 'free'
                          ? 'Gratis'
                          : (o.payment_method ?? o.payment_type ?? '-')}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs border ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs">
                        <span className={f.cls}>{f.label}</span>
                        {o.fulfillment.granted_to && (
                          <p className="text-slate-500 truncate max-w-[150px]">
                            {o.fulfillment.granted_to}
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-5">
                        <div className="flex flex-wrap items-center gap-2">
                          {o.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleSync(o)}
                                disabled={syncing === o.id}
                                className="px-3 py-1 btn-ghost disabled:opacity-50"
                              >
                                {syncing === o.id ? '...' : 'Cek Status'}
                              </button>
                              <button
                                onClick={() => handleCancel(o)}
                                disabled={cancelling === o.id}
                                className="px-3 py-1 btn-danger disabled:opacity-50"
                              >
                                {cancelling === o.id ? '...' : 'Batalkan'}
                              </button>
                            </>
                          )}
                          {o.status === 'paid' &&
                            o.fulfillment.status !== 'delivered' &&
                            o.fulfillment.status !== 'pending' && (
                              <button
                                onClick={() => handleRetry(o)}
                                disabled={retrying === o.id}
                                className="px-3 py-1 btn-ghost disabled:opacity-50"
                              >
                                {retrying === o.id ? '...' : 'Kirim ulang'}
                              </button>
                            )}
                          {o.status === 'paid' && o.fulfillment.status === 'delivered' && (
                            <button
                              onClick={() => handleCopyLink(o)}
                              disabled={!o.fulfillment.drive_link}
                              className="px-3 py-1 btn-ghost disabled:opacity-50"
                            >
                              {copiedId === o.id ? 'Tersalin!' : 'Salin Link'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}