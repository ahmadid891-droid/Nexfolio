import { useEffect, useState } from 'react'
import {
  deleteProductFile,
  getAdminCategories,
  type Category,
  type Product,
} from '../../api/products'
import { CoverImage } from '../ui/CoverImage'

const MAX_FILE_MB = 200
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024

const DOCS_ACCEPT = '.pdf,.md,.doc,.docx,.txt,text/markdown,application/pdf'
const CODE_ACCEPT = '.pdf,.md,.doc,.docx,.txt,.zip,.rar,.7z,.dll'

interface Props {
  initial?: Product | null
  onSubmit: (form: FormData) => Promise<void>
  onCancel: () => void
  submitting?: boolean
  onFilesChanged?: () => Promise<void>
}

export function ProductForm({ initial, onSubmit, onCancel, submitting, onFilesChanged }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [priceIdr, setPriceIdr] = useState(String(initial?.price_idr ?? ''))
  const [categoryId, setCategoryId] = useState(initial?.category_id ? String(initial.category_id) : '')
  const [demoUrl, setDemoUrl] = useState(initial?.demo_url ?? '')
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [cover, setCover] = useState<File | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [sizeError, setSizeError] = useState<string | null>(null)
  const [storageProvider, setStorageProvider] = useState(initial?.storage_provider ?? 'google_drive')
  const [mediafirePageUrl, setMediafirePageUrl] = useState(initial?.mediafire_page_url ?? '')

  useEffect(() => {
    getAdminCategories()
      .then(setCategories)
      .catch(() => {})
  }, [])

  const selectedCategory = categories.find((c) => c.id === Number(categoryId)) ?? null
  const allowsDemo = selectedCategory?.has_demo ?? false
  const accept = selectedCategory?.kind === 'code' ? CODE_ACCEPT : DOCS_ACCEPT

  const validateSize = (f: File, label: string): boolean => {
    if (f.size > MAX_FILE_BYTES) {
      setSizeError(`${label} terlalu besar (maks ${MAX_FILE_MB} MB).`)
      return false
    }
    return true
  }

  const handleFiles = (list: FileList | null) => {
    if (!list) return
    const picked = Array.from(list)
    setSizeError(null)
    for (const f of picked) {
      if (!validateSize(f, `File "${f.name}"`)) return
    }
    setFiles((prev) => [...prev, ...picked])
  }

  const handleExistingFileDelete = async (fileId: number) => {
    if (!initial || !confirm('Hapus file ini dari produk?')) return
    setSizeError(null)
    try {
      await deleteProductFile(initial.id, fileId)
      await onFilesChanged?.()
    } catch {
      setSizeError('Gagal menghapus file. Coba lagi.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSizeError(null)

    if (cover && !validateSize(cover, 'Cover')) return
    for (const f of files) {
      if (!validateSize(f, `File "${f.name}"`)) return
    }

    const form = new FormData()
    form.set('title', title)
    form.set('description', description)
    form.set('price_idr', priceIdr)
    form.set('category_id', categoryId || '')
    form.set('is_active', isActive ? '1' : '0')
    if (allowsDemo) form.set('demo_url', demoUrl)
    if (cover) form.set('cover', cover)
    files.forEach((f) => form.append('files[]', f))
    form.set('storage_provider', storageProvider)
    if (storageProvider === 'mediafire') {
      form.set('mediafire_page_url', mediafirePageUrl)
    }
    await onSubmit(form)
  }

  const input = 'glass-input'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-slate-400 mb-1">Judul Produk *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className={input} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Kategori</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={input}
          >
            <option value="">Tanpa kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Harga (Rp) *</label>
          <input
            type="number"
            min="0"
            value={priceIdr}
            onChange={(e) => setPriceIdr(e.target.value)}
            required
            className={input}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Deskripsi</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={input}
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Penyedia Penyimpanan</label>
        <select
          value={storageProvider}
          onChange={(e) => setStorageProvider(e.target.value)}
          className={input}
        >
          <option value="google_drive">Google Drive (upload otomatis)</option>
          <option value="mediafire">MediaFire (Direct Link manual)</option>
        </select>
        <p className="mt-1 text-xs text-slate-500">
          {storageProvider === 'mediafire'
            ? 'Anda akan menempel Direct Link MediaFire; file tidak diunggah ke server.'
            : 'File produk akan diunggah otomatis ke Google Drive.'}
        </p>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">
          Demo URL {allowsDemo ? '' : '(hanya untuk kategori ber-demo)'}
        </label>
        <input
          type="url"
          value={allowsDemo ? demoUrl : ''}
          onChange={(e) => setDemoUrl(e.target.value)}
          disabled={!allowsDemo}
          placeholder="https://demo.example.com"
          className={input}
        />
        {!allowsDemo && (
          <p className="mt-1 text-xs text-slate-500">
            Pilih kategori dengan demo untuk mengisi tautan demo.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">
          Cover (opsional — kosongkan jika tidak diganti)
        </label>
        <div className="mb-2">
          <p className="text-xs text-slate-500 mb-1">
            {initial?.cover_url ? 'Cover saat ini:' : 'Default cover (belum ada upload):'}
          </p>
          <CoverImage
            src={initial?.cover_url}
            alt="Cover produk"
            className="h-28 w-28 rounded-lg object-cover border border-white/10"
            markClassName="w-12 h-12 opacity-90"
          />
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCover(e.target.files?.[0] ?? null)}
          className={input}
        />
        {cover ? (
          <p className="mt-1 text-xs text-slate-400">Cover baru dipilih: {cover.name}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-500">
            Biarkan kosong untuk mempertahankan cover yang sudah ada.
          </p>
        )}
      </div>

      {storageProvider === 'google_drive' ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <label className="block text-sm text-slate-400 mb-2">
            File Produk → Google Drive {selectedCategory ? `(${selectedCategory.kind === 'code' ? 'mendukung arsip zip/rar/dll' : 'dokumen'})` : '(belum pilih kategori)'}
          </label>
          <input
            type="file"
            multiple
            accept={accept}
            onChange={(e) => handleFiles(e.target.files)}
            className={input}
          />
          <p className="mt-2 text-xs text-slate-500">
            File yang sudah terunggah tetap dipertahankan. Gunakan kolom ini hanya untuk menambah file baru.
          </p>

          {(initial?.files?.length ?? 0) > 0 || files.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {(files ?? []).map((f, i) => (
                <li
                  key={`new-${i}`}
                  className="flex items-center justify-between gap-2 text-sm text-slate-300"
                >
                  <span className="truncate">(baru) {f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="px-2 py-0.5 btn-danger text-xs"
                  >
                    Hapus
                  </button>
                </li>
              ))}
              {(initial?.files ?? []).map((f) => (
                <li
                  key={`existing-${f.id}`}
                  className="flex items-center justify-between gap-2 text-sm text-slate-300"
                >
                  <span className="truncate">{f.file_name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-emerald-400">Terunggah</span>
                    <button
                      type="button"
                      onClick={() => handleExistingFileDelete(f.id)}
                      className="px-2 py-0.5 btn-danger text-xs"
                    >
                      Hapus
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              Belum ada file. Anda bisa mengunggah lebih dari satu file sekaligus.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <label className="block text-sm text-slate-400 mb-2">
            URL Halaman MediaFire
          </label>
          <input
            type="url"
            value={mediafirePageUrl}
            onChange={(e) => setMediafirePageUrl(e.target.value)}
            placeholder="https://www.mediafire.com/file/..."
            className={input}
          />
          <p className="mt-2 text-xs text-slate-500">
            Tempel URL halaman file MediaFire. Direct download link akan diambil otomatis & disimpan.
          </p>
          {initial?.mediafire_link ? (
            <p className="mt-2 text-xs text-cyan-300/80 break-all">
              Direct link aktif: {initial.mediafire_link}
            </p>
          ) : null}
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4 accent-indigo-500"
        />
        Aktif (tampil publik)
      </label>

      {sizeError && (
        <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/40 text-sm text-red-300">
          {sizeError}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 btn-ghost"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 btn-primary disabled:opacity-50"
        >
          {submitting ? 'Menyimpan...' : initial ? 'Simpan Perubahan' : 'Tambah Produk'}
        </button>
      </div>
    </form>
  )
}