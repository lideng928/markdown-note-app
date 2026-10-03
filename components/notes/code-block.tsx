'use client'

import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { highlight } from '@/lib/highlighter'
import { cn } from '@/lib/utils'

type CodeBlockProps = {
  code: string
  lang?: string
}

/** Cached alongside its input so a stale result is never shown for new code. */
type Highlighted = { code: string; lang: string | undefined; html: string }

export function CodeBlock({ code, lang }: CodeBlockProps) {
  const [result, setResult] = useState<Highlighted | null>(null)

  // Derived rather than reset inside the effect: when `code` changes we fall back
  // to plain text immediately, with no extra render pass.
  const html = result !== null && result.code === code && result.lang === lang ? result.html : null

  useEffect(() => {
    let cancelled = false
    highlight(code, lang).then((next) => {
      if (!cancelled && next !== null) setResult({ code, lang, html: next })
    })
    return () => {
      cancelled = true
    }
  }, [code, lang])

  return (
    <div className="group not-prose relative my-5 overflow-hidden rounded-lg border bg-muted">
      {lang && (
        <span className="pointer-events-none absolute top-2 left-3 font-mono text-[10px] tracking-wide text-muted-foreground uppercase opacity-70">
          {lang}
        </span>
      )}
      <CopyButton value={code} />
      {html !== null ? (
        // Shiki escapes the code it renders, so this markup is its own output only.
        <div
          className="shiki-host overflow-x-auto text-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        // Shown until Shiki resolves, and permanently for unknown languages.
        <pre className="overflow-x-auto px-4 pt-7 pb-4 text-sm leading-relaxed">
          <code className="font-mono">{code}</code>
        </pre>
      )}
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timeout)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      // Clipboard access can be denied; the code is still selectable.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied' : 'Copy code'}
      className={cn(
        'absolute top-1.5 right-1.5 z-10 flex size-7 items-center justify-center rounded-md border bg-background/80 text-muted-foreground backdrop-blur transition-all hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        // Always visible on touch, where there is no hover to reveal it.
        'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100',
        copied && 'text-primary opacity-100',
      )}
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
    </button>
  )
}
