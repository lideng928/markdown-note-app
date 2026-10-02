'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useNotes } from '@/hooks/use-notes'
import { getNoteTitle } from '@/lib/notes'
import { cn } from '@/lib/utils'
import { DeleteNoteDialog } from './delete-note-dialog'
import { EmptyState } from './empty-state'
import { MarkdownEditor } from './markdown-editor'
import { MarkdownPreview } from './markdown-preview'
import { NoteHeader } from './note-header'
import { NoteSidebar } from './note-sidebar'
import type { ViewMode } from './view-mode-toggle'

export function NotesApp() {
  const { notes, activeNote, activeId, setActiveId, addNote, updateNote, deleteNote, saveStatus } =
    useNotes()
  const [query, setQuery] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const deferredContent = useDeferredValue(activeNote?.content ?? '')

  const filteredNotes = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return notes
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(term) || note.content.toLowerCase().includes(term),
    )
  }, [notes, query])

  useEffect(() => {
    if (!isSidebarOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSidebarOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isSidebarOpen])

  function handleCreate() {
    addNote()
    setQuery('')
    setIsSidebarOpen(false)
    if (viewMode === 'preview') setViewMode('split')
    requestAnimationFrame(() => document.getElementById('note-title')?.focus())
  }

  function handleSelect(id: string) {
    setActiveId(id)
    setIsSidebarOpen(false)
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <NoteSidebar
        notes={filteredNotes}
        totalCount={notes.length}
        activeId={activeId}
        query={query}
        onQueryChange={setQuery}
        onSelect={handleSelect}
        onCreate={handleCreate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        {activeNote ? (
          <>
            <NoteHeader
              title={activeNote.title}
              onTitleChange={(title) => updateNote(activeNote.id, { title })}
              saveStatus={saveStatus}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onDelete={() => setIsDeleteOpen(true)}
              onOpenSidebar={() => setIsSidebarOpen(true)}
              isSidebarOpen={isSidebarOpen}
            />
            <div className="flex min-h-0 flex-1">
              <section
                aria-label="Editor"
                className={cn(
                  'min-w-0 flex-1 flex-col',
                  viewMode === 'preview' ? 'hidden' : 'flex',
                  viewMode === 'split' && 'md:border-r',
                )}
              >
                <MarkdownEditor
                  key={activeNote.id}
                  value={activeNote.content}
                  onChange={(content) => updateNote(activeNote.id, { content })}
                />
              </section>
              <section
                aria-label="Preview"
                className={cn(
                  'min-w-0 flex-1 flex-col bg-card',
                  viewMode === 'edit' && 'hidden',
                  viewMode === 'split' && 'hidden md:flex',
                  viewMode === 'preview' && 'flex',
                )}
              >
                <MarkdownPreview content={deferredContent} />
              </section>
            </div>
          </>
        ) : (
          <EmptyState onCreate={handleCreate} onOpenSidebar={() => setIsSidebarOpen(true)} />
        )}
      </main>

      {activeNote && (
        <DeleteNoteDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          noteTitle={getNoteTitle(activeNote)}
          onConfirm={() => deleteNote(activeNote.id)}
        />
      )}
    </div>
  )
}
