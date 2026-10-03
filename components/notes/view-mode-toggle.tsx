'use client'

import { Columns2, Eye, PencilLine } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ViewMode } from '@/lib/prefs'
import { cn } from '@/lib/utils'

// Re-exported so existing imports from this module keep working; the type lives
// in lib/prefs because it is persisted.
export type { ViewMode }

const OPTIONS = [
  { value: 'edit', label: 'Edit', icon: PencilLine },
  { value: 'split', label: 'Split', icon: Columns2 },
  { value: 'preview', label: 'Preview', icon: Eye },
] as const

type ViewModeToggleProps = {
  /**
   * The mode actually in effect. Callers below the `md` breakpoint pass `edit`
   * rather than `split`, so the pressed state and the styling cannot disagree —
   * the previous version faked the active style in CSS and left `aria-pressed`
   * reporting false.
   */
  value: ViewMode
  onChange: (value: ViewMode) => void
  /** Hides the split option where there is no room for two panes. */
  canSplit: boolean
}

export function ViewModeToggle({ value, onChange, canSplit }: ViewModeToggleProps) {
  return (
    <div
      role="group"
      aria-label="View mode"
      className="flex shrink-0 items-center rounded-lg bg-muted p-0.5"
    >
      {OPTIONS.map(({ value: option, label, icon: Icon }) => {
        if (option === 'split' && !canSplit) return null
        const isActive = value === option
        return (
          <Tooltip key={option}>
            <TooltipTrigger
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={isActive}
              className={cn(
                'flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none',
                isActive && 'bg-background text-foreground shadow-sm',
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              <span className="hidden lg:inline">{label}</span>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
