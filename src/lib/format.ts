import type { Profile, ProfileDraft } from './types'

export function firstName(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return 'there'
  return trimmed.split(/\s+/)[0]
}

export function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function memberSince(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function relativeTime(date: string | null | undefined): string {
  if (!date) return '—'
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(date)
}

export function toDraft(profile: Profile | null): ProfileDraft {
  return {
    full_name: profile?.full_name ?? '',
    age: profile?.age ?? null,
    college: profile?.college ?? '',
    course: profile?.course ?? '',
    skills: profile?.skills ?? [],
    music_interests: profile?.music_interests ?? [],
    bio: profile?.bio ?? '',
  }
}

export function parseList(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).slice(0, 12)
}

export function completion(profile: Profile | ProfileDraft | null): number {
  if (!profile) return 0
  const checks: boolean[] = [
    Boolean(profile.full_name?.trim()),
    Boolean(profile.age),
    Boolean(profile.college?.trim()),
    Boolean(profile.course?.trim()),
    profile.skills.length > 0,
    profile.music_interests.length > 0,
    Boolean(profile.bio?.trim()),
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export function pluralize(count: number, singular: string, plural?: string): string {
  const word = count === 1 ? singular : (plural ?? `${singular}s`)
  return `${count} ${word}`
}

export function displayValue(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  return trimmed || 'Not added yet'
}
