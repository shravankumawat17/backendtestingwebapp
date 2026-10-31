export type Role = 'user' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  age: number | null
  college: string | null
  course: string | null
  skills: string[]
  music_interests: string[]
  bio: string | null
  role: Role
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

/** A profile exposed to admins in the dashboard. */
export type AdminProfile = Profile

export interface ProfileDraft {
  full_name: string
  age: number | null
  college: string
  course: string
  skills: string[]
  music_interests: string[]
  bio: string
}

export const PROFILE_FIELDS: Array<keyof ProfileDraft> = [
  'full_name',
  'age',
  'college',
  'course',
  'skills',
  'music_interests',
  'bio',
]
