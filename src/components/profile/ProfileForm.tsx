import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, GraduationCap, Loader2, Sparkles, UserRound } from 'lucide-react'
import clsx from 'clsx'
import { supabase, toMessage } from '../../lib/supabase'
import { toDraft } from '../../lib/format'
import type { Profile, ProfileDraft } from '../../lib/types'
import { Field, Input, TagInput, Textarea } from '../ui/Field'
import { Button } from '../ui/Button'
import { useAuth } from '../../context/AuthContext'

type SectionKey = 'about' | 'campus' | 'interests'
type Errors = Partial<Record<keyof ProfileDraft, string>>

const sections: Array<{
  key: SectionKey
  label: string
  title: string
  description: string
  icon: typeof UserRound
}> = [
  {
    key: 'about',
    label: 'About you',
    title: 'Let’s start with the basics',
    description: 'This is how you’ll show up across CampusCircle.',
    icon: UserRound,
  },
  {
    key: 'campus',
    label: 'Campus',
    title: 'Where are you studying?',
    description: 'Your college and course help admins understand the community.',
    icon: GraduationCap,
  },
  {
    key: 'interests',
    label: 'Interests',
    title: 'What are you into?',
    description: 'Add a few skills, sounds you love, and a line about yourself.',
    icon: Sparkles,
  },
]

function validate(draft: ProfileDraft, keys: Array<keyof ProfileDraft>): Errors {
  const errors: Errors = {}
  if (keys.includes('full_name')) {
    if (!draft.full_name.trim()) errors.full_name = 'Please add your name.'
    else if (draft.full_name.trim().length < 2) errors.full_name = 'Name is too short.'
  }
  if (keys.includes('age')) {
    if (draft.age === null) errors.age = 'Please add your age.'
    else if (!Number.isInteger(draft.age) || draft.age < 13 || draft.age > 100)
      errors.age = 'Enter a whole-number age between 13 and 100.'
  }
  if (keys.includes('college') && !draft.college.trim()) errors.college = 'Please add your college.'
  if (keys.includes('course') && !draft.course.trim()) errors.course = 'Please add your course.'
  if (keys.includes('bio') && draft.bio.length > 400) errors.bio = 'Keep your bio under 400 characters.'
  return errors
}

export function ProfileForm({
  profile,
  mode,
  onSaved,
  onCancel,
  formId,
  showActions = true,
  onSavingChange,
}: {
  profile: Profile
  mode: 'onboarding' | 'edit'
  onSaved: () => void | Promise<void>
  onCancel?: () => void
  formId?: string
  showActions?: boolean
  onSavingChange?: (saving: boolean) => void
}) {
  const { refreshProfile } = useAuth()
  const formRef = useRef<HTMLFormElement>(null)
  const [draft, setDraft] = useState<ProfileDraft>(() => toDraft(profile))
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraft(toDraft(profile))
    // Only reset when switching to a different profile, not on every refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id])

  const update = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const save = async () => {
    const validation = validate(draft, [
      'full_name',
      'age',
      'college',
      'course',
      'bio',
    ])
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      setFormError('Please fix the highlighted fields before saving.')
      formRef.current
        ?.closest('.scrollbar-slim')
        ?.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSaving(true)
    onSavingChange?.(true)
    setFormError(null)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: draft.full_name.trim(),
        age: draft.age,
        college: draft.college.trim(),
        course: draft.course.trim(),
        skills: draft.skills,
        music_interests: draft.music_interests,
        bio: draft.bio.trim() || null,
        onboarding_completed: true,
      })
      .eq('id', profile.id)

    if (error) {
      setFormError(toMessage(error))
      setSaving(false)
      onSavingChange?.(false)
      return
    }

    await refreshProfile()
    setSaving(false)
    onSavingChange?.(false)
    await onSaved()
  }

  const handleNext = (event: FormEvent) => {
    event.preventDefault()
    const activeSection = sections[step]
    const keysBySection: Record<SectionKey, Array<keyof ProfileDraft>> = {
      about: ['full_name', 'age'],
      campus: ['college', 'course'],
      interests: [],
    }
    const validation = validate(draft, keysBySection[activeSection.key])
    setErrors(validation)
    if (Object.keys(validation).length > 0) return
    setFormError(null)
    if (step === sections.length - 1) {
      // Pressing Enter on the final step should finish setup, not do nothing.
      void save()
      return
    }
    setStep((prev) => Math.min(prev + 1, sections.length - 1))
  }

  const current = sections[step]
  const CurrentIcon = current.icon

  const sectionBody = (key: SectionKey) => {
    if (key === 'about') {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Full name" htmlFor="full_name" error={errors.full_name}>
              <Input
                id="full_name"
                value={draft.full_name}
                onChange={(event) => update('full_name', event.target.value)}
                placeholder="Aarav Mehta"
                autoComplete="name"
                invalid={Boolean(errors.full_name)}
              />
            </Field>
          </div>
          <Field label="Age" htmlFor="age" hint="13–100" error={errors.age}>
            <Input
              id="age"
              type="number"
              min={13}
              max={100}
              step={1}
              value={draft.age ?? ''}
              onChange={(event) =>
                update('age', event.target.value === '' ? null : Number(event.target.value))
              }
              placeholder="20"
              invalid={Boolean(errors.age)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Email" htmlFor="email" hint="Managed by Google">
              <Input
                id="email"
                value={profile.email}
                readOnly
                disabled
                className="cursor-not-allowed bg-ink/[0.03] text-muted"
              />
            </Field>
          </div>
        </div>
      )
    }

    if (key === 'campus') {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="College" htmlFor="college" error={errors.college}>
            <Input
              id="college"
              value={draft.college}
              onChange={(event) => update('college', event.target.value)}
              placeholder="IIT Bombay"
              invalid={Boolean(errors.college)}
            />
          </Field>
          <Field label="Course" htmlFor="course" error={errors.course}>
            <Input
              id="course"
              value={draft.course}
              onChange={(event) => update('course', event.target.value)}
              placeholder="B.Tech, Computer Science"
              invalid={Boolean(errors.course)}
            />
          </Field>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <Field
          label="Skills"
          hint={`${draft.skills.length}/12 · press Enter to add`}
          htmlFor="skills"
          optional
        >
          <TagInput
            id="skills"
            value={draft.skills}
            onChange={(next) => update('skills', next)}
            placeholder="React, Public speaking, Figma…"
          />
        </Field>
        <Field
          label="Music interests"
          hint={`${draft.music_interests.length}/12`}
          htmlFor="music"
          optional
        >
          <TagInput
            id="music"
            value={draft.music_interests}
            onChange={(next) => update('music_interests', next)}
            placeholder="Indie, Hip-hop, Lo-fi…"
          />
        </Field>
        <Field label="Short bio" htmlFor="bio" hint={`${draft.bio.length}/400`} optional>
          <Textarea
            id="bio"
            value={draft.bio}
            maxLength={400}
            onChange={(event) => update('bio', event.target.value)}
            placeholder="A sentence or two about what you're curious about right now."
            invalid={Boolean(errors.bio)}
          />
        </Field>
      </div>
    )
  }

  if (mode === 'edit') {
    return (
      <form
        id={formId}
        ref={formRef}
        onSubmit={(event) => {
          event.preventDefault()
          void save()
        }}
        className="space-y-6"
      >
        {formError && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-[12.5px] text-danger">
            {formError}
          </p>
        )}

        <section className="space-y-4">
          <SectionHeading icon={UserRound} title="About you" />
          {sectionBody('about')}
        </section>
        <div className="h-px bg-line" />
        <section className="space-y-4">
          <SectionHeading icon={GraduationCap} title="Campus" />
          {sectionBody('campus')}
        </section>
        <div className="h-px bg-line" />
        <section className="space-y-4">
          <SectionHeading icon={Sparkles} title="Interests" />
          {sectionBody('interests')}
        </section>

        {showActions && (
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
                Cancel
              </Button>
            )}
            <Button type="submit" loading={saving} icon={<Check size={15} />}>
              Save changes
            </Button>
          </div>
        )}
      </form>
    )
  }

  return (
    <form onSubmit={handleNext} className="flex flex-1 flex-col">
      <div className="mb-7 flex items-center gap-2" aria-label="Onboarding progress">
        {sections.map((section, index) => (
          <div key={section.key} className="flex flex-1 items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink/[0.08]">
              <div
                className={clsx(
                  'h-full rounded-full bg-ink transition-all duration-500',
                  index <= step ? 'w-full' : 'w-0',
                )}
              />
            </div>
          </div>
        ))}
        <span className="ml-1 text-[11px] font-semibold tabular-nums text-muted">
          {step + 1}/{sections.length}
        </span>
      </div>

      <div key={current.key} className="animate-rise pb-8">
        <span className="mb-4 grid size-11 place-items-center rounded-xl border border-line bg-paper text-accent shadow-[0_1px_2px_rgba(28,27,26,0.04)]">
          <CurrentIcon size={19} strokeWidth={1.7} />
        </span>
        <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
          Step {step + 1} · {current.label}
        </p>
        <h2 className="mt-1.5 font-display text-[30px] leading-[1.08] tracking-[-0.01em]">
          {current.title}
        </h2>
        <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-muted">{current.description}</p>

        <div className="mt-7">{sectionBody(current.key)}</div>
      </div>

      {formError && (
        <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-[12.5px] text-danger">
          {formError}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-5">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((prev) => Math.max(0, prev - 1))}
          disabled={step === 0 || saving}
          icon={<ArrowLeft size={15} />}
        >
          Back
        </Button>

        {step < sections.length - 1 ? (
          <Button type="submit" icon={<ArrowRight size={15} />}>
            Continue
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => void save()}
            loading={saving}
            icon={!saving ? <Check size={15} /> : undefined}
          >
            {saving ? 'Saving your profile…' : 'Finish setup'}
          </Button>
        )}
      </div>

      {step === sections.length - 1 && (
        <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-muted">
          <Loader2 size={11} className={saving ? 'animate-spin' : 'opacity-0'} />
          You can update any of this later from your dashboard.
        </p>
      )}
    </form>
  )
}

function SectionHeading({ icon: Icon, title }: { icon: typeof UserRound; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={15} className="text-muted" />
      <h3 className="text-[12px] font-semibold tracking-[0.1em] text-muted uppercase">{title}</h3>
    </div>
  )
}
