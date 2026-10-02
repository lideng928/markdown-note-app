'use client'

import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type MarkdownPreviewProps = {
  content: string
}

export const MarkdownPreview = memo(function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8">
      {content.trim() ? (
        <article className="prose prose-sm prose-neutral mx-auto max-w-prose dark:prose-invert md:prose-base prose-headings:tracking-tight prose-a:text-primary prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-pre:border prose-pre:bg-muted prose-pre:text-foreground [&_pre_code]:bg-transparent [&_pre_code]:p-0">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node: _node, ...props }) => (
                <a {...props} target="_blank" rel="noopener noreferrer" />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
      ) : (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Nothing to preview yet.
        </p>
      )}
    </div>
  )
})
