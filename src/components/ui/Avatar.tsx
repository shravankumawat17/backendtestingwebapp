import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { initials } from '../../lib/format'

const sizes = {
  sm: 'size-8 text-[11px]',
  md: 'size-10 text-[13px]',
  lg: 'size-14 text-lg',
  xl: 'size-20 text-2xl',
} as const

export function Avatar({
  src,
  name,
  size = 'md',
  className,
}: {
  src?: string | null
  name?: string | null
  size?: keyof typeof sizes
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  return (
    <span
      className={clsx(
        'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full border border-ink/10 bg-accent-soft font-semibold tracking-wide text-accent-deep',
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          className="size-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{initials(name)}</span>
      )}
    </span>
  )
}
