'use client'

import { AlertTriangle, Check, Loader2, Menu, Share2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SaveStatus } from '@/hooks/use-notes'
import type { Note } from '@/lib/notes'
import type { ViewMode } from '@/lib/prefs'
import { NotesMenu } from './notes-menu'
import { ViewModeToggle } from './view-mode-toggle'

type NoteHeaderProps = {
  title: string
  onTitleChange: (title: string) => void
  saveStatus: SaveStatus
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  /** False below the `md` breakpoint, where there is no room for two panes. */
  canSplit: boolean
  onDelete: () => void
  onShare: () => void
  onOpenSidebar: () => void
  isSidebarOpen: boolean
  menuButtonRef?: React.Ref<HTMLButtonElement>
  note: Note
  notes: Note[]
  onImport: (notes: Note[]) => void
  onError: (message: string) => void
}

export function NoteHeader({
  title,
  onTitleChange,
  saveStatus,
  viewMode,
  onViewModeChange,
  canSplit,
  onDelete,
  onShare,
  onOpenSidebar,
  isSidebarOpen,
  menuButtonRef,
  note,
  notes,
  onImport,
  onError,
}: NoteHeaderProps) {
  return (
    <header
      data-print="hide"
      className="flex items-center gap-1 border-b px-2 py-2 md:gap-2 md:px-4"
    >
      <Button
        ref={menuButtonRef}
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

      <h1 className="sr-only">{title.trim() || 'Untitled note'}</h1>
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

      {/*
        Visual only. A live region here would re-announce on every pause in typing,
        so the polite region below speaks only for the state worth interrupting for.
      */}
      <p
        aria-hidden
        className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
        data-status={saveStatus}
      >
        {saveStatus === 'saving' && <Loader2 className="size-3 animate-spin" />}
        {saveStatus === 'saved' && <Check className="size-3" />}
        {saveStatus === 'error' && <AlertTriangle className="size-3 text-destructive" />}
        <span className="hidden sm:inline">
          {saveStatus === 'saving' ? 'Saving' : saveStatus === 'saved' ? 'Saved' : 'Not saved'}
        </span>
      </p>
      <p role="status" aria-live="polite" className="sr-only">
        {saveStatus === 'error' ? 'Changes could not be saved. Your browser storage may be full.' : ''}
      </p>

      <Button
        variant="ghost"
        size="icon"
        onClick={onShare}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Share note"
      >
        <Share2 aria-hidden />
      </Button>

      <ViewModeToggle value={viewMode} onChange={onViewModeChange} canSplit={canSplit} />

      <NotesMenu note={note} notes={notes} onImport={onImport} onError={onError} />

      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label="Delete note"
      >
        <Trash2 aria-hidden />
      </Button>
    </header>
  )
}
