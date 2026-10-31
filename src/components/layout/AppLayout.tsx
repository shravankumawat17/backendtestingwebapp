import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, Menu, ShieldCheck, X } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../context/AuthContext'
import { Logo } from '../ui/Logo'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { useToast } from '../ui/Toast'
import { toMessage } from '../../lib/supabase'

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  if (!profile) return null

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(profile.role === 'admin'
      ? [{ to: '/admin', label: 'Admin console', icon: ShieldCheck }]
      : []),
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      toast('error', 'Could not sign out', toMessage(error))
    }
  }

  return (
    <div className="flex h-full flex-col px-4 py-5">
      <div className="px-1.5">
        <Logo />
      </div>

      <p className="mt-8 px-2.5 text-[10px] font-semibold tracking-[0.16em] text-muted/80 uppercase">
        Workspace
      </p>
      <nav className="mt-2 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-ink text-paper shadow-[0_1px_2px_rgba(28,27,26,0.15)]'
                  : 'text-muted hover:bg-ink/[0.05] hover:text-ink',
              )
            }
          >
            <Icon size={16} strokeWidth={1.9} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-3 pt-6">
        <div className="rounded-xl border border-line bg-paper p-3">
          <div className="flex items-center gap-2.5">
            <Avatar src={profile.avatar_url} name={profile.full_name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold text-ink">
                {profile.full_name || 'New member'}
              </p>
              <p className="truncate text-[11px] text-muted">{profile.email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
            <Badge tone={profile.role === 'admin' ? 'accent' : 'neutral'}>
              {profile.role === 'admin' ? 'Admin' : 'Member'}
            </Badge>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <LogOut size={12} />
              Sign out
            </button>
          </div>
        </div>
        <p className="px-1 text-[10.5px] leading-snug text-muted/70">
          CampusCircle · secured with Supabase
        </p>
      </div>
    </div>
  )
}

export function AppLayout() {
  const { profile } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    const desktop = window.matchMedia('(min-width: 1024px)')
    const onChange = () => {
      if (desktop.matches) setMobileOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    desktop.addEventListener('change', onChange)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      desktop.removeEventListener('change', onChange)
      document.body.style.overflow = previous
    }
  }, [mobileOpen])

  return (
    <div className="min-h-dvh bg-cream">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-line bg-cream lg:block">
        <SidebarContent />
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-cream/95 px-4 backdrop-blur lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="grid size-9 place-items-center rounded-lg border border-line bg-paper text-ink"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
        >
          <Menu size={17} />
        </button>
        <Logo />
        <Avatar src={profile?.avatar_url} name={profile?.full_name} size="sm" />
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 animate-fade bg-ink/35 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="relative h-full w-[280px] animate-[pop_0.25s_ease_both] border-r border-line bg-cream shadow-pop"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-lg text-muted hover:bg-ink/5 hover:text-ink"
              aria-label="Close navigation"
            >
              <X size={16} />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <main className="lg:pl-[248px]">
        <Outlet />
      </main>
    </div>
  )
}
