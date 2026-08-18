import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BubbleBackground } from './ui/BubbleBackground'
import { BrandLogo } from './ui/BrandLogo'
import { getOnline, type OnlineStats } from '../api/products'

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [online, setOnline] = useState<OnlineStats>({ users_online: 0, visitors_today: 0 })
  const [commentCount, setCommentCount] = useState(0)

  const isProductPage = location.pathname.startsWith('/product/')

  useEffect(() => {
    const onCommentCount = (e: Event) => {
      const detail = (e as CustomEvent<{ count: number }>).detail
      setCommentCount(detail?.count ?? 0)
    }
    window.addEventListener('nexfolio:comment-count', onCommentCount)
    return () => window.removeEventListener('nexfolio:comment-count', onCommentCount)
  }, [])

  useEffect(() => {
    const fetchOnline = async () => {
      try {
        const data = await getOnline()
        setOnline(data)
      } catch {
        // ignore
      }
    }
    fetchOnline()
    const interval = setInterval(fetchOnline, 30000)
    return () => clearInterval(interval)
  }, [])

  const navLink = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition ${
      isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
    }`

  return (
    <div className="min-h-screen flex flex-col">
      <BubbleBackground />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-lg tracking-tight">
            <BrandLogo />
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            <NavLink to="/" end className={navLink}>
              Beranda
            </NavLink>
            {user && (
              <NavLink to="/dashboard" className={navLink}>
                Dashboard
              </NavLink>
            )}
            {user?.is_admin && (
              <>
                <NavLink to="/admin/products" className={navLink}>
                  Kelola Produk
                </NavLink>
                <NavLink to="/admin/categories" className={navLink}>
                  Kategori
                </NavLink>
                <NavLink to="/admin/orders" className={navLink}>
                  Pesanan
                </NavLink>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="relative">
                  <img
                    src={user.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-white/20"
                  />
                  {isProductPage && (
                    <button
                      onClick={() => window.dispatchEvent(new Event('nexfolio:toggle-comments'))}
                      className="profile-window"
                      title="Buka Komentar"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3v-3H6a2 2 0 0 1-2-2V6z" />
                      </svg>
                      Komentar
                      {commentCount > 0 && <span className="profile-window-badge">{commentCount}</span>}
                    </button>
                  )}
                </div>
                <button
                  onClick={async () => {
                    await logout()
                    navigate('/')
                  }}
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Keluar
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg btn-primary text-white text-sm font-medium"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/10 py-4 text-sm">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-2">
          <span className="online-counter">
            <span className="online-label">
              <span className="online-dot" />
              User Online: {online.users_online}
            </span>
            <span className="online-divider" />
            <span>Jumlah Visitor: {online.visitors_today}</span>
          </span>
          <span className="text-slate-500 text-center">
            © {new Date().getFullYear()} Nexfolio
          </span>
        </div>
      </footer>
    </div>
  )
}