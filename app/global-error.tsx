'use client'

import { useEffect } from 'react'

/**
 * Last-resort boundary: a failure in the root layout means the app's own styles
 * and providers are unavailable, so this page carries inline styles only.
 */
export default function GlobalError({ error }: { error: Error }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          display: 'grid',
          placeItems: 'center',
          minHeight: '100dvh',
          margin: 0,
          fontFamily: 'system-ui, sans-serif',
          color: '#18181b',
          background: '#fff',
        }}
      >
        <div style={{ maxWidth: '24rem', padding: '1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.125rem', margin: '0 0 0.5rem' }}>Margin failed to start</h1>
          <p style={{ fontSize: '0.875rem', color: '#52525b', margin: '0 0 1.25rem' }}>
            Your notes are still saved in this browser.
          </p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the root layout failed; only a full reload can recover */}
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '0.5rem 0.875rem',
              borderRadius: '0.5rem',
              background: '#18181b',
              color: '#fff',
              fontSize: '0.875rem',
              textDecoration: 'none',
            }}
          >
            Reload
          </a>
        </div>
      </body>
    </html>
  )
}
