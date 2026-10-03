'use client'

import { isValidElement, memo, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { cn } from '@/lib/utils'
import { CodeBlock } from './code-block'
import { MermaidBlock } from './mermaid-block'

// All sync, which react-markdown's single-pass pipeline requires. Syntax
// highlighting is deliberately NOT a rehype plugin: Shiki's is async, so it is
// handled inside CodeBlock instead, which also keeps Shiki out of the first load.
const REMARK_PLUGINS = [remarkGfm, remarkMath]
const REHYPE_PLUGINS = [rehypeSlug, rehypeKatex]

const PROSE = cn(
  'prose prose-sm prose-neutral mx-auto max-w-prose dark:prose-invert md:prose-base',
  'prose-headings:tracking-tight prose-headings:scroll-mt-4 prose-a:text-primary',
  'prose-code:before:content-none prose-code:after:content-none prose-code:rounded',
  'prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:font-normal',
)

type MarkdownPreviewProps = {
  content: string
  /**
   * Called with the 1-based source line of a task item whose checkbox was clicked.
   * Omit to render checkboxes read-only, as on the shared-note page.
   */
  onToggleTask?: (line: number) => void
  className?: string
}

/** Fenced-block children arrive as a string, but guard against nested nodes. */
function toText(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(toText).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return toText(node.props.children)
  return ''
}

export const MarkdownPreview = memo(function MarkdownPreview({
  content,
  onToggleTask,
  className,
}: MarkdownPreviewProps) {
  const components: Components = {
    // Replacing `pre` rather than `code` keeps inline code on the default path.
    pre({ children }) {
      const child = Array.isArray(children) ? children[0] : children
      if (!isValidElement<{ className?: string; children?: ReactNode }>(child)) {
        return <pre>{children}</pre>
      }
      const lang = /language-([\w+#.-]+)/.exec(child.props.className ?? '')?.[1]
      const code = toText(child.props.children).replace(/\n$/, '')
      if (lang === 'mermaid') return <MermaidBlock code={code} />
      return <CodeBlock code={code} lang={lang} />
    },

    // Carries the source line down to the checkbox, which has no position of its own.
    li({ node, className: liClass, children, ...props }) {
      const isTask = (liClass ?? '').includes('task-list-item')
      return (
        <li {...props} className={liClass} data-line={isTask ? node?.position?.start.line : undefined}>
          {children}
        </li>
      )
    },

    input({ node: _node, ...props }) {
      if (props.type !== 'checkbox' || !onToggleTask) return <input {...props} />
      return (
        <input
          {...props}
          disabled={false}
          aria-label="Toggle task"
          className="cursor-pointer accent-primary"
          onChange={(event) => {
            const line = Number(event.currentTarget.closest('li[data-line]')?.getAttribute('data-line'))
            if (Number.isInteger(line)) onToggleTask(line)
          }}
        />
      )
    },

    a({ node: _node, href, ...props }) {
      // Heading anchors from rehype-slug are same-page, so only send real links out.
      const isExternal = /^(https?:)?\/\//i.test(href ?? '')
      return (
        <a href={href} {...props} {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })} />
      )
    },
  }

  return (
    <div className={cn('min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8', className)}>
      {content.trim() ? (
        <article className={PROSE}>
          <ReactMarkdown
            remarkPlugins={REMARK_PLUGINS}
            rehypePlugins={REHYPE_PLUGINS}
            components={components}
          >
            {content}
          </ReactMarkdown>
        </article>
      ) : (
        <p className="mt-10 text-center text-sm text-muted-foreground">Nothing to preview yet.</p>
      )}
    </div>
  )
})
