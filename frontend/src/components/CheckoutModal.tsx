import { useEffect, useRef, useState } from 'react'
import { checkout, getPaymentConfig } from '../api/orders'
import { loadSnap } from '../lib/snap'
import { extractError } from '../lib/errors'
import { WindowControls } from './ui/WindowControls'

interface Props {
  productId: number
  title: string
  priceFormatted: string
  isPaid: boolean
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CheckoutModal({
  productId,
  title,
  priceFormatted,
  isPaid,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const snapInstanceRef = useRef<Window['snap'] | null>(null)
  const snapTokenRef = useRef<string | null>(null)

  useEffect(() => {
    if (!paying || !snapInstanceRef.current || !snapTokenRef.current) return
    snapInstanceRef.current.embed(snapTokenRef.current, {
      embedId: 'snap-embed',
      onSuccess: () => onSuccess(),
      onPending: (result) => {
        const msg = result?.status_message
        setError(typeof msg === 'string' ? msg : 'Pembayaran sedang diproses. Silakan cek pesanan nanti.')
      },
      onError: (result) => {
        const msg = result?.status_message
        setError(typeof msg === 'string' ? msg : 'Pembayaran gagal. Silakan coba lagi.')
      },
    })
  }, [paying, onSuccess])

  if (!open) return null

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await checkout(productId)

      if (res.status === 'paid' || res.status === 'already_purchased') {
        onSuccess()
        return
      }

      if (res.status === 'pending_payment' && res.snap_token) {
        const cfg = await getPaymentConfig()
        const snap = await loadSnap(cfg.client_key, cfg.is_production)
        snapInstanceRef.current = snap
        snapTokenRef.current = res.snap_token
        setPaying(true)
        return
      }

      setError('Terjadi kesalahan saat membuat pesanan.')
    } catch (e) {
      setError(extractError(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full ${paying ? 'max-w-2xl' : 'max-w-md'} glass-strong p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 -mt-1 mb-4">
          <WindowControls onClose={onClose} />
          <h2 className="text-lg font-semibold">{paying ? 'Pembayaran' : 'Konfirmasi Pesanan'}</h2>
        </div>

        {paying ? (
          <div id="snap-embed" className="min-h-[500px] w-full" />
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-300">{title}</p>
            <p className="mt-1 text-lg font-semibold text-indigo-300">
              {isPaid ? priceFormatted : 'Gratis'}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/40 text-sm text-red-300">
            {error}
          </div>
        )}

        {!paying && (
          <div className="mt-6 flex items-center justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 btn-ghost">
              Batal
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-2 btn-primary disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Konfirmasi'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}