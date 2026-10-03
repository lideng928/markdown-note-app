import { describe, expect, it } from 'vitest'
import { INDENT, indentSelection, minimalReplace, outdentSelection } from '../markdown-edit'

/** Renders a selection as `a|b` for a caret or `a[sel]b` for a range. */
function show({ value, start, end }: { value: string; start: number; end: number }) {
  if (start === end) return value.slice(0, start) + '|' + value.slice(start)
  return value.slice(0, start) + '[' + value.slice(start, end) + ']' + value.slice(end)
}

describe('indentSelection', () => {
  it('inserts one indent at a collapsed caret', () => {
    expect(show(indentSelection({ value: 'ab', start: 1, end: 1 }))).toBe('a' + INDENT + '|b')
  })

  // The regression this module exists for: the old handler replaced the whole
  // selection with two spaces, destroying every selected line.
  it('indents every line of a multi-line selection instead of replacing it', () => {
    const value = 'one\ntwo\nthree'
    const result = indentSelection({ value, start: 0, end: value.length })
    expect(result.value).toBe('  one\n  two\n  three')
  })

  it('keeps the indented lines selected', () => {
    const value = 'one\ntwo'
    const result = indentSelection({ value, start: 0, end: value.length })
    expect(show(result)).toBe('[  one\n  two]')
  })

  it('indents whole lines even when the selection starts mid-line', () => {
    const value = 'alpha\nbeta'
    const result = indentSelection({ value, start: 2, end: 7 })
    expect(result.value).toBe('  alpha\n  beta')
  })

  it('does not pull in the following line when the selection ends on a newline', () => {
    const value = 'one\ntwo\nthree'
    const result = indentSelection({ value, start: 0, end: 4 })
    expect(result.value).toBe('  one\ntwo\nthree')
  })

  it('indents a single fully selected line', () => {
    expect(indentSelection({ value: 'solo', start: 0, end: 4 }).value).toBe('  solo')
  })

  it('leaves surrounding text untouched', () => {
    const value = 'keep\nmove\nkeep too'
    expect(indentSelection({ value, start: 5, end: 9 }).value).toBe('keep\n  move\nkeep too')
  })
})

describe('outdentSelection', () => {
  it('removes one indent step from a line', () => {
    expect(outdentSelection({ value: '    deep', start: 8, end: 8 }).value).toBe('  deep')
  })

  it('removes a single leading space when that is all there is', () => {
    expect(outdentSelection({ value: ' x', start: 2, end: 2 }).value).toBe('x')
  })

  it('removes a leading tab', () => {
    expect(outdentSelection({ value: '\tx', start: 2, end: 2 }).value).toBe('x')
  })

  it('outdents every line of a multi-line selection', () => {
    const value = '  one\n  two\n  three'
    const result = outdentSelection({ value, start: 0, end: value.length })
    expect(result.value).toBe('one\ntwo\nthree')
  })

  it('skips lines that have no indentation to remove', () => {
    const value = 'flush\n  indented'
    const result = outdentSelection({ value, start: 0, end: value.length })
    expect(result.value).toBe('flush\nindented')
  })

  it('is a no-op when nothing is indented', () => {
    const selection = { value: 'flush\nalso flush', start: 0, end: 16 }
    expect(outdentSelection(selection)).toEqual(selection)
  })

  it('never moves the caret before the start of its line', () => {
    const result = outdentSelection({ value: '  x', start: 0, end: 0 })
    expect(result.start).toBe(0)
    expect(result.value).toBe('x')
  })

  it('reverses indentSelection for a multi-line selection', () => {
    const value = 'one\ntwo\nthree'
    const indented = indentSelection({ value, start: 0, end: value.length })
    expect(outdentSelection(indented).value).toBe(value)
  })
})

describe('minimalReplace', () => {
  const apply = (before: string, after: string) => {
    const { from, to, text } = minimalReplace(before, after)
    return before.slice(0, from) + text + before.slice(to)
  }

  it.each([
    ['an insertion', 'abc', 'abXc'],
    ['a deletion', 'abXc', 'abc'],
    ['a replacement', 'abc', 'aXc'],
    ['an append', 'abc', 'abcd'],
    ['a prepend', 'abc', 'zabc'],
    ['no change', 'abc', 'abc'],
    ['emptying', 'abc', ''],
    ['filling from empty', '', 'abc'],
    ['a multi-line indent', 'one\ntwo', '  one\n  two'],
    ['a multi-line outdent', '  one\n  two', 'one\ntwo'],
    ['repeated characters', 'aaaa', 'aaaaa'],
  ])('reconstructs %s', (_label, before, after) => {
    expect(apply(before, after)).toBe(after)
  })

  it('reports an empty range when nothing changed', () => {
    expect(minimalReplace('abc', 'abc')).toEqual({ from: 3, to: 3, text: '' })
  })

  it('narrows to just the changed span', () => {
    expect(minimalReplace('keep X keep', 'keep Y keep')).toEqual({ from: 5, to: 6, text: 'Y' })
  })

  it('stays narrow for an indent in a long document', () => {
    const before = 'x'.repeat(500) + '\ntarget\n' + 'y'.repeat(500)
    const after = 'x'.repeat(500) + '\n  target\n' + 'y'.repeat(500)
    const { from, to, text } = minimalReplace(before, after)
    expect(to - from).toBeLessThan(5)
    expect(text).toBe('  ')
  })
})
