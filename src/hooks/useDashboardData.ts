
import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

import { supabase } from '../lib/supabase'
import type { Device, Log } from '../types'

export type NotificationPreferences = {
  device_disconnection: boolean
  device_errors: boolean
  low_battery: boolean
  device_recovery: boolean
  bird_detection: boolean
}

type Props = {
  session: Session | null
}

export function useDashboardData({ session }: Props) {
  const [devices, setDevices] = useState<Device[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load dashboard data from Supabase.
  const load = useCallback(
    async (showLoading = true) => {
      if (!supabase || !session) {
        setDevices([])
        setLogs([])
        setPreferences(null)
        setLoading(false)
        return
      }

      if (showLoading) {
        setLoading(true)
      }

      setError(null)

      try {
        const [deviceResult, logResult, preferenceResult] =
          await Promise.all([
            // Fetch active devices only.
            supabase
              .from('devices')
              .select('*')
              .eq('is_archived', false)
              .order('name', { ascending: true }),

            // Fetch recent detection logs.
            supabase
              .from('detection_logs')
              .select('*, devices(name)')
              .order('created_at', { ascending: false })
              .limit(500),

            // Fetch the current administrator's notification preferences.
            supabase
              .from('notification_preferences')
              .select(
                'device_disconnection, device_errors, low_battery, device_recovery, bird_detection'
              )
              .eq('user_id', session.user.id)
              .maybeSingle(),
          ])

        if (deviceResult.error) throw deviceResult.error
        if (logResult.error) throw logResult.error
        if (preferenceResult.error) throw preferenceResult.error

        setDevices((deviceResult.data || []) as Device[])
        setLogs((logResult.data || []) as Log[])

        setPreferences(
          preferenceResult.data as NotificationPreferences | null
        )
      } catch (err) {
        console.error('Dashboard data loading error:', err)

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load dashboard data.'
        )
      } finally {
        if (showLoading) {
          setLoading(false)
        }
      }
    },
    [session]
  )

  // Initial dashboard load.
  useEffect(() => {
    void load()
  }, [load])

  // Subscribe to Supabase Realtime database changes.
  useEffect(() => {
    if (!supabase || !session) return

    const client = supabase

    const channel = client
      .channel('scarecrow-web-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices',
        },
        () => {
          // Refresh devices after INSERT, UPDATE, or DELETE.
          // Archived devices will automatically disappear
          // because the query filters is_archived = false.
          void load(false)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'detection_logs',
        },
        () => {
          // Refresh recent detection logs.
          void load(false)
        }
      )
      .subscribe((status, subscribeError) => {
        if (subscribeError) {
          console.error(
            'Supabase Realtime subscription error:',
            subscribeError
          )
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(
            'Supabase Realtime connection status:',
            status
          )
        }
      })

    // Clean up the Realtime subscription when the session changes
    // or the component using this hook unmounts.
    return () => {
      void client.removeChannel(channel)
    }
  }, [session, load])

  return {
    devices,
    logs,
    preferences,
    loading,
    error,

    // Manual refresh, such as the Topbar refresh button.
    refresh: () => load(true),
  }
}