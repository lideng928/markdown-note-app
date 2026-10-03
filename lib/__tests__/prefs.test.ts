import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFS, parsePrefs } from '../prefs'

describe('parsePrefs', () => {
  it('returns defaults when nothing is stored', () => {
    expect(parsePrefs(null)).toEqual(DEFAULT_PREFS)
  })

  it('reads a valid blob', () => {
    expect(parsePrefs('{"viewMode":"preview","activeId":"abc"}')).toEqual({
      viewMode: 'preview',
      activeId: 'abc',
    })
  })

  it.each([
    ['invalid JSON', '{nope'],
    ['a non-object', '"preview"'],
    ['null', 'null'],
  ])('falls back to defaults for %s', (_label, raw) => {
    expect(parsePrefs(raw)).toEqual(DEFAULT_PREFS)
  })

  it('rejects an unknown view mode but keeps the rest', () => {
    expect(parsePrefs('{"viewMode":"zen","activeId":"abc"}')).toEqual({
      viewMode: DEFAULT_PREFS.viewMode,
      activeId: 'abc',
    })
  })

  it('normalises a non-string activeId to null', () => {
    expect(parsePrefs('{"viewMode":"edit","activeId":42}').activeId).toBeNull()
  })

  it('accepts every real view mode', () => {
    for (const viewMode of ['edit', 'split', 'preview']) {
      expect(parsePrefs(JSON.stringify({ viewMode })).viewMode).toBe(viewMode)
    }
  })
})
