import { strFromU8, unzipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import {
  BackupParseError,
  buildBackup,
  buildZip,
  noteFilenames,
  noteFromMarkdown,
  noteToMarkdown,
  parseBackup,
  slugifyTitle,
} from '../export'
import { createNote, type Note } from '../notes'

const note = (partial: Partial<Note>) => createNote(partial)

describe('slugifyTitle', () => {
  it.each([
    ['My Great Note', 'my-great-note'],
    ['  spaces  everywhere  ', 'spaces-everywhere'],
    ['Punctuation!?*', 'punctuation'],
    ['Café näive', 'cafe-naive'],
    ['多言語', 'untitled'],
    ['', 'untitled'],
  ])('slugifies %j to %j', (input, expected) => {
    expect(slugifyTitle(input)).toBe(expected)
  })

  it('caps length so filenames stay sane', () => {
    expect(slugifyTitle('a'.repeat(200)).length).toBeLessThanOrEqual(60)
  })
})

describe('noteFilenames', () => {
  it('de-duplicates notes that slugify to the same name', () => {
    const notes = [note({ title: 'Plan' }), note({ title: 'plan' }), note({ title: 'PLAN!' })]
    expect(noteFilenames(notes)).toEqual(['plan.md', 'plan-2.md', 'plan-3.md'])
  })

  it('gives every untitled note a distinct name', () => {
    expect(new Set(noteFilenames([note({}), note({})])).size).toBe(2)
  })
})

describe('noteToMarkdown', () => {
  it('prepends the title as an H1 when the body has none', () => {
    expect(noteToMarkdown(note({ title: 'Title', content: 'body' }))).toBe('# Title\n\nbody')
  })

  it('leaves content alone when it already starts with a heading', () => {
    const content = '# Own heading\n\nbody'
    expect(noteToMarkdown(note({ title: 'Title', content }))).toBe(content)
  })

  it('leaves content alone when there is no title', () => {
    expect(noteToMarkdown(note({ title: '', content: 'body' }))).toBe('body')
  })
})

describe('buildBackup / parseBackup', () => {
  it('round-trips notes', () => {
    const notes = [note({ title: 'A', content: 'a' }), note({ title: 'B', content: 'b' })]
    expect(parseBackup(buildBackup(notes, 1700000000000))).toEqual(notes)
  })

  it('records the app, version and timestamp', () => {
    const parsed = JSON.parse(buildBackup([note({ title: 'A' })], 42))
    expect(parsed).toMatchObject({ app: 'margin', v: 1, exportedAt: 42 })
  })

  it('accepts a bare array of notes', () => {
    const notes = [note({ title: 'A' })]
    expect(parseBackup(JSON.stringify(notes))).toEqual(notes)
  })

  it('drops malformed entries but keeps the good ones', () => {
    const good = note({ title: 'Good' })
    const json = JSON.stringify([good, { id: 'x' }, null, 'nope', { ...good, createdAt: 'soon' }])
    expect(parseBackup(json)).toEqual([good])
  })

  it.each([
    ['invalid JSON', '{not json'],
    ['an unrelated object', '{"hello":"world"}'],
    ['an empty array', '[]'],
    ['an array with nothing valid', '[{"id":1}]'],
  ])('throws on %s', (_label, json) => {
    expect(() => parseBackup(json)).toThrow(BackupParseError)
  })
})

describe('buildZip', () => {
  it('writes one markdown file per note', () => {
    const notes = [
      note({ title: 'First', content: 'one' }),
      note({ title: 'Second', content: 'two' }),
    ]
    const entries = unzipSync(buildZip(notes))
    expect(Object.keys(entries).sort()).toEqual(['first.md', 'second.md'])
    expect(strFromU8(entries['first.md'])).toBe('# First\n\none')
  })

  it('keeps unicode content intact through the archive', () => {
    const content = '日本語 café 🎉'
    const entries = unzipSync(buildZip([note({ title: 'Uni', content })]))
    expect(strFromU8(entries['uni.md'])).toContain(content)
  })

  it('does not lose notes with colliding titles', () => {
    const notes = [note({ title: 'Same' }), note({ title: 'same' })]
    expect(Object.keys(unzipSync(buildZip(notes)))).toHaveLength(2)
  })
})

describe('noteFromMarkdown', () => {
  it('prefers a leading H1 as the title', () => {
    expect(noteFromMarkdown('ignored.md', '# Real Title\n\nbody').title).toBe('Real Title')
  })

  it('falls back to the filename without its extension', () => {
    expect(noteFromMarkdown('my-notes.md', 'no heading').title).toBe('my-notes')
  })

  it('ignores a heading that appears far down the file', () => {
    const text = 'line\nline\nline\nline\n# Late Heading'
    expect(noteFromMarkdown('from-name.markdown', text).title).toBe('from-name')
  })

  it('keeps the full original text as content', () => {
    const text = '# Title\n\nbody'
    expect(noteFromMarkdown('f.md', text).content).toBe(text)
  })
})
