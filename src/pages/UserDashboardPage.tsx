import { useState } from 'react'
import {
  CalendarDays,
  Cake,
  Check,
  GraduationCap,
  BookOpen,
  Headphones,
  KeyRound,
  Lock,
  Mail,
  Pencil,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import { ProfileForm } from '../components/profile/ProfileForm'
import { completion, displayValue, firstName, formatDate, memberSince, pluralize } from '../lib/format'

function ProgressRing({ value, size = 76 }: { value: number; size?: number }) {
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,253,248,0.16)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#a5b4fc"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (value / 100) * circumference}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[16px] font-semibold tabular-nums text-paper">
        {value}%
      </span>
    </div>
  )
}

function Tag({ children }: { children: string }) {
  return (
    <span className="rounded-md border border-line bg-cream/70 px-2.5 py-1 text-[12px] font-medium text-ink/75">
      {children}
    </span>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Cake
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-cream/60 text-muted">
        <Icon size={14} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold tracking-[0.1em] text-muted/85 uppercase">{label}</p>
        <p className="mt-0.5 break-words text-[13px] font-medium text-ink">{value}</p>
      </div>
    </div>
  )
}

export function UserDashboardPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [editSaving, setEditSaving] = useState(false)

  if (!profile) return null

  const percent = completion(profile)
  const missing = [
    !profile.age && 'age',
    !profile.college?.trim() && 'college',
    !profile.course?.trim() && 'course',
    profile.skills.length === 0 && 'skills',
    profile.music_interests.length === 0 && 'music interests',
    !profile.bio?.trim() && 'a short bio',
  ].filter(Boolean) as string[]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-7 sm:py-10">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
              Your dashboard
            </p>
            <h1 className="mt-1.5 font-display text-[40px] leading-[1.02] tracking-[-0.015em] sm:text-[46px]">
              {greeting}, {firstName(profile.full_name)}.
            </h1>
            <p className="mt-2 text-[13.5px] text-muted">
              Here’s your CampusCircle profile, exactly as admins see it.
            </p>
          </div>
          <Button
            variant="secondary"
            icon={<Pencil size={14} />}
            onClick={() => setEditing(true)}
            className="self-start sm:self-auto"
          >
            Edit profile
          </Button>
        </header>

        <section className="relative mt-8 overflow-hidden rounded-2xl bg-ink p-5 text-paper shadow-card sm:p-6">
          <div
            className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full opacity-70 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(67,56,202,0.5), transparent 68%)' }}
            aria-hidden
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <ProgressRing value={percent} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-[24px] leading-tight">
                    {percent === 100 ? 'Your profile is complete' : 'Finish your profile'}
                  </h2>
                  <span className="rounded-full border border-paper/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-paper/60 uppercase">
                    {percent === 100 ? 'All set' : 'In progress'}
                  </span>
                </div>
                <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-paper/55">
                  {percent === 100
                    ? 'Everything is filled in. You can still update your details any time.'
                    : missing.length > 0
                      ? `Still missing: ${missing.join(', ')}.`
                      : 'A few details are still missing.'}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => setEditing(true)}
              className="shrink-0"
              icon={<Wand2 size={14} />}
            >
              {percent === 100 ? 'Update details' : 'Complete profile'}
            </Button>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-paper p-5 shadow-card sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar src={profile.avatar_url} name={profile.full_name} size="xl" />
                <div className="min-w-0">
                  <h2 className="truncate font-display text-[28px] leading-tight">
                    {profile.full_name || 'New member'}
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px] text-muted">
                    <Mail size={12} /> {profile.email}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge tone={profile.role === 'admin' ? 'accent' : 'neutral'}>
                      {profile.role === 'admin' ? 'Campus admin' : 'Member'}
                    </Badge>
                    {profile.course?.trim() && (
                      <span className="text-[11.5px] text-muted">{profile.course}</span>
                    )}
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 self-start rounded-lg border border-line bg-cream/60 px-2.5 py-1 text-[11px] font-medium text-muted">
                <CalendarDays size={12} /> Joined {memberSince(profile.created_at)}
              </span>
            </div>

            <div className="mt-6 border-t border-line pt-5">
              <p className="text-[10.5px] font-semibold tracking-[0.12em] text-muted uppercase">About</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink/85">
                {profile.bio?.trim() || (
                  <span className="text-muted">
                    No bio yet. A sentence about what you’re into goes a long way.
                  </span>
                )}
              </p>
            </div>

            <div className="mt-6 grid gap-6 border-t border-line pt-5 sm:grid-cols-2">
              <div>
                <p className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.12em] text-muted uppercase">
                  <Sparkles size={11} /> Skills
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {profile.skills.length > 0 ? (
                    profile.skills.map((skill) => <Tag key={skill}>{skill}</Tag>)
                  ) : (
                    <button
                      onClick={() => setEditing(true)}
                      className="text-[12.5px] text-muted underline decoration-line underline-offset-4 hover:text-ink"
                    >
                      Add a few skills
                    </button>
                  )}
                </div>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.12em] text-muted uppercase">
                  <Headphones size={11} /> Music
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {profile.music_interests.length > 0 ? (
                    profile.music_interests.map((interest) => <Tag key={interest}>{interest}</Tag>)
                  ) : (
                    <button
                      onClick={() => setEditing(true)}
                      className="text-[12.5px] text-muted underline decoration-line underline-offset-4 hover:text-ink"
                    >
                      Add what you listen to
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

            <section className="rounded-2xl border border-line bg-paper p-5 shadow-card sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-ink">Account &amp; access</h2>
                <Badge tone={profile.role === 'admin' ? 'accent' : 'neutral'}>
                  {profile.role === 'admin' ? 'Admin' : 'Member'}
                </Badge>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-cream/60 text-muted">
                    <Mail size={14} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold tracking-[0.1em] text-muted/85 uppercase">
                      Email
                    </p>
                    <p className="truncate text-[12.5px] font-medium text-ink">{profile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-cream/60 text-muted">
                    <KeyRound size={14} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold tracking-[0.1em] text-muted/85 uppercase">
                      Sign-in
                    </p>
                    <p className="text-[12.5px] font-medium text-ink">Google · Supabase Auth</p>
                  </div>
                </div>
              </div>
              <p className="mt-4 border-t border-line pt-3 text-[11.5px] leading-relaxed text-muted">
                Your identity is managed by Google. To use a different email, sign in with that
                Google account instead.
              </p>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-line bg-paper p-5 shadow-card sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-ink">Profile details</h2>
                <button
                  onClick={() => setEditing(true)}
                  className="text-[11.5px] font-medium text-muted transition-colors hover:text-ink"
                >
                  Edit
                </button>
              </div>
              <div className="mt-2 divide-y divide-line">
                <DetailRow icon={Cake} label="Age" value={profile.age ? `${profile.age} years` : 'Not added yet'} />
                <DetailRow
                  icon={GraduationCap}
                  label="College"
                  value={displayValue(profile.college)}
                />
                <DetailRow icon={BookOpen} label="Course" value={displayValue(profile.course)} />
                <DetailRow
                  icon={CalendarDays}
                  label="Last updated"
                  value={formatDate(profile.updated_at)}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-accent-soft/50 p-5 sm:p-6">
              <span className="grid size-9 place-items-center rounded-lg border border-accent/15 bg-paper text-accent">
                <Lock size={15} strokeWidth={1.8} />
              </span>
              <h2 className="mt-3 text-[13px] font-semibold text-ink">Private by default</h2>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                Your profile is visible to you and campus admins only. Admins can update or remove
                member accounts when needed.
              </p>
              <p className="mt-3 text-[11px] text-muted/80">
                {pluralize(profile.skills.length, 'skill')} ·{' '}
                {pluralize(profile.music_interests.length, 'music interest')}
              </p>
            </section>
          </div>
        </div>

        <p className="mt-8 text-center text-[11px] text-muted/70">
          CampusCircle · your data lives securely in Supabase
        </p>
      </div>

      <Modal
        open={editing}
        onClose={() => {
          if (!editSaving) setEditing(false)
        }}
        title="Edit your profile"
        description="Changes are saved to your Supabase profile."
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditing(false)}
              disabled={editSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="user-profile-form"
              loading={editSaving}
              icon={!editSaving ? <Check size={15} /> : undefined}
            >
              Save changes
            </Button>
          </>
        }
      >
        <ProfileForm
          profile={profile}
          mode="edit"
          formId="user-profile-form"
          showActions={false}
          onSavingChange={setEditSaving}
          onSaved={() => {
            setEditing(false)
            toast('success', 'Profile updated', 'Your changes are live.')
          }}
        />
      </Modal>
    </>
  )
}
