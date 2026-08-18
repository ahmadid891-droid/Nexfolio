import { api } from './client'

export interface DriveStatus {
  connected: boolean
  account_email: string | null
  storage_used: number | null
  storage_quota: number | null
  folder_id: string | null
  error?: string
}

export async function getDriveStatus(): Promise<DriveStatus> {
  const { data } = await api.get<DriveStatus>('/api/admin/drive/status')
  return data
}

export async function disconnectDrive(): Promise<void> {
  await api.post('/api/admin/drive/disconnect')
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`
}
