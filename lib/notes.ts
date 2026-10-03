export type Note = {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

export const STORAGE_KEY = 'markdown-notes:v1'

const WELCOME_CONTENT = `# Welcome to Margin

A quiet place for your **markdown** notes. Everything you type is saved to your browser automatically — no account, no server, no sync.

## Try these

- [ ] Tick this box — the checkbox writes straight back to the markdown
- [x] Toggle dark mode from the sidebar footer
- [ ] Press \`Ctrl\` + \`/\` for the cheatsheet
- [ ] Share this note with the button in the header

Code is highlighted with real editor grammars:

\`\`\`ts
type Note = { id: string; title: string; content: string }

const titleOf = (note: Note) => note.title.trim() || 'Untitled note'
\`\`\`

Math renders with KaTeX — inline like $e^{i\\pi} + 1 = 0$, or as a block:

$$
\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}
$$

And diagrams come from fenced \`mermaid\` blocks:

\`\`\`mermaid
flowchart LR
  A[Type markdown] --> B[Preview]
  B --> C{Happy?}
  C -->|yes| D[Share link]
  C -->|no| A
\`\`\`

## Sharing without a server

The share button packs this note into the part of the URL *after* the \`#\`.
Browsers never send that to the server, so a shared note stays between you and
whoever you hand the link to.

| Syntax | Result |
| --- | --- |
| \`**bold**\` | **bold** |
| \`*italic*\` | *italic* |
| \`[link](https://example.com)\` | [link](https://example.com) |

> Tip: select several lines and press **Tab** to indent them all. **Shift + Tab** outdents.
`

/**
 * `crypto.randomUUID` only exists in secure contexts, so it is undefined when the
 * app is served over plain HTTP — a LAN IP during development, for instance.
 */
function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function createNote(partial: Partial<Note> = {}): Note {
  const now = Date.now()
  return {
    title: '',
    content: '',
    createdAt: now,
    updatedAt: now,
    ...partial,
    // Last so a caller-supplied `id` can never collide with an existing note.
    id: newId(),
  }
}

export function isNote(value: unknown): value is Note {
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

export function welcomeNote() {
  return createNote({ title: 'Welcome to Margin', content: WELCOME_CONTENT })
}

export function loadNotes(): Note[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return [welcomeNote()]
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isNote) : []
  } catch {
    return []
  }
}

/** Returns false when the write failed, so the UI can show a real error. */
export function saveNotes(notes: Note[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
    return true
  } catch (error) {
    console.error('Failed to save notes', error)
    return false
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
