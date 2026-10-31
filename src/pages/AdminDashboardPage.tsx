import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import clsx from 'clsx'
import { supabase, toMessage } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { AdminProfile } from '../lib/types'
import { completion, firstName, formatDate, pluralize, relativeTime } from '../lib/format'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { EmptyState, Skeleton } from '../components/ui/Feedback'
import { useToast } from '../components/ui/Toast'
import { ProfileForm } from '../components/profile/ProfileForm'
import { MemberDetailModal } from '../components/admin/MemberDetailModal'

type Filter = 'all' | 'complete' | 'incomplete' | 'admins'

const filters: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'All members' },
  { value: 'complete', label: 'Complete profiles' },
  { value: 'incomplete', label: 'Incomplete profiles' },
  { value: 'admins', label: 'Admins only' },
]

function Stat({
  icon: Icon,
  label,
  value,
  note,
  tone = 'neutral',
}: {
  icon: typeof Users
  label: string
  value: string | number
  note: string
  tone?: 'neutral' | 'accent'
}) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-line p-4 shadow-card',
        tone === 'accent' ? 'bg-accent-soft/60' : 'bg-paper',
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">{label}</p>
        <Icon size={15} className={tone === 'accent' ? 'text-accent' : 'text-muted/70'} />
      </div>
      <p className="mt-2 font-display text-[32px] leading-none tabular-nums">{value}</p>
      <p className="mt-1.5 text-[11px] text-muted">{note}</p>
    </div>
  )
}

function csvEscape(value: unknown): string {
  const text = value == null ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function AdminDashboardPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [members, setMembers] = useState<AdminProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [detail, setDetail] = useState<AdminProfile | null>(null)
  const [editing, setEditing] = useState<AdminProfile | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [deleting, setDeleting] = useState<AdminProfile | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      setLoadError(error.message)
      setLoading(false)
      return
    }
    setMembers((data ?? []) as AdminProfile[])
    setLastSynced(new Date().toISOString())
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const stats = useMemo(() => {
    const total = members.length
    const complete = members.filter((member) => member.onboarding_completed).length
    const admins = members.filter((member) => member.role === 'admin').length
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const newThisWeek = members.filter(
      (member) => new Date(member.created_at).getTime() >= weekAgo,
    ).length
    return {
      total,
      complete,
      admins,
      newThisWeek,
      completionRate: total > 0 ? Math.round((complete / total) * 100) : 0,
    }
  }, [members])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return members.filter((member) => {
      if (filter === 'complete' && !member.onboarding_completed) return false
      if (filter === 'incomplete' && member.onboarding_completed) return false
      if (filter === 'admins' && member.role !== 'admin') return false
      if (!needle) return true
      const haystack = [
        member.full_name,
        member.email,
        member.college,
        member.course,
        member.bio,
        ...member.skills,
        ...member.music_interests,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [members, query, filter])

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    setDeleteError(null)
    const { error } = await supabase.rpc('admin_delete_user', { target_id: deleting.id })
    if (error) {
      setDeleteError(toMessage(error))
      setDeleteBusy(false)
      return
    }
    setMembers((prev) => prev.filter((member) => member.id !== deleting.id))
    toast('success', 'User deleted', `${deleting.full_name || deleting.email} was removed.`)
    setDeleteBusy(false)
    setDeleting(null)
    setDetail(null)
  }

  const exportCsv = () => {
    const rows = filtered.map((member) =>
      [
        member.full_name,
        member.email,
        member.age ?? '',
        member.college ?? '',
        member.course ?? '',
        member.skills.join('; '),
        member.music_interests.join('; '),
        member.bio ?? '',
        member.role,
        member.onboarding_completed ? 'yes' : 'no',
        member.created_at,
      ]
        .map(csvEscape)
        .join(','),
    )
    const header =
      'Name,Email,Age,College,Course,Skills,Music interests,Bio,Role,Profile complete,Joined'
    const blob = new Blob([`${header}\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `campuscircle-members-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast('success', 'Export started', `${pluralize(filtered.length, 'member')} exported to CSV.`)
  }

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-7 sm:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
              <ShieldCheck size={12} className="text-accent" /> Admin console
            </p>
            <h1 className="mt-1.5 font-display text-[40px] leading-[1.02] tracking-[-0.015em] sm:text-[46px]">
              Member directory
            </h1>
            <p className="mt-2 text-[13.5px] text-muted">
              Every CampusCircle profile, in one place. Search, review, edit or remove members.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => void load()}
            loading={loading}
            icon={!loading ? <RefreshCw size={14} /> : undefined}
            className="self-start sm:self-auto"
          >
            Refresh
          </Button>
        </header>

        <section className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Stat
            icon={Users}
            label="Total members"
            value={stats.total}
            note={stats.total === 0 ? 'No one has joined yet' : `${stats.complete} completed profiles`}
          />
          <Stat
            icon={CheckCircle2}
            label="Completion"
            value={`${stats.completionRate}%`}
            note={`${pluralize(stats.complete, 'profile')} fully set up`}
          />
          <Stat
            icon={ShieldCheck}
            label="Admins"
            value={stats.admins}
            note="With full directory access"
          />
          <Stat
            icon={TrendingUp}
            label="New this week"
            value={stats.newThisWeek}
            note="Sign-ups in the last 7 days"
            tone={stats.newThisWeek > 0 ? 'accent' : 'neutral'}
          />
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-paper shadow-card">
          <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, email, college, skills…"
                className="h-10 w-full rounded-[9px] border border-line bg-cream/50 pl-9 pr-3 text-[13px] placeholder:text-muted/60 transition-colors focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/15"
                aria-label="Search members"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value as Filter)}
                  className="h-10 appearance-none rounded-[9px] border border-line bg-cream/50 pl-3 pr-8 text-[12.5px] font-medium text-ink transition-colors hover:border-ink/20 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/15"
                  aria-label="Filter members"
                >
                  {filters.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
                />
              </div>
              <Button
                variant="secondary"
                onClick={exportCsv}
                disabled={filtered.length === 0}
                icon={<Download size={14} />}
                className="shrink-0"
              >
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2, 3, 4].map((row) => (
                <div key={row} className="flex items-center gap-4">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-2.5 w-56" />
                  </div>
                  <Skeleton className="hidden h-3 w-24 sm:block" />
                  <Skeleton className="h-3 w-14" />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <EmptyState
              icon={<ShieldCheck size={20} />}
              title="Couldn’t load members"
              description={loadError}
              action={
                <Button variant="secondary" onClick={() => void load()} icon={<RefreshCw size={14} />}>
                  Try again
                </Button>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<UserPlus size={20} />}
              title={members.length === 0 ? 'No members yet' : 'No matching members'}
              description={
                members.length === 0
                  ? 'Once people sign in with Google and finish onboarding, they’ll appear here.'
                  : 'Try a different search term or reset the filter to see everyone.'
              }
              action={
                members.length > 0 ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setQuery('')
                      setFilter('all')
                    }}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-line bg-cream/40 text-[10px] font-semibold tracking-[0.1em] text-muted uppercase">
                      <th className="px-5 py-2.5 font-semibold">Member</th>
                      <th className="px-4 py-2.5 font-semibold">Campus</th>
                      <th className="px-4 py-2.5 font-semibold">Profile</th>
                      <th className="px-4 py-2.5 font-semibold">Role</th>
                      <th className="px-4 py-2.5 font-semibold">Joined</th>
                      <th className="px-5 py-2.5 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filtered.map((member) => {
                      const percent = completion(member)
                      const isSelf = member.id === profile?.id
                      return (
                        <tr
                          key={member.id}
                          onClick={() => setDetail(member)}
                          onKeyDown={(event) => {
                            if (event.target !== event.currentTarget) return
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              setDetail(member)
                            }
                          }}
                          tabIndex={0}
                          className="group cursor-pointer transition-colors hover:bg-cream/50"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar src={member.avatar_url} name={member.full_name} size="sm" />
                              <div className="min-w-0">
                                <p className="flex items-center gap-1.5 truncate text-[13px] font-semibold text-ink">
                                  {member.full_name || 'Unnamed member'}
                                  {isSelf && (
                                    <span className="rounded bg-ink/[0.06] px-1 py-0.5 text-[9px] font-semibold tracking-wide text-muted uppercase">
                                      You
                                    </span>
                                  )}
                                </p>
                                <p className="truncate text-[11.5px] text-muted">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="max-w-48 px-4 py-3">
                            <p className="truncate text-[12.5px] font-medium text-ink/85">
                              {member.college || '—'}
                            </p>
                            <p className="truncate text-[11.5px] text-muted">{member.course || '—'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-14 overflow-hidden rounded-full bg-ink/[0.08]">
                                <div
                                  className={clsx(
                                    'h-full rounded-full',
                                    percent === 100 ? 'bg-success' : 'bg-accent',
                                  )}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="text-[11.5px] font-medium tabular-nums text-muted">
                                {percent}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone={member.role === 'admin' ? 'accent' : 'neutral'}>
                              {member.role === 'admin' ? 'Admin' : 'Member'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-[12px] text-muted">
                            {formatDate(member.created_at)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-0.5">
                              <IconAction
                                label="View member"
                                icon={<Eye size={14} />}
                                onClick={() => setDetail(member)}
                              />
                              <IconAction
                                label="Edit member"
                                icon={<Pencil size={14} />}
                                onClick={() => {
                                  setEditSaving(false)
                                  setEditing(member)
                                }}
                              />
                              <IconAction
                                label="Delete member"
                                icon={<Trash2 size={14} />}
                                danger
                                disabled={isSelf}
                                onClick={() => {
                                  setDeleteError(null)
                                  setDeleting(member)
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-line lg:hidden">
                {filtered.map((member) => {
                  const percent = completion(member)
                  const isSelf = member.id === profile?.id
                  return (
                    <button
                      key={member.id}
                      onClick={() => setDetail(member)}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-cream/60"
                    >
                      <Avatar src={member.avatar_url} name={member.full_name} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-ink">
                          {member.full_name || 'Unnamed member'}
                          {isSelf && <span className="ml-1.5 text-[10px] text-muted">(you)</span>}
                        </p>
                        <p className="truncate text-[11.5px] text-muted">{member.email}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[11px] text-muted">{percent}% complete</span>
                          <span className="text-line">·</span>
                          <span className="text-[11px] text-muted">
                            {member.college || 'No college'}
                          </span>
                        </div>
                      </div>
                      <ChevronDown size={15} className="shrink-0 -rotate-90 text-muted" />
                    </button>
                  )
                })}
              </div>

              <div className="flex flex-col gap-1 border-t border-line bg-cream/35 px-5 py-3 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Showing {filtered.length} of {pluralize(members.length, 'member')}
                </span>
                <span>Last synced {relativeTime(lastSynced)}</span>
              </div>
            </>
          )}
        </section>

        <p className="mt-6 text-center text-[11px] text-muted/70">
          Admins can edit or delete members. Every action is protected by row-level security.
        </p>
      </div>

      <MemberDetailModal
        member={detail}
        onClose={() => setDetail(null)}
        onEdit={(member) => {
          setDetail(null)
          setEditSaving(false)
          setEditing(member)
        }}
        onDelete={(member) => {
          setDetail(null)
          setDeleteError(null)
          setDeleting(member)
        }}
        isSelf={detail?.id === profile?.id}
      />

      <Modal
        open={Boolean(editing)}
        onClose={() => {
          if (!editSaving) setEditing(null)
        }}
        title={editing ? `Edit ${firstName(editing.full_name)}’s profile` : 'Edit profile'}
        description="Admin changes save directly to this member’s record."
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditing(null)}
              disabled={editSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="admin-profile-form"
              loading={editSaving}
              icon={!editSaving ? <Check size={15} /> : undefined}
            >
              Save changes
            </Button>
          </>
        }
      >
        {editing && (
          <ProfileForm
            profile={editing}
            mode="edit"
            formId="admin-profile-form"
            showActions={false}
            onSavingChange={setEditSaving}
            onSaved={async () => {
              setEditing(null)
              await load()
              toast('success', 'Member updated', 'The profile changes have been saved.')
            }}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => {
          if (deleteBusy) return
          setDeleting(null)
          setDeleteError(null)
        }}
        title="Delete this user?"
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleting(null)
                setDeleteError(null)
              }}
              disabled={deleteBusy}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleDelete()}
              loading={deleteBusy}
              icon={!deleteBusy ? <Trash2 size={14} /> : undefined}
            >
              Delete permanently
            </Button>
          </>
        }
      >
        {deleting && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-cream/60 p-3">
              <Avatar src={deleting.avatar_url} name={deleting.full_name} size="md" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-ink">
                  {deleting.full_name || 'Unnamed member'}
                </p>
                <p className="truncate text-[11.5px] text-muted">{deleting.email}</p>
              </div>
            </div>
            <p className="text-[13px] leading-relaxed text-muted">
              This removes the member’s profile and their Supabase authentication account. They
              will no longer be able to sign in with this Google account until they register again.
            </p>
            {deleteError && (
              <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-[12.5px] text-danger">
                {deleteError}
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}

function IconAction({
  label,
  icon,
  onClick,
  danger = false,
  disabled = false,
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      disabled={disabled}
      title={disabled ? 'You cannot delete your own account' : label}
      aria-label={label}
      className={clsx(
        'grid size-7.5 place-items-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-30',
        danger
          ? 'text-muted hover:bg-danger-soft hover:text-danger'
          : 'text-muted hover:bg-ink/[0.06] hover:text-ink',
      )}
    >
      {icon}
    </button>
  )
}
