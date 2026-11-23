
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminLoading, setAdminLoading] = useState(true)

  // Restore the existing Supabase session.
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      setAdminLoading(false)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return

      if (error) {
        console.error('Unable to get session:', error.message)
      }

      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Verify that the authenticated account is an administrator.
  useEffect(() => {
    if (!supabase || !session) {
      setIsAdmin(false)
      setAdminLoading(false)
      return
    }

    let active = true

    async function verifyAdmin() {
      setAdminLoading(true)

      const { data, error } = await supabase!.rpc(
        'is_scarecrow_admin'
      )

      if (!active) return

      if (error) {
        console.error('Administrator verification failed:', error.message)
      }

      if (error || data !== true) {
        setIsAdmin(false)
        setAdminLoading(false)

        // Reject non-administrator accounts.
        await supabase!.auth.signOut()
        return
      }

      setIsAdmin(true)
      setAdminLoading(false)
    }

    void verifyAdmin()

    return () => {
      active = false
    }
  }, [session])

  async function signIn(email: string, password: string) {
    if (!supabase) {
      return { error: new Error('Supabase is not configured.') }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error }
    }

    // Check administrator access immediately after login.
    const { data, error: adminError } = await supabase.rpc(
      'is_scarecrow_admin'
    )

    if (adminError) {
      console.error('Administrator verification failed:', adminError.message)

      await supabase.auth.signOut()

      return {
        error: new Error(
          'Unable to verify administrator access. Please try again.'
        ),
      }
    }

    if (data !== true) {
      await supabase.auth.signOut()

      return {
        error: new Error(
          'Access denied. This account is not authorized to access the administrator web app. Please use the ScareCROW mobile app.'
        ),
      }
    }

    setIsAdmin(true)

    return { error: null }
  }

  async function signOut() {
    if (!supabase) return

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Unable to sign out:', error.message)
    }

    setIsAdmin(false)
  }

  return {
    session,
    loading,
    isAdmin,
    adminLoading,
    signIn,
    signOut,
  }
}