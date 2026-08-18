import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'

export const api = axios.create({
  baseURL: '/',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

const CACHE_TTL = 60_000

interface CacheEntry {
  data: unknown
  expires: number
}

const cache = new Map<string, CacheEntry>()

function isCacheable(url: string): boolean {
  if (!url) return false
  const excluded = [
    '/sanctum/csrf-cookie',
    '/api/user',
    '/api/online',
    '/api/my/inbox/unread',
    '/api/health',
  ]
  return !excluded.some((e) => url.includes(e))
}

function cacheKey(url: string, params?: unknown): string {
  return `${url}:${JSON.stringify(params ?? {})}`
}

export function clearApiCache(): void {
  cache.clear()
}

// Invalidate cache whenever a write (mutation) happens so reads stay fresh.
api.interceptors.request.use((config) => {
  const method = (config.method ?? 'get').toLowerCase()
  if (method !== 'get') {
    cache.clear()
  }
  return config
})

// Wrap GET with a short-lived in-memory cache for instant navigation.
const originalGet = api.get.bind(api)
api.get = (async (url: string, config?: AxiosRequestConfig) => {
  if (isCacheable(url)) {
    const key = cacheKey(url, config?.params)
    const hit = cache.get(key)
    if (hit && hit.expires > Date.now()) {
      return {
        data: hit.data,
        status: 200,
        statusText: 'ok',
        headers: {},
        config: config as AxiosRequestConfig,
        request: {},
      } as AxiosResponse
    }
  }

  const res = await originalGet(url, config)

  if (isCacheable(url)) {
    cache.set(cacheKey(url, config?.params), {
      data: res.data,
      expires: Date.now() + CACHE_TTL,
    })
  }

  return res
}) as typeof api.get

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event('nexfolio:unauthorized'))
    }
    return Promise.reject(error)
  },
)
