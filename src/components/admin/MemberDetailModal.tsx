import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Avatar } from '../ui/Avatar'
import { CalendarDays, GraduationCap, Mail, Pencil, Trash2 } from 'lucide-react'
import type { AdminProfile } from '../../lib/types'
import { completion, displayValue, formatDate, memberSince } from '../../lib/format'

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-cream/50 px-3 py-2.5">
      <p className="text-[10px] font-semibold tracking-[0.1em] text-muted uppercase">{label}</p>
      <p className="mt-0.5 break-words text-[13px] font-medium text-ink">{value}</p>
    </div>
  )
}

function Chips({ values, empty }: { values: string[]; empty: string }) {
  if (values.length === 0) return <p className="text-[12.5px] text-muted">{empty}</p>
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span
          key={value}
          className="rounded-md border border-line bg-white/60 px-2 py-1 text-[11.5px] font-medium text-ink/75"
        >
          {value}
        </span>
      ))}
    </div>
  )
}

export function MemberDetailModal({
  member,
  onClose,
  onEdit,
  onDelete,
  isSelf,
}: {
  member: AdminProfile | null
  onClose: () => void
  onEdit: (member: AdminProfile) => void
  onDelete: (member: AdminProfile) => void
  isSelf: boolean
}) {
  if (!member) return null
  const percent = completion(member)

  return (
    <Modal
      open={Boolean(member)}
      onClose={onClose}
      title="Member profile"
      description="Full profile data as stored in Supabase."
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => onDelete(member)}
            disabled={isSelf}
            title={isSelf ? 'You cannot delete your own account' : undefined}
            icon={<Trash2 size={14} />}
            className="text-danger hover:border-danger/30 hover:bg-danger-soft sm:mr-auto"
          >
            Delete user
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => onEdit(member)} icon={<Pencil size={14} />}>
            Edit profile
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={member.avatar_url} name={member.full_name} size="xl" />
          <div className="min-w-0">
            <h3 className="truncate font-display text-[28px] leading-tight">
              {member.full_name || 'Unnamed member'}
            </h3>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px] text-muted">
              <Mail size={12} /> {member.email}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone={member.role === 'admin' ? 'accent' : 'neutral'}>
                {member.role === 'admin' ? 'Admin' : 'Member'}
              </Badge>
              <Badge tone={percent === 100 ? 'success' : 'amber'}>{percent}% complete</Badge>
              {isSelf && <Badge tone="success">You</Badge>}
            </div>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[10px] font-semibold tracking-[0.1em] text-muted uppercase">Member since</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] font-medium text-ink sm:justify-end">
            <CalendarDays size={12} className="text-muted" /> {memberSince(member.created_at)}
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <p className="text-[10px] font-semibold tracking-[0.1em] text-muted uppercase">Bio</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink/85">
          {member.bio?.trim() || <span className="text-muted">No bio provided.</span>}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Detail label="Age" value={member.age ? `${member.age}` : '—'} />
        <Detail label="College" value={displayValue(member.college)} />
        <Detail label="Course" value={displayValue(member.course)} />
        <Detail label="Signed up" value={formatDate(member.created_at)} />
      </div>

      <div className="mt-5 grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.1em] text-muted uppercase">
            <GraduationCap size={11} /> Skills
          </p>
          <Chips values={member.skills} empty="No skills added." />
        </div>
        <div>
          <p className="mb-2 text-[10px] font-semibold tracking-[0.1em] text-muted uppercase">
            Music interests
          </p>
          <Chips values={member.music_interests} empty="No music interests added." />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-[10.5px] text-muted">
        <span className="font-mono">ID {member.id}</span>
        <span>Updated {formatDate(member.updated_at)}</span>
      </div>
    </Modal>
  )
}
