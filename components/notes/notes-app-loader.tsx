'use client'

import dynamic from 'next/dynamic'

// Notes live in localStorage, so render client-only to avoid hydration mismatches.
const NotesApp = dynamic(() => import('./notes-app').then((mod) => mod.NotesApp), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh" aria-busy="true" aria-label="Loading notes">
      <div className="hidden w-72 border-r bg-sidebar md:block" />
      <div className="flex-1" />
    </div>
  ),
})

export function NotesAppLoader() {
  return <NotesApp />
}
