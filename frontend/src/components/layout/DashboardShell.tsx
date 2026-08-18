import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getInboxUnread } from '../../api/orders'
import { BubbleBackground } from '../ui/BubbleBackground'
import { BrandLogo } from '../ui/BrandLogo'

function HomeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
    </svg>
  )
}

function BoxIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 21 8v8l-9 5-9-5V8l9-5Zm0 0v16m-9-8 9 5 9-5" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 4h13l5 5v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm0 0v6m2 8h.01M7 18h.01M11 18h.01"
      />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
      />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function CloudIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.5A3.5 3.5 0 0 1 17 18H7Z" />
    </svg>
  )
}

interface Props {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function DashboardShell({ title, subtitle, actions, children }: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    getInboxUnread()
      .then(setUnread)
      .catch(() => {})
  }, [])

  const navItem = (to: string, icon: React.ReactNode, label: string, end = false) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
          isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  )

  return (
    <div className="min-h-screen flex">
      <BubbleBackground />

      {/* Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col h-screen sticky top-0 border-r border-white/10 bg-white/5 backdrop-blur-xl px-4 py-6">
        <Link to="/" className="flex items-center px-3 text-lg tracking-tight">
          <BrandLogo />
        </Link>

        <nav className="mt-8 space-y-1">
          {navItem('/', <HomeIcon />, 'Beranda', true)}
          {user && navItem('/dashboard', <GridIcon />, 'Dashboard')}
          {user?.is_admin && (
            <>
              {navItem('/admin/products', <BoxIcon />, 'Kelola Produk')}
              {navItem('/admin/categories', <TagIcon />, 'Kategori')}
              {navItem('/admin/orders', <ListIcon />, 'Pesanan')}
              {navItem('/admin/mediafire', <CloudIcon />, 'MediaFire')}
              {navItem('/admin/login-logs', <ClockIcon />, 'Log Login')}
            </>
          )}
        </nav>

        <div className="mt-auto pt-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4">
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? '')}`}
                alt={user?.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-white/20"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={async () => {
                await logout()
                navigate('/')
              }}
              className="mt-3 w-full px-3 py-2 btn-ghost"
            >
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="h-16 px-4 lg:px-8 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate">{title}</h1>
              {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {actions}
              <Link to="/dashboard" className="relative" aria-label="Inbox" title="Inbox">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white transition">
                  <BellIcon />
                </span>
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold text-white bg-gradient-to-r from-indigo-500 to-cyan-500">
                    {unread}
                  </span>
                )}
              </Link>
              <img
                src={user?.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? '')}`}
                alt={user?.name}
                referrerPolicy="no-referrer"
                className="h-10 w-10 rounded-full object-cover border border-white/20"
              />
            </div>
          </div>
          <nav className="lg:hidden flex items-center gap-1 px-4 pb-3 overflow-x-auto">
            {navItem('/', <HomeIcon />, 'Beranda', true)}
            {user && navItem('/dashboard', <GridIcon />, 'Dashboard')}
            {user?.is_admin && (
              <>
                {navItem('/admin/products', <BoxIcon />, 'Kelola Produk')}
                {navItem('/admin/categories', <TagIcon />, 'Kategori')}
                {navItem('/admin/orders', <ListIcon />, 'Pesanan')}
                {navItem('/admin/mediafire', <CloudIcon />, 'MediaFire')}
              </>
            )}
          </nav>
        </header>

        <main className="max-w-6xl mx-auto px-4 lg:px-8 py-8">{children}</main>
      </div>
    </div>
  )
}