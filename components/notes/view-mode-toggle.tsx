'use client'

import { Columns2, Eye, PencilLine } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ViewMode = 'edit' | 'split' | 'preview'

const OPTIONS = [
  { value: 'edit', label: 'Edit', icon: PencilLine },
  { value: 'split', label: 'Split', icon: Columns2 },
  { value: 'preview', label: 'Preview', icon: Eye },
] as const

type ViewModeToggleProps = {
  value: ViewMode
  onChange: (value: ViewMode) => void
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div role="group" aria-label="View mode" className="flex items-center rounded-lg bg-muted p-0.5">
      {OPTIONS.map(({ value: option, label, icon: Icon }) => {
        const isActive = value === option
        // Split view is desktop-only; on mobile it falls back to the editor.
        const isMobileFallback = option === 'edit' && value === 'split'
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={isActive}
            title={label}
            className={cn(
              'flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none',
              isActive && 'bg-background text-foreground shadow-sm',
              isMobileFallback && 'max-md:bg-background max-md:text-foreground max-md:shadow-sm',
              option === 'split' && 'hidden md:flex',
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            <span className="hidden lg:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
