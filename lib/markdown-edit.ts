/**
 * Pure selection transforms for the editor textarea.
 *
 * Kept free of DOM access so they can be unit-tested directly; the component
 * applies the result and is responsible for preserving the native undo stack.
 */

export const INDENT = '  '

/** A textarea's value plus its selection range. */
export type Selection = {
  value: string
  start: number
  end: number
}

export type EditResult = Selection

/** Leading whitespace one outdent step removes: a tab, or up to one indent width. */
const LEADING_WHITESPACE = new RegExp(`^(\t| {1,${INDENT.length}})`)

/**
 * The full-line span the selection touches.
 *
 * A selection ending exactly after a newline is treated as stopping on the
 * previous line, so selecting three whole lines doesn't indent a fourth.
 */
function lineBounds(value: string, start: number, end: number) {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const searchFrom = end > start && value[end - 1] === '\n' ? end - 1 : end
  const newline = value.indexOf('\n', searchFrom)
  return { lineStart, lineEnd: newline === -1 ? value.length : newline }
}

/**
 * Indent the selection.
 *
 * A collapsed caret inserts one indent at the caret. Any real selection indents
 * every line it touches and keeps those lines selected — the behaviour the old
 * handler got wrong by replacing the whole selection with two spaces.
 */
export function indentSelection({ value, start, end }: Selection): EditResult {
  if (start === end) {
    const caret = start + INDENT.length
    return { value: value.slice(0, start) + INDENT + value.slice(start), start: caret, end: caret }
  }

  const { lineStart, lineEnd } = lineBounds(value, start, end)
  const block = value.slice(lineStart, lineEnd)
  const indented = block
    .split('\n')
    .map((line) => INDENT + line)
    .join('\n')

  return {
    value: value.slice(0, lineStart) + indented + value.slice(lineEnd),
    start: lineStart,
    end: lineEnd + (indented.length - block.length),
  }
}

/** Remove one indent step from every line the selection touches. */
export function outdentSelection({ value, start, end }: Selection): EditResult {
  const { lineStart, lineEnd } = lineBounds(value, start, end)
  const block = value.slice(lineStart, lineEnd)

  let firstRemoved = 0
  const outdented = block
    .split('\n')
    .map((line, index) => {
      const match = LEADING_WHITESPACE.exec(line)
      if (!match) return line
      if (index === 0) firstRemoved = match[1].length
      return line.slice(match[1].length)
    })
    .join('\n')

  const removed = block.length - outdented.length
  if (removed === 0) return { value, start, end }

  const nextValue = value.slice(0, lineStart) + outdented + value.slice(lineEnd)
  if (start === end) {
    const caret = Math.max(lineStart, start - firstRemoved)
    return { value: nextValue, start: caret, end: caret }
  }
  return { value: nextValue, start: lineStart, end: lineEnd - removed }
}

/**
 * The smallest single replacement that turns `before` into `after`.
 *
 * The editor applies edits through `execCommand('insertText')` so the browser's
 * native undo stack keeps working — that needs a concrete range to replace rather
 * than a wholesale value swap, and a narrow range avoids churning the whole note.
 */
export function minimalReplace(before: string, after: string) {
  let from = 0
  const shortest = Math.min(before.length, after.length)
  while (from < shortest && before[from] === after[from]) from += 1

  let to = before.length
  let end = after.length
  while (to > from && end > from && before[to - 1] === after[end - 1]) {
    to -= 1
    end -= 1
  }

  return { from, to, text: after.slice(from, end) }
}
