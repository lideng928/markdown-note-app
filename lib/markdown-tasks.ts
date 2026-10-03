/** Matches a GFM task-list item and captures its prefix, state char, and closing bracket. */
const TASK_LINE = /^(\s*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\])/

/** True when the 1-based `line` of `content` is a GFM task-list item. */
export function isTaskLine(content: string, line: number) {
  const target = content.split('\n')[line - 1]
  return target !== undefined && TASK_LINE.test(target)
}

/**
 * Flip the checkbox on the 1-based `line` of `content`.
 *
 * Returns `content` untouched when that line is not a task item. That no-op is
 * load-bearing: the preview renders a deferred copy of the content, so a click
 * during fast typing can carry a line number that has already moved. Failing
 * closed turns a stale click into nothing instead of corrupting another line.
 */
export function toggleTaskAtLine(content: string, line: number): string {
  const lines = content.split('\n')
  const index = line - 1
  const target = lines[index]
  if (target === undefined) return content

  const match = TASK_LINE.exec(target)
  if (!match) return content

  const prefix = match[1]
  const next = match[2] === ' ' ? 'x' : ' '
  lines[index] = prefix + next + target.slice(prefix.length + 1)
  return lines.join('\n')
}

/** Count of complete/total task items, for the note's progress indicator. */
export function countTasks(content: string) {
  let total = 0
  let done = 0
  for (const line of content.split('\n')) {
    const match = TASK_LINE.exec(line)
    if (!match) continue
    total += 1
    if (match[2] !== ' ') done += 1
  }
  return { done, total }
}
