'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

type ToastProps = {
  message: string | null
  onDismiss: () => void
  durationMs?: number
}

export function Toast({ message, onDismiss, durationMs = 5000 }: ToastProps) {
  useEffect(() => {
    if (message === null) return
    const timeout = window.setTimeout(onDismiss, durationMs)
    return () => window.clearTimeout(timeout)
  }, [message, durationMs, onDismiss])

  return (
    // Rendered unconditionally so the live region exists before it has content —
    // a region added at the same moment as its text is often not announced.
    <div
      role="status"
      aria-live="polite"
      data-print="hide"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
    >
      {message !== null && (
        <div className="pointer-events-auto flex max-w-sm items-start gap-2 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
          <span className="flex-1">{message}</span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="-mr-0.5 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      )}
    </div>
  )
}
