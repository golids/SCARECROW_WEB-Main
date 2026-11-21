export type Language = 'en' | 'ceb'

export type Device = {
  id: string
  name: string
  location: string
  status?: string
  last_seen: string | null
  ip_address?: string | null
  port?: number
  is_archived?: boolean
  is_locked?: boolean
}

export type Log = {
  id: number | string
  device_id: string
  event_type: string
  label: string
  species: string | null
  created_at: string
  devices?: { name?: string } | null
}

export type Page =
  | 'overview'
  | 'devices'
  | 'detections'
  | 'alerts'
  | 'settings'

export type Translate = (key: string) => string