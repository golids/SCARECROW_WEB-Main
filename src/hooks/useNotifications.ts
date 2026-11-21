
import { useCallback, useEffect, useState } from 'react'

import { supabase } from '../lib/supabase'
import type { Log } from '../types'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadNotifications = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    setError(null)

    try {
      const { data, error } = await supabase
        .from('detection_logs')
        .select('*, devices(name)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications((data || []) as Log[])
    } catch (err) {
      console.error('Notification loading error:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load notifications.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel('scarecrow-web-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'detection_logs',
        },
        () => {
          void loadNotifications()
        }
      )
      .subscribe()

    return () => {
      if (supabase) {
        void supabase.removeChannel(channel)
      }
    }
  }, [loadNotifications])

  return {
    notifications,
    notificationCount: notifications.length,
    loading,
    error,
    refreshNotifications: loadNotifications,
  }
}
