'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Copy, Download, Link2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { downloadNoteMarkdown } from '@/lib/export'
import { getNoteTitle, type Note } from '@/lib/notes'
import { SHARE_LENGTH_WARNING, buildShareUrl, encodeNote } from '@/lib/share'

type ShareDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  note: Note
}

/** Tagged with the note it describes, so a result is never shown for another note. */
type Encoded =
  | { id: string; updatedAt: number; url: string; length: number }
  | { id: string; updatedAt: number; failed: true }

export function ShareDialog({ open, onOpenChange, note }: ShareDialogProps) {
  const [encoded, setEncoded] = useState<Encoded | null>(null)
  const [copied, setCopied] = useState(false)

  // Derived, so switching notes falls straight back to the pending state.
  const current =
    encoded !== null && encoded.id === note.id && encoded.updatedAt === note.updatedAt
      ? encoded
      : null

  useEffect(() => {
    if (!open || current !== null) return
    let cancelled = false
    const { id, updatedAt } = note

    encodeNote({ title: getNoteTitle(note), content: note.content })
      .then((payload) => {
        if (cancelled) return
        setEncoded({
          id,
          updatedAt,
          url: buildShareUrl(window.location.origin, payload),
          length: payload.length,
        })
      })
      .catch(() => {
        if (!cancelled) setEncoded({ id, updatedAt, failed: true })
      })

    return () => {
      cancelled = true
    }
  }, [open, note, current])

  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timeout)
  }, [copied])

  const link = current !== null && !('failed' in current) ? current : null

  async function copyLink() {
    if (link === null) return
    try {
      await navigator.clipboard.writeText(link.url)
      setCopied(true)
    } catch {
      // Clipboard permission can be denied; the field stays selectable.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this note</DialogTitle>
          <DialogDescription>
            Anyone with the link can read “{getNoteTitle(note)}”.
          </DialogDescription>
        </DialogHeader>

        {current !== null && 'failed' in current ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            This note could not be packed into a link.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={link !== null ? link.url : 'Preparing link…'}
                aria-label="Share link"
                onFocus={(event) => event.currentTarget.select()}
                className="min-w-0 flex-1 rounded-lg border bg-muted/50 px-2.5 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button size="sm" onClick={copyLink} disabled={link === null}>
                {copied ? (
                  <Check data-icon="inline-start" aria-hidden />
                ) : (
                  <Copy data-icon="inline-start" aria-hidden />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <p className="flex gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
              <span>
                The note travels inside the <code className="font-mono">#</code> part of the link,
                which browsers never send to a server. Nothing is uploaded — no copy of this note
                exists anywhere but the link itself.
              </span>
            </p>

            {link !== null && link.length > SHARE_LENGTH_WARNING && (
              <p className="flex gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden />
                <span>
                  This link is {link.length.toLocaleString()} characters. Some apps and mail clients
                  truncate very long links — sending the <code>.md</code> file may be safer.
                </span>
              </p>
            )}
          </>
        )}

        <div className="flex flex-wrap gap-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void navigator.clipboard.writeText(note.content).catch(() => {})}
          >
            <Link2 data-icon="inline-start" aria-hidden />
            Copy markdown
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadNoteMarkdown(note)}>
            <Download data-icon="inline-start" aria-hidden />
            Download .md
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
