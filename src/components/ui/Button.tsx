import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-ink text-paper hover:bg-black active:scale-[0.985] shadow-[0_1px_0_rgba(255,255,255,0.12)_inset]',
  secondary:
    'bg-paper text-ink border border-line hover:border-ink/30 hover:bg-white active:scale-[0.985]',
  ghost: 'text-muted hover:text-ink hover:bg-ink/[0.05]',
  danger: 'bg-danger text-white hover:bg-[#9b2c23] active:scale-[0.985]',
}

const sizes: Record<Size, string> = {
  sm: 'h-8.5 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10.5 px-4 text-sm gap-2 rounded-[10px]',
  lg: 'h-12 px-5 text-[15px] gap-2.5 rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex select-none items-center justify-center font-medium transition-all duration-150',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}
