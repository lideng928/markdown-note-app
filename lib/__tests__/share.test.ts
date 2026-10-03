import { describe, expect, it } from 'vitest'
import { ShareDecodeError, buildShareUrl, decodeNote, encodeNote } from '../share'

describe('encodeNote / decodeNote', () => {
  it('round-trips a note', async () => {
    const note = { title: 'Hello', content: '# Hi\n\n- [ ] task' }
    const decoded = await decodeNote(await encodeNote(note))
    expect(decoded).toEqual({ v: 1, t: note.title, c: note.content })
  })

  it('round-trips unicode, emoji, and math', async () => {
    const note = { title: '日本語 — café 🎉', content: '$$\sum_{k=1}^{n} k$$\n\nЖдём «ответ»' }
    const decoded = await decodeNote(await encodeNote(note))
    expect(decoded.t).toBe(note.title)
    expect(decoded.c).toBe(note.content)
  })

  it('round-trips an empty note', async () => {
    const decoded = await decodeNote(await encodeNote({ title: '', content: '' }))
    expect(decoded).toEqual({ v: 1, t: '', c: '' })
  })

  it('round-trips content larger than one compression chunk', async () => {
    const content = 'The quick brown fox jumps over the lazy dog.\n'.repeat(3000)
    const decoded = await decodeNote(await encodeNote({ title: 'big', content }))
    expect(decoded.c).toBe(content)
  })

  it('compresses repetitive content well below its raw size', async () => {
    const content = 'a'.repeat(20000)
    const encoded = await encodeNote({ title: 'repeats', content })
    expect(encoded.length).toBeLessThan(content.length / 10)
  })

  it('produces a URL-safe payload', async () => {
    const encoded = await encodeNote({ title: 'x'.repeat(40), content: '\u00ff\u00fe'.repeat(400) })
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('tolerates a leading hash from location.hash', async () => {
    const encoded = await encodeNote({ title: 'T', content: 'C' })
    await expect(decodeNote(`#${encoded}`)).resolves.toMatchObject({ t: 'T' })
  })

  it.each([
    ['empty', ''],
    ['whitespace', '   '],
    ['no marker', 'ZZZnotapayload'],
    ['marker but garbage body', 'C!!!!!!'],
    ['marker but not deflate data', 'Ca2V5'],
  ])('rejects %s', async (_label, input) => {
    await expect(decodeNote(input)).rejects.toBeInstanceOf(ShareDecodeError)
  })

  it('rejects a payload whose schema version is unknown', async () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ v: 99, t: 'a', c: 'b' }))
    const base64 = Buffer.from(bytes).toString('base64url')
    await expect(decodeNote(`U${base64}`)).rejects.toBeInstanceOf(ShareDecodeError)
  })

  it('reads an uncompressed payload for browsers without CompressionStream', async () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ v: 1, t: 'raw', c: 'body' }))
    const base64 = Buffer.from(bytes).toString('base64url')
    await expect(decodeNote(`U${base64}`)).resolves.toEqual({ v: 1, t: 'raw', c: 'body' })
  })
})

describe('buildShareUrl', () => {
  it('puts the payload in the fragment so it never reaches a server', () => {
    expect(buildShareUrl('https://margin.app', 'ABC')).toBe('https://margin.app/read#ABC')
  })

  it('does not double up the slash', () => {
    expect(buildShareUrl('https://margin.app/', 'ABC')).toBe('https://margin.app/read#ABC')
  })
})
