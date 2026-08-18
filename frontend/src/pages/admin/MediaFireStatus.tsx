import { useEffect, useState } from 'react'
import { DashboardShell } from '../../components/layout/DashboardShell'
import {
  connectMediaFire,
  disconnectMediaFire,
  getMediaFireStatus,
  type MediaFireStatus as MFStatus,
} from '../../api/mediafire'
import { extractError } from '../../lib/errors'

export function MediaFireStatus() {
  const [status, setStatus] = useState<MFStatus | null>(null)
  const [account, setAccount] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      const s = await getMediaFireStatus()
      setStatus(s)
      setAccount(s.account ?? '')
    } catch {
      setStatus({ connected: false, account: null })
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleConnect = async () => {
    setError(null)
    setBusy(true)
    try {
      await connectMediaFire(account)
      await load()
    } catch (e) {
      setError(extractError(e))
    } finally {
      setBusy(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Putuskan koneksi MediaFire?')) return
    setError(null)
    setBusy(true)
    try {
      await disconnectMediaFire()
      await load()
    } catch (e) {
      setError(extractError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <DashboardShell title="Status MediaFire" subtitle="Penyedia penyimpanan alternatif (Direct Link)">
      <div className="max-w-md mx-auto">
        <div className="glass-strong p-8">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`w-2.5 h-2.5 rounded-full ${status?.connected ? 'bg-emerald-400' : 'bg-amber-400'}`}
            />
            <p className="text-sm text-slate-300">
              {status?.connected
                ? `Terhubung sebagai ${status.account ?? '-'}`
                : 'Belum terhubung'}
            </p>
          </div>

          {status?.connected ? (
            <>
              <p className="text-sm text-slate-400 mb-4">
                Akun MediaFire terdaftar. Untuk tiap produk, cukup tempel URL halaman file MediaFire;
                direct download link akan diambil otomatis.
              </p>
              <button
                onClick={handleDisconnect}
                disabled={busy}
                className="px-4 py-2 btn-danger disabled:opacity-50"
              >
                Putuskan & Ganti Akun
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-400 mb-4">
                Masukkan referensi akun MediaFire Anda (email/nama akun). Untuk tiap produk, cukup
                tempel URL halaman file MediaFire — direct download link diambil otomatis.
              </p>
              <label className="block text-sm text-slate-400 mb-1">Referensi Akun MediaFire</label>
              <input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="nama.akun.mediafire@gmail.com"
                className="glass-input"
              />
              <button
                onClick={handleConnect}
                disabled={busy || account.trim() === ''}
                className="mt-4 px-4 py-2 btn-primary disabled:opacity-50"
              >
                {busy ? 'Menyimpan...' : 'Hubungkan MediaFire'}
              </button>
            </>
          )}

          {error && (
            <div className="mt-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/40 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
