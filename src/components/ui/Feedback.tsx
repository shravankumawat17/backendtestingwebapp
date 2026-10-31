import type { ReactNode } from 'react'
import clsx from 'clsx'

export function Skeleton({ className }: { className?: string }) {
  return <span className={clsx('inline-block animate-pulse rounded-md bg-ink/[0.07]', className)} />
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={clsx('flex flex-col items-center px-6 py-14 text-center', className)}>
      <span className="mb-4 grid size-12 place-items-center rounded-full border border-line bg-cream text-muted">
        {icon}
      </span>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
