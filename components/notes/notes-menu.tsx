'use client'

import { useRef } from 'react'
import { Menu } from '@base-ui/react/menu'
import {
  Archive,
  Download,
  FileDown,
  FileUp,
  MoreHorizontal,
  Printer,
} from 'lucide-react'
import {
  BackupParseError,
  downloadAllAsZip,
  downloadBackupJson,
  downloadNoteMarkdown,
  noteFromMarkdown,
  parseBackup,
} from '@/lib/export'
import type { Note } from '@/lib/notes'
import { cn } from '@/lib/utils'

type NotesMenuProps = {
  note: Note | null
  notes: Note[]
  onImport: (notes: Note[]) => void
  onError: (message: string) => void
}

const ITEM = cn(
  'flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-xs outline-none select-none',
  'data-highlighted:bg-muted data-highlighted:text-foreground',
  'data-disabled:pointer-events-none data-disabled:opacity-50',
)

export function NotesMenu({ note, notes, onImport, onError }: NotesMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList)
    const imported: Note[] = []

    for (const file of files) {
      const text = await file.text()
      if (/\.json$/i.test(file.name)) {
        try {
          imported.push(...parseBackup(text))
        } catch (error) {
          onError(
            error instanceof BackupParseError ? error.message : `Could not read ${file.name}.`,
          )
        }
      } else {
        imported.push(noteFromMarkdown(file.name, text))
      }
    }

    if (imported.length > 0) onImport(imported)
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".md,.markdown,.txt,.json"
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files)
          // Reset so re-picking the same file fires change again.
          event.target.value = ''
        }}
      />

      <Menu.Root>
        <Menu.Trigger
          aria-label="Notes menu"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-popup-open:bg-muted"
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="end" sideOffset={6} className="z-50">
            <Menu.Popup className="min-w-52 rounded-lg bg-popover p-1 text-popover-foreground ring-1 ring-foreground/10 shadow-lg outline-none">
              <Menu.Item
                className={ITEM}
                disabled={note === null}
                onClick={() => note && downloadNoteMarkdown(note)}
              >
                <FileDown className="size-3.5" aria-hidden />
                Export this note (.md)
              </Menu.Item>
              <Menu.Item
                className={ITEM}
                disabled={notes.length === 0}
                onClick={() => downloadAllAsZip(notes)}
              >
                <Archive className="size-3.5" aria-hidden />
                Export all notes (.zip)
              </Menu.Item>
              <Menu.Item
                className={ITEM}
                disabled={notes.length === 0}
                onClick={() => downloadBackupJson(notes)}
              >
                <Download className="size-3.5" aria-hidden />
                Download backup (.json)
              </Menu.Item>

              <div role="separator" className="my-1 h-px bg-border" />

              <Menu.Item className={ITEM} onClick={() => fileInputRef.current?.click()}>
                <FileUp className="size-3.5" aria-hidden />
                Import .md or backup…
              </Menu.Item>
              <Menu.Item className={ITEM} disabled={note === null} onClick={() => window.print()}>
                <Printer className="size-3.5" aria-hidden />
                Print / Save as PDF
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </>
  )
}
