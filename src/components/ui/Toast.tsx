import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import clsx from 'clsx'

type ToastTone = 'success' | 'error' | 'info'

interface Toast {
  id: number
  tone: ToastTone
  title: string
  detail?: string
}

interface ToastContextValue {
  toast: (tone: ToastTone, title: string, detail?: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const tones: Record<ToastTone, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-accent',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    (tone: ToastTone, title: string, detail?: string) => {
      const id = nextId.current++
      setToasts((prev) => [...prev.slice(-3), { id, tone, title, detail }])
      window.setTimeout(() => dismiss(id), 4200)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
        {toasts.map((item) => {
          const Icon = icons[item.tone]
          return (
            <div
              key={item.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm animate-pop items-start gap-3 rounded-xl border border-line bg-paper p-3.5 shadow-card"
            >
              <Icon size={18} className={clsx('mt-0.5 shrink-0', tones[item.tone])} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-ink">{item.title}</p>
                {item.detail && <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{item.detail}</p>}
              </div>
              <button
                onClick={() => dismiss(item.id)}
                className="grid size-6 shrink-0 place-items-center rounded-md text-muted hover:bg-ink/5 hover:text-ink"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')
  return context
}
