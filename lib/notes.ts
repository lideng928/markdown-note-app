export type Note = {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

export const STORAGE_KEY = 'markdown-notes:v1'

const WELCOME_CONTENT = `# Welcome to Margin

A quiet place for your **markdown** notes. Everything you type is saved to your browser automatically.

## What you can do

- Write on the left, see it rendered on the right
- Search across titles and content from the sidebar
- Switch between light and dark mode

## Markdown cheatsheet

| Syntax | Result |
| --- | --- |
| \`**bold**\` | **bold** |
| \`*italic*\` | *italic* |
| \`[link](https://example.com)\` | [link](https://example.com) |

- [x] Create a note
- [ ] Write something great

> Tip: press **Tab** in the editor to indent.

\`\`\`js
const greet = (name) => \`Hello, \${name}!\`
\`\`\`
`

export function createNote(partial: Partial<Note> = {}): Note {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: '',
    content: '',
    createdAt: now,
    updatedAt: now,
    ...partial,
  }
}

function isNote(value: unknown): value is Note {
  if (typeof value !== 'object' || value === null) return false
  const note = value as Record<string, unknown>
  return (
    typeof note.id === 'string' &&
    typeof note.title === 'string' &&
    typeof note.content === 'string' &&
    typeof note.createdAt === 'number' &&
    typeof note.updatedAt === 'number'
  )
}

export function loadNotes(): Note[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      return [createNote({ title: 'Welcome to Margin', content: WELCOME_CONTENT })]
    }
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isNote) : []
  } catch {
    return []
  }
}

export function saveNotes(notes: Note[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch (error) {
    console.error('Failed to save notes', error)
  }
}

export function getNoteTitle(note: Note) {
  return note.title.trim() || 'Untitled note'
}

export function getNoteExcerpt(content: string, length = 80) {
  const plain = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~\-|[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > length ? `${plain.slice(0, length)}…` : plain
}

export function formatNoteDate(timestamp: number) {
  const date = new Date(timestamp)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
  })
}
