declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result?: Record<string, unknown>) => void
          onPending?: (result?: Record<string, unknown>) => void
          onError?: (result?: Record<string, unknown>) => void
          onClose?: () => void
        },
      ) => void
      embed: (
        token: string,
        options?: {
          embedId?: string
          onSuccess?: (result?: Record<string, unknown>) => void
          onPending?: (result?: Record<string, unknown>) => void
          onError?: (result?: Record<string, unknown>) => void
          onClose?: () => void
        },
      ) => void
    }
  }
}

let snapPromise: Promise<NonNullable<Window['snap']>> | null = null

export function loadSnap(clientKey: string, isProduction: boolean): Promise<NonNullable<Window['snap']>> {
  if (window.snap) return Promise.resolve(window.snap as NonNullable<Window['snap']>)

  if (snapPromise) return snapPromise

  const base = isProduction ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com'

  snapPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `${base}/snap/snap.js`
    script.setAttribute('data-client-key', clientKey)
    script.async = true
    script.onload = () => {
      if (window.snap) {
        resolve(window.snap as NonNullable<Window['snap']>)
      } else {
        reject(new Error('snap.js gagal dimuat'))
      }
    }
    script.onerror = () => reject(new Error('gagal memuat snap.js'))
    document.head.appendChild(script)
  })

  return snapPromise
}

export default {}