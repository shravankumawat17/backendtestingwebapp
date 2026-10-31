import { Navigate, Outlet, Route, Routes, BrowserRouter, useLocation, Link } from 'react-router-dom'
import { Loader2, RefreshCw, ShieldAlert } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import { Logo } from './components/ui/Logo'
import { Button } from './components/ui/Button'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { UserDashboardPage } from './pages/UserDashboardPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'

function FullScreenLoader({ label = 'Loading your workspace…' }: { label?: string }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="flex flex-col items-center gap-5 text-center">
        <Logo />
        <span className="flex items-center gap-2 text-[12px] text-muted">
          <Loader2 size={14} className="animate-spin" /> {label}
        </span>
      </div>
    </div>
  )
}

function RootRedirect() {
  const { session, profile, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!session) {
    const suffix = `${window.location.search}${window.location.hash}`
    return <Navigate to={`/login${suffix}`} replace />
  }
  if (profile && !profile.onboarding_completed) return <Navigate to="/onboarding" replace />
  return <Navigate to="/dashboard" replace />
}

function RequireAuth() {
  const { session, profile, loading, error, refreshProfile, signOut } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenLoader />

  if (!session) return <Navigate to="/login" replace />

  if (!profile) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-line bg-paper p-7 text-center shadow-card">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-danger-soft text-danger">
            <ShieldAlert size={19} />
          </span>
          <h1 className="mt-4 font-display text-[26px] leading-tight">We couldn’t load your profile</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            {error ?? 'Your profile may still be getting set up. Try loading it again.'}
          </p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => void signOut()}
              className="order-2 sm:order-1"
            >
              Sign out
            </Button>
            <Button
              onClick={() => void refreshProfile()}
              icon={<RefreshCw size={14} />}
              className="order-1 sm:order-2"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!profile.onboarding_completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  if (profile.onboarding_completed && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

function RequireAdmin() {
  const { profile } = useAuth()
  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

function NotFoundPage() {
  const { session } = useAuth()
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="text-center">
        <Logo className="mx-auto" />
        <p className="mt-8 text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">404</p>
        <h1 className="mt-2 font-display text-[42px] leading-tight">This page wandered off.</h1>
        <p className="mt-2 text-[13.5px] text-muted">
          The link you followed doesn’t point anywhere on CampusCircle.
        </p>
        <Link
          to={session ? '/dashboard' : '/login'}
          className="mt-6 inline-flex h-10 items-center rounded-[10px] bg-ink px-4 text-[13px] font-medium text-paper transition-colors hover:bg-black"
        >
          {session ? 'Back to dashboard' : 'Back to sign in'}
        </Link>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />

            <Route element={<RequireAuth />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<UserDashboardPage />} />
                <Route element={<RequireAdmin />}>
                  <Route path="/admin" element={<AdminDashboardPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
