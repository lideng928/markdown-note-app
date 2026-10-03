import { describe, expect, it } from 'vitest'
import { countTasks, isTaskLine, toggleTaskAtLine } from '../markdown-tasks'

describe('toggleTaskAtLine', () => {
  it('checks an unchecked box', () => {
    expect(toggleTaskAtLine('- [ ] buy milk', 1)).toBe('- [x] buy milk')
  })

  it('unchecks a checked box', () => {
    expect(toggleTaskAtLine('- [x] buy milk', 1)).toBe('- [ ] buy milk')
  })

  it('treats uppercase X as checked', () => {
    expect(toggleTaskAtLine('- [X] done', 1)).toBe('- [ ] done')
  })

  it('only touches the targeted line', () => {
    const content = '- [ ] one\n- [ ] two\n- [ ] three'
    expect(toggleTaskAtLine(content, 2)).toBe('- [ ] one\n- [x] two\n- [ ] three')
  })

  it.each([
    ['nested with spaces', '    - [ ] deep', '    - [x] deep'],
    ['asterisk marker', '* [ ] star', '* [x] star'],
    ['plus marker', '+ [ ] plus', '+ [x] plus'],
    ['ordered marker', '1. [ ] first', '1. [x] first'],
    ['ordered paren marker', '2) [ ] second', '2) [x] second'],
  ])('handles %s', (_label, input, expected) => {
    expect(toggleTaskAtLine(input, 1)).toBe(expected)
  })

  it('preserves trailing text and CRLF carriage returns', () => {
    expect(toggleTaskAtLine('- [ ] a **bold** item\r\n- [ ] b', 1)).toBe(
      '- [x] a **bold** item\r\n- [ ] b',
    )
  })

  // The preview renders deferred content, so a click can arrive with a stale line
  // number. Every one of these must be a no-op rather than corrupt another line.
  it.each([
    ['a plain list item', '- just a bullet', 1],
    ['a heading', '# Heading', 1],
    ['an empty line', '', 1],
    ['a line past the end', '- [ ] only line', 9],
    ['line zero', '- [ ] only line', 0],
    ['a negative line', '- [ ] only line', -1],
    ['a bracket that is not a task', '- [not a task] x', 1],
  ])('leaves content unchanged for %s', (_label, content, line) => {
    expect(toggleTaskAtLine(content, line)).toBe(content)
  })

  it('round-trips back to the original', () => {
    const content = '- [ ] a\n- [x] b'
    expect(toggleTaskAtLine(toggleTaskAtLine(content, 1), 1)).toBe(content)
  })
})

describe('isTaskLine', () => {
  it('distinguishes task items from plain bullets', () => {
    expect(isTaskLine('- [ ] yes', 1)).toBe(true)
    expect(isTaskLine('- no', 1)).toBe(false)
    expect(isTaskLine('- [ ] yes', 5)).toBe(false)
  })
})

describe('countTasks', () => {
  it('counts done and total', () => {
    expect(countTasks('- [x] a\n- [ ] b\n- [X] c\ntext')).toEqual({ done: 2, total: 3 })
  })

  it('returns zeroes when there are no tasks', () => {
    expect(countTasks('# just a heading')).toEqual({ done: 0, total: 0 })
  })
})
