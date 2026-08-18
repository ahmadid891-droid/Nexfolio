import { useSearchParams } from 'react-router-dom'
import { DashboardShell } from '../../components/layout/DashboardShell'

export function DriveStatus() {
  const [params] = useSearchParams()
  const status = params.get('status')

  return (
    <DashboardShell title="Status Google Drive" subtitle="Koneksi penyimpanan file produk">
      <div className="max-w-md mx-auto">
        <div className="glass-strong p-8 text-center">
          {status === 'ok' || status === 'connected' ? (
            <>
              <h1 className="text-xl font-bold text-emerald-400">Drive Terhubung</h1>
              <p className="mt-3 text-sm text-slate-400">
                Refresh token tersimpan dan folder "Showcase Products" siap. Anda kini dapat
                mengunggah file produk.
              </p>
              <a
                href="/admin/products"
                className="mt-6 inline-block px-4 py-2 btn-primary"
              >
                Ke Kelola Produk
              </a>
            </>
          ) : status === 'error' ? (
            <>
              <h1 className="text-xl font-bold text-red-400">Gagal Menghubungkan</h1>
              <p className="mt-3 text-sm text-slate-400">
                Terjadi kesalahan saat otentikasi. Pastikan akun Anda di Test users dan coba lagi.
              </p>
              <a
                href="/drive/oauth/start"
                className="mt-6 inline-block px-4 py-2 btn-ghost"
              >
                Coba Lagi
              </a>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold">Hubungkan Google Drive</h1>
              <p className="mt-3 text-sm text-slate-400">Status tidak diketahui.</p>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
