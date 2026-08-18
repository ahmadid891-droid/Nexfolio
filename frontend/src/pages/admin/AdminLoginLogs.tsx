import { useCallback, useEffect, useState } from 'react'
import { DashboardShell } from '../../components/layout/DashboardShell'
import { Skeleton } from '../../components/ui/Skeleton'
import { getLoginLogs, type LoginLogEntry } from '../../api/products'

function formatTime(value: string): string {
  const d = new Date(value)
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function shortAgent(ua: string | null): string {
  if (!ua) return '-'
  if (/PostmanRuntime|curl|axios|Go-http/i.test(ua)) return 'API Client'
  const browser = /Edg|Edge/.test(ua)
    ? 'Edge'
    : /OPR|Opera/.test(ua)
      ? 'Opera'
      : /Chrome/.test(ua)
        ? 'Chrome'
        : /Firefox/.test(ua)
          ? 'Firefox'
          : /Safari/.test(ua)
            ? 'Safari'
            : 'Browser'
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Mac OS X|Macintosh/.test(ua)
      ? 'macOS'
      : /Android/.test(ua)
        ? 'Android'
        : /iPhone|iPad/.test(ua)
          ? 'iOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : '-'
  return `${browser} · ${os}`
}

export function AdminLoginLogs() {
  const [logs, setLogs] = useState<LoginLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [uniqueIps, setUniqueIps] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await getLoginLogs(200)
      setLogs(res.logs)
      setTotal(res.total)
      setUniqueIps(res.unique_ips)
    } catch {
      setError('Gagal memuat log login.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <DashboardShell
      title="Log Login"
      subtitle="Riwayat pengguna yang baru saja masuk ke sistem beserta alamat IP-nya."
    >
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/40 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-strong p-4">
          <p className="text-xs text-slate-400">Total Login</p>
          <p className="text-2xl font-bold mt-1">{total}</p>
        </div>
        <div className="glass-strong p-4">
          <p className="text-xs text-slate-400">IP Unik</p>
          <p className="text-2xl font-bold mt-1">{uniqueIps}</p>
        </div>
        <div className="glass-strong p-4">
          <p className="text-xs text-slate-400">Entri Ditampilkan</p>
          <p className="text-2xl font-bold mt-1">{logs.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-slate-400">Belum ada aktivitas login tercatat.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10">
                <th className="py-3 pr-4">Pengguna</th>
                <th className="py-3 pr-4">IP Address</th>
                <th className="py-3 pr-4">Perangkat</th>
                <th className="py-3 pr-4">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          log.user?.avatar ??
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(log.user?.name ?? '?')}`
                        }
                        alt={log.user?.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border border-white/20"
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{log.user?.name ?? 'Pengguna'}</p>
                        <p className="text-xs text-slate-500 truncate">{log.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="chip text-slate-200 font-mono">{log.ip_address}</span>
                  </td>
                  <td className="py-3 pr-4 text-slate-300">{shortAgent(log.user_agent)}</td>
                  <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">
                    {formatTime(log.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardShell>
  )
}
