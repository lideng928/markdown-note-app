'use client'

import { Check, Loader2, Menu, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SaveStatus } from '@/hooks/use-notes'
import { ViewModeToggle, type ViewMode } from './view-mode-toggle'

type NoteHeaderProps = {
  title: string
  onTitleChange: (title: string) => void
  saveStatus: SaveStatus
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onDelete: () => void
  onOpenSidebar: () => void
  isSidebarOpen: boolean
}

export function NoteHeader({
  title,
  onTitleChange,
  saveStatus,
  viewMode,
  onViewModeChange,
  onDelete,
  onOpenSidebar,
  isSidebarOpen,
}: NoteHeaderProps) {
  return (
    <header className="flex items-center gap-2 border-b px-3 py-2 md:px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenSidebar}
        className="md:hidden"
        aria-label="Open notes list"
        aria-controls="notes-sidebar"
        aria-expanded={isSidebarOpen}
      >
        <Menu aria-hidden />
      </Button>

      <label htmlFor="note-title" className="sr-only">
        Note title
      </label>
      <input
        id="note-title"
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Untitled note"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent text-base font-semibold tracking-tight outline-none placeholder:text-muted-foreground/70 md:text-lg"
      />

      <p
        className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex"
        role="status"
        aria-live="polite"
      >
        {saveStatus === 'saving' ? (
          <>
            <Loader2 className="size-3 animate-spin" aria-hidden />
            Saving
          </>
        ) : (
          <>
            <Check className="size-3" aria-hidden />
            Saved
          </>
        )}
      </p>

      <ViewModeToggle value={viewMode} onChange={onViewModeChange} />

      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label="Delete note"
        title="Delete note"
      >
        <Trash2 aria-hidden />
      </Button>
    </header>
  )
}
