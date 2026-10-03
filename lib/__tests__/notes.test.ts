import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  STORAGE_KEY,
  createNote,
  getNoteExcerpt,
  getNoteTitle,
  isNote,
  loadNotes,
  saveNotes,
  welcomeNote,
} from '../notes'

/** Minimal localStorage stand-in; `failOnWrite` simulates a quota error. */
function stubStorage({ failOnWrite = false } = {}) {
  const map = new Map<string, string>()
  const storage = {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (failOnWrite) {
        const error = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        throw error
      }
      map.set(key, value)
    },
    removeItem: (key: string) => void map.delete(key),
  }
  vi.stubGlobal('window', { localStorage: storage })
  return map
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('createNote', () => {
  it('fills in defaults', () => {
    const note = createNote()
    expect(note).toMatchObject({ title: '', content: '' })
    expect(note.createdAt).toBe(note.updatedAt)
    expect(note.id).toBeTruthy()
  })

  it('accepts a title and content', () => {
    expect(createNote({ title: 'T', content: 'C' })).toMatchObject({ title: 'T', content: 'C' })
  })

  // `...partial` used to spread over `id`, letting a caller inject a duplicate.
  it('ignores a caller-supplied id so ids cannot collide', () => {
    expect(createNote({ id: 'forced' }).id).not.toBe('forced')
  })

  it('generates distinct ids', () => {
    const ids = new Set(Array.from({ length: 200 }, () => createNote().id))
    expect(ids.size).toBe(200)
  })

  // `crypto.randomUUID` only exists in secure contexts, so it is undefined when
  // the app is served over plain HTTP — a LAN IP during development, for instance.
  it('still generates an id when crypto.randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', {})
    const ids = new Set(Array.from({ length: 50 }, () => createNote().id))
    expect(ids.size).toBe(50)
    for (const id of ids) expect(id).toMatch(/^n-/)
  })

  it('still generates an id when crypto itself is missing', () => {
    vi.stubGlobal('crypto', undefined)
    expect(createNote().id).toMatch(/^n-/)
  })
})

describe('isNote', () => {
  const valid = createNote({ title: 'T', content: 'C' })

  it('accepts a well-formed note', () => {
    expect(isNote(valid)).toBe(true)
  })

  it.each([
    ['null', null],
    ['a string', 'note'],
    ['an array', []],
    ['a missing id', { ...valid, id: undefined }],
    ['a numeric title', { ...valid, title: 1 }],
    ['a string createdAt', { ...valid, createdAt: '2024' }],
    ['a missing updatedAt', { ...valid, updatedAt: undefined }],
  ])('rejects %s', (_label, value) => {
    expect(isNote(value)).toBe(false)
  })
})

describe('loadNotes', () => {
  it('seeds the welcome note on a first visit', () => {
    stubStorage()
    const notes = loadNotes()
    expect(notes).toHaveLength(1)
    expect(notes[0].title).toBe('Welcome to Margin')
  })

  it('reads notes back', () => {
    const map = stubStorage()
    const saved = [createNote({ title: 'Saved' })]
    map.set(STORAGE_KEY, JSON.stringify(saved))
    expect(loadNotes()).toEqual(saved)
  })

  it('drops malformed entries rather than failing', () => {
    const map = stubStorage()
    const good = createNote({ title: 'Good' })
    map.set(STORAGE_KEY, JSON.stringify([good, { id: 'bad' }, null]))
    expect(loadNotes()).toEqual([good])
  })

  it('returns an empty list for unparseable storage', () => {
    const map = stubStorage()
    map.set(STORAGE_KEY, '{not json')
    expect(loadNotes()).toEqual([])
  })

  it('returns an empty list when storage holds a non-array', () => {
    const map = stubStorage()
    map.set(STORAGE_KEY, '{"notes":[]}')
    expect(loadNotes()).toEqual([])
  })

  it('does not re-seed once the key exists but is empty', () => {
    const map = stubStorage()
    map.set(STORAGE_KEY, '[]')
    expect(loadNotes()).toEqual([])
  })
})

describe('saveNotes', () => {
  it('reports success and writes the notes', () => {
    const map = stubStorage()
    const notes = [createNote({ title: 'A' })]
    expect(saveNotes(notes)).toBe(true)
    expect(JSON.parse(map.get(STORAGE_KEY) as string)).toEqual(notes)
  })

  // The old version swallowed this and the UI still showed "Saved".
  it('reports failure when the write throws', () => {
    stubStorage({ failOnWrite: true })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(saveNotes([createNote({})])).toBe(false)
  })
})

describe('getNoteTitle', () => {
  it('falls back for blank titles', () => {
    expect(getNoteTitle(createNote({ title: '   ' }))).toBe('Untitled note')
  })

  it('trims a real title', () => {
    expect(getNoteTitle(createNote({ title: '  Real  ' }))).toBe('Real')
  })
})

describe('getNoteExcerpt', () => {
  it('strips fenced code blocks', () => {
    expect(getNoteExcerpt('before\n```js\nconst x = 1\n```\nafter')).toBe('before after')
  })

  it('strips markdown punctuation', () => {
    expect(getNoteExcerpt('# Heading **bold**')).toBe('Heading bold')
  })

  it('truncates with an ellipsis', () => {
    expect(getNoteExcerpt('a'.repeat(200))).toHaveLength(81)
  })

  it('honours a custom length', () => {
    expect(getNoteExcerpt('a'.repeat(50), 10)).toBe('a'.repeat(10) + '…')
  })
})

describe('welcomeNote', () => {
  it('showcases the features the preview supports', () => {
    const { content } = welcomeNote()
    expect(content).toContain('```mermaid')
    expect(content).toContain('```ts')
    expect(content).toContain('- [ ]')
    expect(content).toMatch(/\$\$/)
  })

  // Written inside a template literal, so a single backslash would be eaten as an
  // escape: `\sum` silently becomes `sum`, and `\frac` becomes a form feed.
  it('keeps LaTeX backslashes intact', () => {
    const { content } = welcomeNote()
    expect(content).toContain(String.raw`\sum`)
    expect(content).toContain(String.raw`\frac`)
    expect(content).toContain(String.raw`\pi`)
    expect(content).not.toContain('\f')
  })
})
