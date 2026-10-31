import clsx from 'clsx'

export function Logo({
  className,
  markOnly = false,
  inverse = false,
}: {
  className?: string
  markOnly?: boolean
  inverse?: boolean
}) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <span
        className={clsx(
          'grid size-8 place-items-center rounded-[9px]',
          inverse ? 'bg-paper text-ink' : 'bg-ink text-paper',
        )}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="7.2" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="2.1" fill="currentColor" />
        </svg>
      </span>
      {!markOnly && (
        <span
          className={clsx(
            'text-[17px] font-semibold tracking-[-0.02em]',
            inverse ? 'text-paper' : 'text-ink',
          )}
        >
          Campus<span className={inverse ? 'text-paper/55' : 'text-muted'}>Circle</span>
        </span>
      )}
    </span>
  )
}
