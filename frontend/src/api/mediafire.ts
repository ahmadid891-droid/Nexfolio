import { api } from './client'

export interface MediaFireStatus {
  connected: boolean
  account: string | null
}

export async function getMediaFireStatus(): Promise<MediaFireStatus> {
  const { data } = await api.get<MediaFireStatus>('/api/admin/mediafire/status')
  return data
}

export async function connectMediaFire(account: string): Promise<void> {
  await api.post('/api/admin/mediafire/connect', { account })
}

export async function disconnectMediaFire(): Promise<void> {
  await api.post('/api/admin/mediafire/disconnect')
}
