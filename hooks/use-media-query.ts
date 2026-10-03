'use client'

import { useEffect, useState } from 'react'

/** Tailwind's `md` breakpoint, where the split view becomes available. */
export const MD_QUERY = '(min-width: 48rem)'

export function useMediaQuery(query: string) {
  // Safe to read during render: the app shell is mounted client-only.
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = () => setMatches(list.matches)
    onChange()
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}
