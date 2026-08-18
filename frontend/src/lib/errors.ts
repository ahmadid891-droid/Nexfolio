import axios from 'axios'

export function extractError(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as Record<string, unknown> | undefined
    const errors = data?.errors as Record<string, unknown> | undefined
    if (errors) {
      const first = Object.values(errors)[0]
      if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
      if (typeof first === 'string') return first
    }
    if (typeof data?.message === 'string') return data.message
    if (e.response?.status === 413) {
      return 'File terlalu besar. Pastikan ukurannya di bawah 200 MB.'
    }
    if (e.response?.status === 401 || e.response?.status === 419) {
      return 'Sesi Anda berakhir. Silakan login kembali lalu coba lagi.'
    }
    if (e.response?.status) return `Terjadi kesalahan (${e.response.status}).`
  }
  return 'Terjadi kesalahan tak terduga.'
}