'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import { CircleHelp } from 'lucide-react'
import { indentSelection, minimalReplace, outdentSelection } from '@/lib/markdown-edit'
import { countTasks } from '@/lib/markdown-tasks'
import { MarkdownHints } from './markdown-hints'

const HINTS_ID = 'markdown-hints'

type MarkdownEditorProps = {
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showHints, setShowHints] = useState(false)
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0
  const tasks = countTasks(value)

  /**
   * Apply an edit through `execCommand('insertText')` when the browser allows it,
   * so Ctrl+Z still undoes it. Rewriting the controlled value directly — what the
   * old Tab handler did — wipes the textarea's native undo history.
   */
  function applyEdit(next: { value: string; start: number; end: number }) {
    const textarea = textareaRef.current
    if (next.value === value || !textarea) return

    const { from, to, text } = minimalReplace(value, next.value)
    textarea.setSelectionRange(from, to)

    let handled = false
    try {
      handled = text
        ? document.execCommand('insertText', false, text)
        : document.execCommand('delete')
    } catch {
      handled = false
    }

    // execCommand is deprecated and can be unavailable; the edit still has to land.
    if (!handled) onChange(next.value)

    requestAnimationFrame(() => textarea.setSelectionRange(next.start, next.end))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === '/' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      setShowHints((open) => !open)
      return
    }
    if (event.key === 'Escape' && showHints) {
      setShowHints(false)
      return
    }
    if (event.key !== 'Tab' || event.metaKey || event.ctrlKey || event.altKey) return

    event.preventDefault()
    const { selectionStart, selectionEnd } = event.currentTarget
    const selection = { value, start: selectionStart, end: selectionEnd }
    applyEdit(event.shiftKey ? outdentSelection(selection) : indentSelection(selection))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <label htmlFor="note-content" className="sr-only">
        Note content (markdown)
      </label>
      <textarea
        ref={textareaRef}
        id="note-content"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Start writing in markdown…"
        spellCheck
        /* text-base below md: iOS Safari auto-zooms on focus under 16px. */
        className="min-h-0 flex-1 resize-none bg-transparent px-4 py-5 font-mono text-base leading-7 outline-none placeholder:text-muted-foreground/70 md:px-8 md:text-sm"
      />
      {showHints && <MarkdownHints id={HINTS_ID} onClose={() => setShowHints(false)} />}
      <div className="flex items-center justify-between border-t px-4 py-1.5 text-xs text-muted-foreground md:px-8">
        <button
          type="button"
          onClick={() => setShowHints((open) => !open)}
          aria-expanded={showHints}
          aria-controls={HINTS_ID}
          title="Toggle markdown cheatsheet (Ctrl + /)"
          className="-mx-1.5 flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <CircleHelp className="size-3.5" aria-hidden="true" />
          Markdown help
        </button>
        <span className="tabular-nums">
          {tasks.total > 0 && (
            <>
              {tasks.done}/{tasks.total} done{' · '}
            </>
          )}
          {wordCount} {wordCount === 1 ? 'word' : 'words'} · {value.length} chars
        </span>
      </div>
    </div>
  )
}
