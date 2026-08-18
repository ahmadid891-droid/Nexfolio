import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function AuthCallback() {
  const { refresh } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    ;(async () => {
      await refresh()
      navigate('/', { replace: true })
    })()
  }, [refresh, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center text-slate-400">
      Memproses login...
    </div>
  )
}
