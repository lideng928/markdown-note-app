'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import { CircleHelp } from 'lucide-react'
import { MarkdownHints } from './markdown-hints'

const INDENT = '  '
const HINTS_ID = 'markdown-hints'

type MarkdownEditorProps = {
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showHints, setShowHints] = useState(false)
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0

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
    if (event.key !== 'Tab' || event.shiftKey || event.metaKey || event.ctrlKey) return
    event.preventDefault()
    const { selectionStart, selectionEnd } = event.currentTarget
    onChange(value.slice(0, selectionStart) + INDENT + value.slice(selectionEnd))
    requestAnimationFrame(() => {
      const cursor = selectionStart + INDENT.length
      textareaRef.current?.setSelectionRange(cursor, cursor)
    })
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
        className="min-h-0 flex-1 resize-none bg-transparent px-4 py-5 font-mono text-sm leading-7 outline-none placeholder:text-muted-foreground/70 md:px-8"
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
          {wordCount} {wordCount === 1 ? 'word' : 'words'} · {value.length} chars
        </span>
      </div>
    </div>
  )
}
