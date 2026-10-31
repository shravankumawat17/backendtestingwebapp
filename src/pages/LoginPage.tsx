import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ArrowUpRight, BookOpen, Music2, Sparkles, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Logo } from '../components/ui/Logo'
import { Avatar } from '../components/ui/Avatar'
import { toMessage } from '../lib/supabase'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.6151Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.4673-.806 5.9564-2.1809l-2.9087-2.2581c-.806.54-1.8368.859-3.0477.859-2.3441 0-4.3282-1.5832-5.036-3.7104H.9574v2.3327C2.4382 15.9832 5.4818 18 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71c-.18-.54-.2827-1.1168-.2827-1.71s.1027-1.17.2827-1.71V4.9573H.9574A8.9965 8.9965 0 0 0 0 9c0 1.4523.3477 2.8268.9574 4.0427L3.964 10.71Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.5809c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9573L3.964 7.29C4.6718 5.1627 6.6559 3.5809 9 3.5809Z"
      />
    </svg>
  )
}

const highlights = [
  { icon: BookOpen, text: 'Academics, skills and interests in one profile' },
  { icon: Music2, text: 'Tell your campus story in your own words' },
  { icon: Users, text: 'Admins get a clear view of every member' },
]

function readOAuthError(): string | null {
  const query = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const error = query.get('error') ?? hash.get('error')
  if (!error) return null
  return (
    query.get('error_description') ??
    hash.get('error_description') ??
    'Google sign-in was cancelled or could not be completed. Please try again.'
  )
}

export function LoginPage() {
  const { session, profile, signInWithGoogle, configured } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(readOAuthError)

  useEffect(() => {
    if (!readOAuthError()) return
    const url = new URL(window.location.href)
    ;['error', 'error_description', 'error_code', 'error_uri'].forEach((key) => {
      url.searchParams.delete(key)
    })
    url.hash = ''
    window.history.replaceState({}, '', url.toString())
  }, [])

  if (session) {
    return <Navigate to={profile && !profile.onboarding_completed ? '/onboarding' : '/dashboard'} replace />
  }

  const handleSignIn = async () => {
    setBusy(true)
    setError(null)
    try {
      await signInWithGoogle()
      // The browser redirects to Google; keep the spinner until it does.
    } catch (signInError) {
      setError(toMessage(signInError))
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.08fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink px-12 py-10 text-paper lg:flex xl:px-16">
        <div
          className="pointer-events-none absolute -left-24 top-1/3 size-[520px] rounded-full opacity-60 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(67,56,202,0.55), transparent 68%)' }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 grain opacity-[0.12]" aria-hidden />

        <div className="relative z-10">
          <Logo inverse />
        </div>

        <div className="relative z-10 max-w-lg animate-rise">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-paper/15 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-paper/65 uppercase">
            <Sparkles size={12} /> Your campus, connected
          </p>
          <h1 className="text-balance font-display text-[clamp(2.9rem,4.4vw,4.2rem)] leading-[0.98] tracking-[-0.01em]">
            One profile.
            <br />
            Your whole
            <br />
            <span className="italic text-paper/55">campus story.</span>
          </h1>
          <p className="mt-6 max-w-md text-[14.5px] leading-relaxed text-paper/55">
            Sign in with Google, fill in a short profile, and keep everything about your college
            life in one calm, private place.
          </p>

          <div className="relative mt-10 h-[214px] max-w-md">
            <div
              className="absolute left-6 top-8 w-[268px] rotate-[-3deg] rounded-2xl border border-paper/15 bg-paper p-4 text-ink shadow-pop"
              aria-hidden
            >
              <div className="flex items-center gap-3">
                <Avatar name="Aarav Mehta" size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold">Aarav Mehta</p>
                  <p className="truncate text-[12px] text-muted">B.Tech · Computer Science</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted">IIT Bombay · 2nd year</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['UI design', 'Indie music', 'Football', 'React'].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-ink/[0.06] px-2 py-1 text-[10.5px] font-medium text-ink/75"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-3.5 flex items-center justify-between border-t border-line pt-3">
                <span className="text-[10.5px] font-medium text-muted">Profile complete</span>
                <span className="text-[11px] font-semibold text-success">86%</span>
              </div>
            </div>

            <div
              className="absolute bottom-0 right-0 flex items-center gap-2.5 rounded-xl border border-paper/15 bg-[#2b2926] px-3.5 py-2.5 text-paper shadow-pop"
              aria-hidden
            >
              <span className="grid size-7 place-items-center rounded-full bg-success/20 text-success">
                <Users size={13} />
              </span>
              <div>
                <p className="text-[11px] font-semibold">128 members</p>
                <p className="text-[10px] text-paper/45">across 12 colleges</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-[11px] text-paper/35">
          <span className="size-1 rounded-full bg-paper/30" />
          Built with Supabase · Secure by default
        </div>
      </aside>

      <section className="flex min-h-dvh flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between lg:hidden">
          <Logo />
          <span className="text-[11px] font-medium tracking-wide text-muted uppercase">Welcome</span>
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px] animate-rise">
            <p className="text-[12px] font-semibold tracking-[0.14em] text-muted uppercase">Sign in</p>
            <h2 className="mt-2 font-display text-[38px] leading-[1.05] tracking-[-0.01em]">
              Nice to see you.
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Use your Google account to continue. No passwords to remember, no forms to fill twice.
            </p>

            {!configured && (
              <div className="mt-6 rounded-xl border border-[#e8d9b8] bg-amber-soft p-3.5">
                <p className="text-[12.5px] font-semibold text-[#7a5010]">Supabase isn't connected yet</p>
                <p className="mt-1 text-[12px] leading-relaxed text-[#8a6a2a]">
                  Add your project URL and anon key to <code className="font-mono">.env</code>, then
                  restart the dev server. Setup steps are in the README.
                </p>
              </div>
            )}

            <div className="mt-7">
              <button
                onClick={handleSignIn}
                disabled={busy || !configured}
                className="group flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-line bg-paper px-5 text-[14px] font-medium text-ink shadow-[0_1px_2px_rgba(28,27,26,0.05)] transition-all hover:border-ink/25 hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
              >
                <GoogleIcon />
                {busy ? 'Redirecting to Google…' : 'Continue with Google'}
                <ArrowUpRight
                  size={15}
                  className="ml-auto text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </button>

              {error && (
                <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-[12.5px] text-danger">
                  {error}
                </p>
              )}
            </div>

            <div className="my-7 flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[10.5px] font-medium tracking-[0.12em] text-muted uppercase">
                What you get
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <ul className="space-y-3">
              {highlights.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-[13px] text-muted">
                  <span className="mt-px grid size-6 shrink-0 place-items-center rounded-md border border-line bg-paper text-ink/70">
                    <Icon size={12.5} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <p className="mt-9 text-[11.5px] leading-relaxed text-muted/80">
              By continuing you agree to keep campus data respectful and accurate. Your profile is
              visible to you and to campus admins only.
            </p>
          </div>
        </div>

        <footer className="flex items-center justify-center gap-1.5 text-[11px] text-muted lg:justify-start">
          <span>© {new Date().getFullYear()} CampusCircle</span>
          <span className="text-line">·</span>
          <span>Made for students</span>
        </footer>
      </section>
    </main>
  )
}
