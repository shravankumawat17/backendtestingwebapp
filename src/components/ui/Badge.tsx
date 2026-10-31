import type { ReactNode } from 'react'
import clsx from 'clsx'

type Tone = 'neutral' | 'accent' | 'success' | 'amber' | 'danger'

const tones: Record<Tone, string> = {
  neutral: 'bg-ink/[0.055] text-muted',
  accent: 'bg-accent-soft text-accent-deep',
  success: 'bg-success-soft text-success',
  amber: 'bg-amber-soft text-[#8a5a12]',
  danger: 'bg-danger-soft text-danger',
}

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
