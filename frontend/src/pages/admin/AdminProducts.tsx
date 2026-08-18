import { useCallback, useEffect, useState } from 'react'
import { DashboardShell } from '../../components/layout/DashboardShell'
import { Skeleton } from '../../components/ui/Skeleton'
import { ProductForm } from '../../components/admin/ProductForm'
import {
  createProduct,
  deleteProduct,
  getAdminProducts,
  updateProduct,
  type Product,
} from '../../api/products'
import { disconnectDrive, formatBytes, getDriveStatus, type DriveStatus } from '../../api/drive'
import { extractError } from '../../lib/errors'

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drive, setDrive] = useState<DriveStatus | null>(null)

  const load = useCallback(async (): Promise<Product[]> => {
    try {
      const list = await getAdminProducts()
      setProducts(list)
      return list
    } catch {
      setError('Gagal memuat produk.')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDrive = useCallback(async () => {
    try {
      setDrive(await getDriveStatus())
    } catch {
      setDrive(null)
    }
  }, [])

  useEffect(() => {
    load()
    loadDrive()
  }, [load, loadDrive])

  const handleDisconnectDrive = async () => {
    if (!confirm('Putuskan koneksi Google Drive? Setelah itu Anda dapat menghubungkan dengan akun lain.')) {
      return
    }
    try {
      await disconnectDrive()
      setError(null)
      await loadDrive()
    } catch (e) {
      setError(extractError(e))
    }
  }

  const handleSubmit = async (form: FormData) => {
    setSubmitting(true)
    setError(null)
    try {
      if (editing) {
        await updateProduct(editing.id, form)
      } else {
        await createProduct(form)
      }
      setEditing(null)
      setShowForm(false)
      await load()
    } catch (e) {
      setError(extractError(e))
    } finally {
      setSubmitting(false)
    }
  }

  const handleFilesChanged = async () => {
    const list = await load()
    setEditing((prev) => (prev ? list.find((p) => p.id === prev.id) ?? prev : prev))
  }

  const handleDelete = async (p: Product) => {
    if (!confirm(`Hapus produk "${p.title}"?`)) return
    try {
      await deleteProduct(p.id)
      await load()
    } catch (e) {
      setError(extractError(e))
    }
  }

  return (
    <DashboardShell
      title="Kelola Produk"
      subtitle="File produk otomatis diunggah ke Google Drive."
      actions={
        <button
          onClick={() => {
            setEditing(null)
            setShowForm(true)
          }}
          className="px-4 py-2 btn-primary"
        >
          + Tambah Produk
        </button>
      }
    >
        <div className="glass p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`w-2.5 h-2.5 rounded-full ${drive?.connected ? 'bg-emerald-400' : 'bg-amber-400'}`}
            />
            <div>
              <p className="text-sm text-slate-300">
                {drive?.connected
                  ? `Terhubung sebagai ${drive.account_email ?? '-'}`
                  : drive?.error ?? 'Belum terhubung'}
              </p>
              {drive?.connected && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Penyimpanan:{' '}
                  {drive.storage_quota
                    ? `${formatBytes(drive.storage_used)} / ${formatBytes(drive.storage_quota)}`
                    : 'tidak tersedia'}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {drive?.connected ? (
              <button
                onClick={handleDisconnectDrive}
                className="px-4 py-2 btn-danger"
              >
                Putuskan & Ganti Akun
              </button>
            ) : (
              <a href="/drive/oauth/start" className="px-4 py-2 btn-ghost">
                Hubungkan Google Drive
              </a>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/40 text-sm text-red-300">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mt-6 glass-strong p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? `Edit: ${editing.title}` : 'Produk Baru'}
            </h2>
            <ProductForm
              key={editing?.id ?? 'new'}
              initial={editing}
              onSubmit={handleSubmit}
              onCancel={() => {
                setEditing(null)
                setShowForm(false)
              }}
              submitting={submitting}
              onFilesChanged={handleFilesChanged}
            />
          </div>
        )}

        <div className="mt-8 overflow-x-auto">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="text-slate-400">Belum ada produk. Tambahkan yang pertama.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-white/10">
                  <th className="py-3 pr-4">Judul</th>
                  <th className="py-3 pr-4">Kategori</th>
                  <th className="py-3 pr-4">Harga</th>
                  <th className="py-3 pr-4">File</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 pr-4">{p.title}</td>
                    <td className="py-3 pr-4">
                      {p.category ? (
                        <span className="chip text-slate-200">{p.category.name}</span>
                      ) : (
                        <span className="text-slate-500">Tanpa kategori</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">{p.price_formatted ?? `Rp${p.price_idr}`}</td>
                    <td className="py-3 pr-4">
                      {p.storage_provider === 'mediafire' ? (
                        <span className="chip text-cyan-300">MediaFire</span>
                      ) : p.files_count ? (
                        <span className="text-emerald-400">{p.files_count} terunggah</span>
                      ) : (
                        <span className="text-slate-500">Belum ada</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {p.is_active ? (
                        <span className="text-emerald-400">Aktif</span>
                      ) : (
                        <span className="text-slate-500">Nonaktif</span>
                      )}
                    </td>
                    <td className="py-3 flex gap-2">
                      <button
                        onClick={() => {
                          setEditing(p)
                          setShowForm(true)
                        }}
                        className="px-3 py-1 btn-ghost"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="px-3 py-1 btn-danger"
                      >
                        Hapus
                      </button>
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
