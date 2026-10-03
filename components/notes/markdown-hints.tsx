import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const HINTS = [
  { syntax: '# Heading', label: 'Heading (## for smaller)' },
  { syntax: '**bold**', label: 'Bold' },
  { syntax: '*italic*', label: 'Italic' },
  { syntax: '~~strike~~', label: 'Strikethrough' },
  { syntax: '`code`', label: 'Inline code' },
  { syntax: '```', label: 'Code block' },
  { syntax: '- item', label: 'Bullet list' },
  { syntax: '1. item', label: 'Numbered list' },
  { syntax: '- [ ] task', label: 'Checklist' },
  { syntax: '> quote', label: 'Blockquote' },
  { syntax: '[text](url)', label: 'Link' },
  { syntax: '![alt](url)', label: 'Image' },
  { syntax: '---', label: 'Divider' },
  { syntax: '| a | b |', label: 'Table' },
]

type MarkdownHintsProps = {
  id: string
  onClose: () => void
}

export function MarkdownHints({ id, onClose }: MarkdownHintsProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="@container max-h-56 overflow-y-auto border-t bg-muted/40 px-4 py-3 md:px-8"
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 id={`${id}-title`} className="text-xs font-medium text-muted-foreground">
          Markdown cheatsheet
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-muted-foreground"
          onClick={onClose}
          aria-label="Close markdown cheatsheet"
        >
          <X className="size-3.5" />
        </Button>
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs @md:grid-cols-2 @3xl:grid-cols-3">
        {HINTS.map((hint) => (
          <div key={hint.syntax} className="flex min-w-0 items-center justify-between gap-3">
            <dt className="shrink-0">
              <code className="whitespace-nowrap rounded bg-background px-1.5 py-0.5 font-mono text-[11px] text-foreground ring-1 ring-border">
                {hint.syntax}
              </code>
            </dt>
            <dd className="min-w-0 truncate text-right text-muted-foreground">{hint.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
