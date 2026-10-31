import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'

interface FieldProps {
  label: string
  hint?: string
  error?: string
  htmlFor?: string
  children: ReactNode
  optional?: boolean
}

export function Field({ label, hint, error, htmlFor, children, optional }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
          {label}
          {optional && <span className="ml-1.5 font-normal text-muted">optional</span>}
        </label>
        {hint && !error && <span className="text-[11.5px] text-muted">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  )
}

const baseInput =
  'w-full rounded-[10px] border bg-white/70 px-3.5 text-[14px] text-ink placeholder:text-muted/60 transition-colors hover:border-ink/25 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/15'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={clsx(baseInput, 'h-11', invalid && 'border-danger/60', className)}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={invalid || undefined}
    className={clsx(baseInput, 'min-h-28 resize-y py-2.5 leading-relaxed', invalid && 'border-danger/60', className)}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export function TagInput({
  id,
  value,
  onChange,
  placeholder,
  max = 12,
}: {
  id?: string
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  max?: number
}) {
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-[10px] border border-line bg-white/70 p-2 transition-colors focus-within:border-accent focus-within:bg-white focus-within:ring-2 focus-within:ring-accent/15">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-ink/[0.06] py-1 pl-2 pr-1 text-[12.5px] font-medium text-ink"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((item) => item !== tag))}
            className="grid size-4 place-items-center rounded text-muted transition-colors hover:bg-ink/10 hover:text-ink"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        className="min-w-28 flex-1 bg-transparent px-1 text-[14px] placeholder:text-muted/60 focus:outline-none"
        placeholder={value.length === 0 ? placeholder : value.length >= max ? 'Limit reached' : 'Add another…'}
        disabled={value.length >= max}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ',') return
          event.preventDefault()
          const raw = event.currentTarget.value.trim().replace(/,$/, '')
          if (!raw) return
          if (!value.includes(raw)) onChange([...value, raw].slice(0, max))
          event.currentTarget.value = ''
        }}
        onBlur={(event) => {
          const raw = event.currentTarget.value.trim()
          if (!raw) return
          if (!value.includes(raw)) onChange([...value, raw].slice(0, max))
          event.currentTarget.value = ''
        }}
      />
    </div>
  )
}
