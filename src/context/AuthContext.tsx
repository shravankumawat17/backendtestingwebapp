import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase, toMessage } from '../lib/supabase'
import type { Profile } from '../lib/types'

interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  loading: boolean
  error: string | null
  configured: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = useCallback(async (userId: string) => {
    setProfileLoading(true)
    setError(null)
    let lastError: string | null = null

    // The profile row is created by a database trigger on first sign-in.
    // Retry briefly in case the trigger and the first read race each other.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (queryError) {
        lastError = queryError.message
      } else if (data) {
        setProfile(data as Profile)
        setProfileLoading(false)
        return
      }

      if (attempt < 3) await sleep(400)
    }

    setProfile(null)
    setProfileLoading(false)
    setError(
      lastError ??
        "We couldn't load your profile. It may still be getting set up — try refreshing.",
    )
  }, [])

  useEffect(() => {
    let active = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setInitializing(false)

      if (nextSession?.user) {
        void loadProfile(nextSession.user.id)
      } else {
        setProfile(null)
        setProfileLoading(false)
        setError(null)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured yet. Add your project URL and anon key to .env.')
    }
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (signInError) throw signInError
  }, [])

  const signOut = useCallback(async () => {
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) throw new Error(toMessage(signOutError))
    setProfile(null)
    setSession(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return
    await loadProfile(session.user.id)
  }, [loadProfile, session?.user])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading: initializing || (Boolean(session) && profileLoading),
      error,
      configured: isSupabaseConfigured,
      signInWithGoogle,
      signOut,
      refreshProfile,
    }),
    [session, profile, initializing, profileLoading, error, signInWithGoogle, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
