import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'

export interface User {
  id: number
  name: string
  email: string
  avatar: string | null
  is_admin: boolean
  email_verified_at: string | null
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const USER_CACHE_KEY = 'nexfolio_user'

function loadCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const cached = loadCachedUser()
  const [user, setUser] = useState<User | null>(cached)
  const [loading, setLoading] = useState(cached === null)

  const refresh = useCallback(async () => {
    try {
      await api.get('/sanctum/csrf-cookie')
      const { data } = await api.get<User>('/api/user')
      setUser(data)
      try {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data))
      } catch {
        /* ignore storage errors */
      }
    } catch {
      setUser(null)
      try {
        localStorage.removeItem(USER_CACHE_KEY)
      } catch {
        /* ignore storage errors */
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener('nexfolio:unauthorized', onUnauthorized)
    return () => window.removeEventListener('nexfolio:unauthorized', onUnauthorized)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/logout')
    } finally {
      setUser(null)
      try {
        localStorage.removeItem(USER_CACHE_KEY)
      } catch {
        /* ignore storage errors */
      }
      window.location.href = '/'
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
