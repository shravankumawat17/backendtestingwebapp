import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  refreshProfile: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const loadProfile = useCallback(
    async (userId: string, options: { silent?: boolean } = {}): Promise<boolean> => {
      const silent = options.silent ?? false
      const currentRequest = ++requestId.current

      if (!silent) {
        setProfileLoading(true)
        setError(null)
      }

      let lastError: string | null = null

      // The profile row is created by a database trigger on first sign-in.
      // Retry briefly in case the trigger and the first read race each other.
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()

        if (requestId.current !== currentRequest) return false

        if (queryError) {
          lastError = queryError.message
        } else if (data) {
          setProfile(data as Profile)
          setError(null)
          if (!silent) setProfileLoading(false)
          return true
        }

        if (attempt < 3) {
          await sleep(400)
          if (requestId.current !== currentRequest) return false
        }
      }

      if (requestId.current !== currentRequest) return false

      if (!silent) {
        setProfile(null)
        setProfileLoading(false)
        setError(
          lastError ??
            "We couldn't load your profile. It may still be getting set up — try refreshing.",
        )
      }

      return false
    },
    [],
  )

  useEffect(() => {
    let active = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setInitializing(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user?.id

  useEffect(() => {
    if (initializing) return

    if (!userId) {
      requestId.current += 1
      setProfile(null)
      setProfileLoading(false)
      setError(null)
      return
    }

    void loadProfile(userId)
  }, [initializing, userId, loadProfile])

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
    requestId.current += 1
    setProfile(null)
    setSession(null)
    setProfileLoading(false)
    setError(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return false
    return loadProfile(session.user.id, { silent: true })
  }, [loadProfile, session?.user])

  const loading =
    initializing ||
    (Boolean(session?.user) &&
      (profileLoading || (profile?.id !== session?.user?.id && !error)))

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      error,
      configured: isSupabaseConfigured,
      signInWithGoogle,
      signOut,
      refreshProfile,
    }),
    [
      session,
      profile,
      loading,
      error,
      signInWithGoogle,
      signOut,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
