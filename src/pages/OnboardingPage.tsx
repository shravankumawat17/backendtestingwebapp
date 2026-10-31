import { Navigate, useNavigate } from 'react-router-dom'
import { GraduationCap, LogOut, Sparkles, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Logo } from '../components/ui/Logo'
import { ProfileForm } from '../components/profile/ProfileForm'
import { Avatar } from '../components/ui/Avatar'
import { useToast } from '../components/ui/Toast'
import { toMessage } from '../lib/supabase'

const notes = [
  {
    icon: UserRound,
    title: 'Basics first',
    text: 'Name and age help admins know who’s who in the community.',
  },
  {
    icon: GraduationCap,
    title: 'Campus context',
    text: 'Your college and course make the member directory useful.',
  },
  {
    icon: Sparkles,
    title: 'Make it yours',
    text: 'Skills and music interests are optional — add them whenever.',
  },
]

export function OnboardingPage() {
  const { profile, signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  if (!profile) return null
  if (profile.onboarding_completed) return <Navigate to="/dashboard" replace />

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      toast('error', 'Could not sign out', toMessage(error))
    }
  }

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Logo />
        <div className="flex items-center gap-2.5">
          <div className="hidden text-right sm:block">
            <p className="max-w-48 truncate text-[12px] font-medium text-ink">{profile.email}</p>
            <p className="text-[10.5px] text-muted">Setting up your profile</p>
          </div>
          <Avatar src={profile.avatar_url} name={profile.full_name} size="sm" />
          <button
            onClick={handleSignOut}
            className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-ink/5 hover:text-ink"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 items-center px-5 py-8 sm:px-8 lg:px-12">
        <div className="grid w-full gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <aside className="hidden flex-col justify-center animate-rise lg:flex">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
              One minute setup
            </p>
            <h1 className="mt-3 text-balance font-display text-[52px] leading-[0.98] tracking-[-0.015em]">
              Tell us a little
              <br />
              <span className="italic text-muted">about you.</span>
            </h1>
            <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-muted">
              Three short steps, then you’re in. Your profile stays private to you and your campus
              admins.
            </p>

            <div className="mt-10 space-y-5">
              {notes.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-3.5">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-paper text-ink/70">
                    <Icon size={15} strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-ink">{title}</p>
                    <p className="mt-0.5 max-w-xs text-[12.5px] leading-relaxed text-muted">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="animate-rise flex flex-col rounded-2xl border border-line bg-paper p-6 shadow-card sm:p-8 lg:min-h-[714px]">
            <div className="mb-6 flex items-center gap-2 lg:hidden">
              <span className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
                Quick setup
              </span>
            </div>
            <ProfileForm
              profile={profile}
              mode="onboarding"
              onSaved={() => {
                toast('success', 'Profile created', 'Welcome to CampusCircle.')
                navigate('/dashboard', { replace: true })
              }}
            />
          </div>
        </div>
      </div>

      <footer className="px-5 pb-6 text-center text-[11px] text-muted sm:px-8 lg:px-12 lg:text-left">
        You can edit everything later from your dashboard.
      </footer>
    </main>
  )
}
