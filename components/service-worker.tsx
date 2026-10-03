'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker that makes Margin installable and usable offline.
 *
 * Production only: in development it would serve stale bundles and fight the
 * dev server's hot reload.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    const register = () => {
      void navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration fails on unsupported or restricted contexts; the app
        // works fine without it.
      })
    }
    // Deferred so registration never competes with first paint.
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
    return () => window.removeEventListener('load', register)
  }, [])

  return null
}
