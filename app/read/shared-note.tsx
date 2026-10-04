'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Copy, NotebookPen, ShieldCheck } from 'lucide-react'
import { MarkdownPreview } from '@/components/notes/markdown-preview'
import { ThemeToggle } from '@/components/notes/theme-toggle'
import { Button } from '@/components/ui/button'
import { createNote, loadNotes, saveNotes } from '@/lib/notes'
import { ShareDecodeError, decodeNote } from '@/lib/share'

type Decoded = { title: string; content: string } | { error: string }

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

/**
 * The shared note lives in the URL fragment, which is external state — reading it
 * through a store keeps hash changes reactive without a setState-on-mount cascade.
 *
 * Returns null while rendering on the server, where there is no location to read;
 * that reads as "still loading" rather than flashing the empty state.
 */
function useHash(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => window.location.hash.replace(/^#/, ''),
    () => null,
  )
}

export function SharedNote() {
  const router = useRouter()
  const hash = useHash()
  const [result, setResult] = useState<{ hash: string; decoded: Decoded } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (hash === null || hash === '') return
    let cancelled = false

    decodeNote(hash)
      .then((payload) => {
        if (!cancelled) setResult({ hash, decoded: { title: payload.t, content: payload.c } })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setResult({
          hash,
          decoded: {
            error:
              cause instanceof ShareDecodeError ? cause.message : 'This link could not be read.',
          },
        })
      })

    return () => {
      cancelled = true
    }
  }, [hash])

  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timeout)
  }, [copied])

  // Derived from the current hash, so a stale decode is never rendered.
  const decoded = result !== null && result.hash === hash ? result.decoded : null
  const note = decoded !== null && !('error' in decoded) ? decoded : null

  function openInMargin() {
    if (note === null) return
    saveNotes([createNote({ title: note.title, content: note.content }), ...loadNotes()])
    router.push('/')
  }

  async function copyMarkdown() {
    if (note === null) return
    try {
      await navigator.clipboard.writeText(note.content)
      setCopied(true)
    } catch {
      // Clipboard access can be denied; the text is still selectable.
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header
        data-print="hide"
        className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/90 px-4 py-2.5 backdrop-blur md:px-6"
      >
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <NotebookPen className="size-4" aria-hidden />
          </span>
          Margin
        </Link>
        <span className="flex-1" />
        {note !== null && (
          <>
            <Button variant="ghost" size="sm" onClick={copyMarkdown}>
              {copied ? (
                <Check data-icon="inline-start" aria-hidden />
              ) : (
                <Copy data-icon="inline-start" aria-hidden />
              )}
              <span className="max-sm:sr-only">{copied ? 'Copied' : 'Copy markdown'}</span>
            </Button>
            <Button size="sm" onClick={openInMargin}>
              <span className="max-sm:sr-only">Open in Margin</span>
              <ArrowRight data-icon="inline-end" aria-hidden />
            </Button>
          </>
        )}
        <ThemeToggle />
      </header>

      <main className="flex min-h-0 flex-1 flex-col" data-print="surface">
        {hash === '' ? (
          <Fallback
            heading="Nothing shared here"
            body="This page shows a note handed to you as a link. Open Margin to write your own."
          />
        ) : decoded === null ? (
          <p className="mt-20 text-center text-sm text-muted-foreground" aria-busy>
            Opening note…
          </p>
        ) : 'error' in decoded ? (
          <Fallback heading="This link didn’t open" body={decoded.error} />
        ) : (
          <>
            <div className="mx-auto w-full max-w-prose px-4 pt-8 md:px-8">
              {/* Most notes open with their own `# Heading`; repeating the title
                  above it just prints the same words twice. */}
              {!/^\s*#\s/.test(decoded.content) && (
                <h1 className="text-2xl font-semibold tracking-tight">
                  {decoded.title || 'Untitled note'}
                </h1>
              )}
              <p
                data-print="hide"
                className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <ShieldCheck className="size-3.5 shrink-0 text-primary" aria-hidden />
                Read from the link itself — this note was never uploaded anywhere.
              </p>
            </div>
            {/* Read-only: checkboxes stay inert without an onToggleTask handler. */}
            <MarkdownPreview content={decoded.content} className="pb-16" />
          </>
        )}
      </main>
    </div>
  )
}

function Fallback({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="mx-auto mt-20 max-w-sm px-6 text-center">
      <h1 className="text-lg font-semibold tracking-tight">{heading}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <Button className="mt-5" nativeButton={false} render={<Link href="/" />}>
        Open Margin
        <ArrowRight data-icon="inline-end" aria-hidden />
      </Button>
    </div>
  )
}
