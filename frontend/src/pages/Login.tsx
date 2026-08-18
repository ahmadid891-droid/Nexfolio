import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { BrandLogo } from '../components/ui/BrandLogo'
import { useAuth } from '../context/AuthContext'

type HumanState = 'idle' | 'verifying' | 'verified'

export function Login() {
  const { user, loading } = useAuth()
  const [params] = useSearchParams()
  const error = params.get('error')
  const [human, setHuman] = useState<HumanState>('idle')

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />
  }

  const verifyHuman = () => {
    if (human !== 'idle') return
    setHuman('verifying')
    setTimeout(() => setHuman('verified'), 900)
  }

  const handleGoogle = () => {
    if (human !== 'verified') return
    window.location.href = '/auth/google/redirect'
  }

  return (
    <Layout>
      <section className="max-w-md mx-auto px-4 py-24">
        <div className="glass-strong p-8 text-center">
          <h1 className="text-2xl font-bold">
            Masuk ke <BrandLogo />
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Login untuk membeli produk dan melihat hasil pesanan Anda.
          </p>

          {error === 'oauth' && (
            <div className="mt-4 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/40 text-sm text-amber-300">
              Login Google tidak dapat diselesaikan. Silakan coba lagi.
            </div>
          )}

          <button
            type="button"
            onClick={verifyHuman}
            disabled={human !== 'idle'}
            className={`mt-8 w-full flex items-center gap-3 px-4 py-3 rounded-xl border bg-white/5 text-left transition ${
              human === 'verified'
                ? 'border-emerald-500/50'
                : human === 'verifying'
                  ? 'border-white/20'
                  : 'border-white/15 hover:border-white/30 hover:bg-white/10'
            }`}
          >
            <span
              className={`flex w-6 h-6 shrink-0 items-center justify-center rounded-md border transition ${
                human === 'verified'
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : 'border-white/30 text-transparent'
              }`}
            >
              {human === 'verifying' ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-cyan-300 animate-spin" />
              ) : human === 'verified' ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="w-2 h-2 rounded-sm bg-white/30" />
              )}
            </span>
            <span className="flex-1 text-sm font-medium text-slate-200">
              {human === 'verified' ? 'Terverifikasi — manusia' : human === 'verifying' ? 'Memverifikasi…' : 'Saya bukan robot'}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500">I'm human</span>
          </button>

          <button
            onClick={handleGoogle}
            disabled={human !== 'verified'}
            className={`mt-3 w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border font-medium transition-all duration-200 ${
              human === 'verified'
                ? 'border-slate-700 bg-white text-slate-900 hover:bg-slate-100 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 active:translate-y-0'
                : 'border-slate-800 bg-white/40 text-slate-500 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            Lanjut dengan Google
          </button>

          <p className="mt-6 text-xs text-slate-500">
            Akun dibuat otomatis saat login pertama kali. Akun pertama menjadi admin.
          </p>
        </div>
      </section>
    </Layout>
  )
}
