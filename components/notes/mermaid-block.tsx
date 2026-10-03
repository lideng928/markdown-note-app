'use client'

import { useEffect, useId, useState } from 'react'
import { useTheme } from 'next-themes'

type MermaidBlockProps = {
  code: string
}

/**
 * Renders a ```mermaid fence as a diagram.
 *
 * Mermaid is several hundred kilobytes, so it is imported here and nowhere else —
 * a note without a mermaid fence never downloads it.
 */
export function MermaidBlock({ code }: MermaidBlockProps) {
  const { resolvedTheme } = useTheme()
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // useId() contains characters that are invalid in a DOM id / CSS selector.
  const domId = `mermaid-${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: resolvedTheme === 'dark' ? 'dark' : 'default',
          fontFamily: 'inherit',
        })
        const result = await mermaid.render(domId, code)
        if (cancelled) return
        setSvg(result.svg)
        setError(null)
      } catch (cause) {
        if (cancelled) return
        setSvg(null)
        setError(cause instanceof Error ? cause.message : 'Could not render this diagram.')
      }
    }

    void render()
    return () => {
      cancelled = true
    }
  }, [code, resolvedTheme, domId])

  if (error !== null) {
    return (
      <div className="not-prose my-5 overflow-hidden rounded-lg border border-destructive/40 bg-destructive/5">
        <p className="border-b border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive">
          Diagram error
        </p>
        <pre className="overflow-x-auto px-3 py-2 text-xs text-muted-foreground">{error}</pre>
        <pre className="overflow-x-auto border-t border-destructive/20 px-3 py-2 font-mono text-xs">
          {code}
        </pre>
      </div>
    )
  }

  const frame =
    'not-prose my-5 flex justify-center overflow-x-auto rounded-lg border bg-card p-4 [&_svg]:h-auto [&_svg]:max-w-full'

  if (svg === null) {
    return (
      <div className={frame} aria-busy>
        <span className="py-6 text-xs text-muted-foreground">Rendering diagram…</span>
      </div>
    )
  }

  return (
    // Mermaid sanitises its own output at securityLevel 'strict'.
    <div className={frame} dangerouslySetInnerHTML={{ __html: svg }} />
  )
}
