'use client'

import { FileText, Menu, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

type EmptyStateProps = {
  onCreate: () => void
  onOpenSidebar: () => void
}

export function EmptyState({ onCreate, onOpenSidebar }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center border-b px-3 py-2 md:hidden">
        <Button variant="ghost" size="icon" onClick={onOpenSidebar} aria-label="Open notes list">
          <Menu aria-hidden />
        </Button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <FileText className="size-6" aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight">No note selected</h2>
          <p className="text-sm text-muted-foreground text-pretty">
            Pick a note from the sidebar or start a fresh one.
          </p>
        </div>
        <Button onClick={onCreate}>
          <Plus data-icon="inline-start" aria-hidden />
          New note
        </Button>
      </div>
    </div>
  )
}
