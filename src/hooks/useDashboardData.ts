
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

export type ClientStats = {
  registeredClients: number
  clientsWithDevices: number
  clientsWithoutDevices: number
  activeAssignments: number
}

type Props = {
  session: Session | null
}

type AdminClient = {
  id: string
  full_name: string
  contact_number: string | null
  province: string | null
  municipality: string | null
  barangay: string | null
  created_at: string
}

const defaultClientStats: ClientStats = {
  registeredClients: 0,
  clientsWithDevices: 0,
  clientsWithoutDevices: 0,
  activeAssignments: 0,
}

export function useDashboardData({ session }: Props) {
  const [devices, setDevices] = useState<Device[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null)

  const [clientStats, setClientStats] =
    useState<ClientStats>(defaultClientStats)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load dashboard data from Supabase.
  const load = useCallback(
    async (showLoading = true) => {
      if (!supabase || !session) {
        setDevices([])
        setLogs([])
        setPreferences(null)
        setClientStats(defaultClientStats)
        setLoading(false)
        return
      }

      if (showLoading) {
        setLoading(true)
      }

      setError(null)

      try {
        const [
          deviceResult,
          logResult,
          preferenceResult,
          clientResult,
          assignmentResult,
        ] = await Promise.all([
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

          // Fetch registered clients through the admin-only RPC.
          // All administrator accounts are automatically excluded.
          supabase.rpc('get_admin_clients'),

          // Fetch active device assignments.
          supabase
            .from('device_assignments')
            .select('user_id')
            .is('unassigned_at', null),
        ])

        if (deviceResult.error) throw deviceResult.error
        if (logResult.error) throw logResult.error
        if (preferenceResult.error) throw preferenceResult.error
        if (clientResult.error) throw clientResult.error
        if (assignmentResult.error) throw assignmentResult.error

        setDevices((deviceResult.data || []) as Device[])
        setLogs((logResult.data || []) as Log[])

        setPreferences(
          preferenceResult.data as NotificationPreferences | null
        )

        // Get only registered client IDs.
        const registeredClientProfiles =
          (clientResult.data || []) as AdminClient[]

        const registeredClientIds = new Set(
          registeredClientProfiles.map(client => client.id)
        )

        // Total registered clients, excluding all administrators.
        const registeredClients = registeredClientProfiles.length

        // Keep only active assignments belonging to registered clients.
        const activeAssignments = (assignmentResult.data || []).filter(
          assignment => registeredClientIds.has(assignment.user_id)
        )

        // A client may have multiple devices, so count unique user IDs.
        const uniqueAssignedClients = new Set(
          activeAssignments.map(assignment => assignment.user_id)
        )

        const clientsWithDevices = uniqueAssignedClients.size

        const clientsWithoutDevices = Math.max(
          0,
          registeredClients - clientsWithDevices
        )

        setClientStats({
          registeredClients,
          clientsWithDevices,
          clientsWithoutDevices,
          activeAssignments: activeAssignments.length,
        })
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
          void load(false)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          void load(false)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_assignments',
        },
        () => {
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

    // Clean up the Realtime subscription.
    return () => {
      void client.removeChannel(channel)
    }
  }, [session, load])

  return {
    devices,
    logs,
    preferences,
    clientStats,
    loading,
    error,

    // Manual refresh, such as the Topbar refresh button.
    refresh: () => load(true),
  }
}