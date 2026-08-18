import { useCallback, useEffect, useState } from 'react'
import { DashboardShell } from '../../components/layout/DashboardShell'
import { Skeleton } from '../../components/ui/Skeleton'
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  updateCategory,
  type Category,
  type CategoryInput,
} from '../../api/products'
import { extractError } from '../../lib/errors'

interface FormState {
  id: number | null
  name: string
  has_demo: boolean
  is_code: boolean
  sort_order: number
  is_active: boolean
}

const empty: FormState = { id: null, name: '', has_demo: false, is_code: false, sort_order: 0, is_active: true }

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormState | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setCategories(await getAdminCategories())
    } catch {
      setError('Gagal memuat kategori.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    if (!form?.name.trim()) {
      setError('Nama kategori wajib diisi.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const input: CategoryInput = {
        name: form.name.trim(),
        has_demo: form.has_demo,
        kind: form.is_code ? 'code' : 'documents',
        sort_order: form.sort_order,
        is_active: form.is_active,
      }
      if (form.id) {
        await updateCategory(form.id, input)
      } else {
        await createCategory(input)
      }
      setForm(null)
      await load()
    } catch (e) {
      setError(extractError(e))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (c: Category) => {
    if (
      !confirm(
        `Hapus kategori "${c.name}"? ${c.product_count ? `Produk di dalamnya (${c.product_count}) akan menjadi tanpa kategori, file tetap aman.` : ''}`
      )
    ) {
      return
    }
    try {
      await deleteCategory(c.id)
      await load()
    } catch (e) {
      setError(extractError(e))
    }
  }

  const input = 'glass-input'

  return (
    <DashboardShell
      title="Kelola Kategori"
      subtitle="Atur kategori proyek seperti Source Code, SDLC, dan lainnya. Produk tanpa kategori tetap tampil di Semua Proyek."
      actions={
        <button
          onClick={() => setForm({ ...empty })}
          className="px-4 py-2 btn-primary"
        >
          + Tambah Kategori
        </button>
      }
    >
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/40 text-sm text-red-300">
          {error}
        </div>
      )}

      {form && (
        <div className="mb-6 glass-strong p-6">
          <h2 className="text-lg font-semibold mb-4">
            {form.id ? `Edit: ${categories.find((c) => c.id === form.id)?.name ?? form.name}` : 'Kategori Baru'}
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nama Kategori *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={input}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Urutan</label>
              <input
                type="number"
                min="0"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
                className={input}
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.has_demo}
                onChange={(e) => setForm({ ...form, has_demo: e.target.checked })}
                className="w-4 h-4 accent-indigo-500"
              />
              Kategori ini menyediakan demo (produk boleh memiliki Demo URL)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.is_code}
                onChange={(e) => setForm({ ...form, is_code: e.target.checked })}
                className="w-4 h-4 accent-indigo-500"
              />
              Kategori Source Code (mengizinkan arsip: zip/rar/7z/dll)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 accent-indigo-500"
              />
              Aktif (tampil di beranda)
            </label>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button onClick={() => setForm(null)} className="px-4 py-2 btn-ghost">
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={submitting}
              className="px-4 py-2 btn-primary disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : form.id ? 'Simpan Perubahan' : 'Tambah Kategori'}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-slate-400">Belum ada kategori. Tambahkan yang pertama.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10">
                <th className="py-3 pr-4">Nama</th>
                <th className="py-3 pr-4">Jenis</th>
                <th className="py-3 pr-4">Demo</th>
                <th className="py-3 pr-4">Produk</th>
                <th className="py-3 pr-4">Urutan</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {categories.map((c) => (
                <tr key={c.id}>
                  <td className="py-3 pr-4">{c.name}</td>
                  <td className="py-3 pr-4">
                    <span className="chip text-slate-200">
                      {c.kind === 'code' ? 'Source Code' : 'Dokumen'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {c.has_demo ? (
                      <span className="text-emerald-400">Ya</span>
                    ) : (
                      <span className="text-slate-500">Tidak</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">{c.product_count ?? 0}</td>
                  <td className="py-3 pr-4">{c.sort_order ?? 0}</td>
                  <td className="py-3 pr-4">
                    {c.is_active ? (
                      <span className="text-emerald-400">Aktif</span>
                    ) : (
                      <span className="text-slate-500">Nonaktif</span>
                    )}
                  </td>
                  <td className="py-3 flex gap-2">
                    <button
                      onClick={() =>
                        setForm({
                          id: c.id,
                          name: c.name,
                          has_demo: c.has_demo,
                          is_code: c.kind === 'code',
                          sort_order: c.sort_order ?? 0,
                          is_active: c.is_active ?? true,
                        })
                      }
                      className="px-3 py-1 btn-ghost"
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDelete(c)} className="px-3 py-1 btn-danger">
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