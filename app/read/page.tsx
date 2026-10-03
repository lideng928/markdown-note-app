import type { Metadata } from 'next'
import { SharedNote } from './shared-note'

export const metadata: Metadata = {
  title: 'Shared note — Margin',
  description: 'A markdown note shared as a link.',
  // The note lives in the URL fragment, so there is nothing here to index.
  robots: { index: false, follow: false },
}

export default function ReadPage() {
  return <SharedNote />
}
