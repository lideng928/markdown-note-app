import { strToU8, zipSync } from 'fflate'
import { createNote, isNote, type Note } from './notes'

export const BACKUP_VERSION = 1

export type Backup = {
  app: 'margin'
  v: number
  exportedAt: number
  notes: Note[]
}

/** Filename-safe slug for a note title, with a fallback for untitled notes. */
export function slugifyTitle(title: string, fallback = 'untitled') {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return slug || fallback
}

/**
 * One `.md` filename per note, de-duplicated.
 *
 * Titles are free-form, so two notes can easily slugify to the same name — a zip
 * with duplicate entries would silently drop notes.
 */
export function noteFilenames(notes: Note[]): string[] {
  const used = new Map<string, number>()
  return notes.map((note) => {
    const base = slugifyTitle(note.title)
    const seen = used.get(base) ?? 0
    used.set(base, seen + 1)
    return seen === 0 ? `${base}.md` : `${base}-${seen + 1}.md`
  })
}

/** A note as a standalone markdown file, with the title as an H1 if absent. */
export function noteToMarkdown(note: Note) {
  const hasHeading = /^\s*#\s/.test(note.content)
  const title = note.title.trim()
  if (hasHeading || !title) return note.content
  return `# ${title}\n\n${note.content}`
}

export function buildBackup(notes: Note[], exportedAt: number): string {
  const backup: Backup = { app: 'margin', v: BACKUP_VERSION, exportedAt, notes }
  return JSON.stringify(backup, null, 2)
}

export class BackupParseError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'BackupParseError'
  }
}

/**
 * Read a backup file back into notes.
 *
 * Accepts either a wrapped backup or a bare array, and drops entries that fail
 * the same `isNote` guard the storage layer uses rather than trusting the file.
 */
export function parseBackup(json: string): Note[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch (error) {
    throw new BackupParseError('That file is not valid JSON.', { cause: error })
  }

  const candidates = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as Backup).notes)
      ? (parsed as Backup).notes
      : null

  if (!candidates) throw new BackupParseError('That file is not a Margin backup.')

  const notes = candidates.filter(isNote)
  if (notes.length === 0) throw new BackupParseError('That backup contains no readable notes.')
  return notes
}

/** Zip archive bytes holding one markdown file per note. */
export function buildZip(notes: Note[]): Uint8Array {
  const names = noteFilenames(notes)
  const files: Record<string, Uint8Array> = {}
  notes.forEach((note, index) => {
    files[names[index]] = strToU8(noteToMarkdown(note))
  })
  return zipSync(files, { level: 6 })
}

/** Turn an imported markdown file into a note, preferring a leading H1 as title. */
export function noteFromMarkdown(filename: string, text: string): Note {
  const heading = /^\s*#\s+(.+)$/m.exec(text.split('\n').slice(0, 3).join('\n'))
  const fromName = filename.replace(/\.(md|markdown|txt)$/i, '').trim()
  return createNote({ title: (heading?.[1] ?? fromName).trim(), content: text })
}

// --- Browser-only helpers ------------------------------------------------------

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  // Revoked on the next tick so the navigation has started.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function downloadNoteMarkdown(note: Note) {
  download(`${slugifyTitle(note.title)}.md`, new Blob([noteToMarkdown(note)], { type: 'text/markdown;charset=utf-8' }))
}

export function downloadAllAsZip(notes: Note[]) {
  const bytes = buildZip(notes)
  download('margin-notes.zip', new Blob([bytes as BlobPart], { type: 'application/zip' }))
}

export function downloadBackupJson(notes: Note[]) {
  const json = buildBackup(notes, Date.now())
  download('margin-backup.json', new Blob([json], { type: 'application/json;charset=utf-8' }))
}

/** Accepted extensions for drag-and-drop / file-picker import. */
export const MARKDOWN_EXTENSIONS = /\.(md|markdown|txt)$/i

export async function readMarkdownFiles(files: File[]): Promise<Note[]> {
  const markdown = files.filter((file) => MARKDOWN_EXTENSIONS.test(file.name))
  return Promise.all(
    markdown.map(async (file) => noteFromMarkdown(file.name, await file.text())),
  )
}
