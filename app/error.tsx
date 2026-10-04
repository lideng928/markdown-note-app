'use client'

import { useEffect } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-sm text-center">
        <h1 className="text-lg font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your notes are stored in this browser and were not affected. Reloading usually fixes it.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={reset}>
            <RotateCcw data-icon="inline-start" aria-hidden />
            Try again
          </Button>
          {/*
            A real anchor, not next/link: client-side navigation reuses the React
            tree that just crashed. A full document load is the point.
          */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <Button variant="outline" nativeButton={false} render={<a href="/" />}>
            Reload Margin
          </Button>
        </div>
      </div>
    </div>
  )
}
