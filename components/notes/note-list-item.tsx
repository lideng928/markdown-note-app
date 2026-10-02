'use client'

import { cn } from '@/lib/utils'
import { formatNoteDate, getNoteExcerpt, getNoteTitle, type Note } from '@/lib/notes'

type NoteListItemProps = {
  note: Note
  isActive: boolean
  onSelect: (id: string) => void
}

export function NoteListItem({ note, isActive, onSelect }: NoteListItemProps) {
  const excerpt = getNoteExcerpt(note.content)

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(note.id)}
        aria-current={isActive ? 'true' : undefined}
        className={cn(
          'group relative flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'hover:bg-sidebar-accent/60',
        )}
      >
        {isActive && (
          <span className="absolute inset-y-2.5 left-0 w-0.5 rounded-full bg-primary" aria-hidden />
        )}
        <span className="flex items-baseline justify-between gap-3">
          <span
            className={cn(
              'truncate text-sm font-medium',
              !note.title.trim() && 'text-muted-foreground italic',
            )}
          >
            {getNoteTitle(note)}
          </span>
          <time
            dateTime={new Date(note.updatedAt).toISOString()}
            className="shrink-0 text-xs text-muted-foreground tabular-nums"
          >
            {formatNoteDate(note.updatedAt)}
          </time>
        </span>
        <span className="line-clamp-1 text-xs text-muted-foreground">
          {excerpt || 'No content yet'}
        </span>
      </button>
    </li>
  )
}
