'use client'

import { NotebookPen, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Note } from '@/lib/notes'
import { NoteListItem } from './note-list-item'
import { SearchInput } from './search-input'
import { ThemeToggle } from './theme-toggle'

type NoteSidebarProps = {
  notes: Note[]
  totalCount: number
  activeId: string | null
  query: string
  onQueryChange: (query: string) => void
  onSelect: (id: string) => void
  onCreate: () => void
  isOpen: boolean
  onClose: () => void
}

export function NoteSidebar({
  notes,
  totalCount,
  activeId,
  query,
  onQueryChange,
  onSelect,
  onCreate,
  isOpen,
  onClose,
}: NoteSidebarProps) {
  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-30 bg-foreground/20 backdrop-blur-[2px] transition-opacity md:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        id="notes-sidebar"
        aria-label="Notes"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-80 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-out md:static md:z-auto md:w-72 md:max-w-none md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <NotebookPen className="size-4" aria-hidden />
            </span>
            <span className="text-sm font-semibold tracking-tight">Margin</span>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" onClick={onCreate}>
              <Plus data-icon="inline-start" aria-hidden />
              New
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="md:hidden"
              aria-label="Close sidebar"
            >
              <X aria-hidden />
            </Button>
          </div>
        </div>

        <div className="px-4 pb-3">
          <SearchInput value={query} onChange={onQueryChange} />
        </div>

        <nav aria-label="All notes" className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {notes.length > 0 ? (
            <ul className="flex flex-col gap-0.5">
              {notes.map((note) => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  isActive={note.id === activeId}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          ) : (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {query ? `No notes match “${query}”` : 'No notes yet'}
            </p>
          )}
        </nav>

        <div className="flex items-center justify-between border-t border-sidebar-border px-4 py-2">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {query ? `${notes.length} of ${totalCount}` : totalCount}{' '}
            {totalCount === 1 ? 'note' : 'notes'}
          </p>
          <ThemeToggle />
        </div>
      </aside>
    </>
  )
}
