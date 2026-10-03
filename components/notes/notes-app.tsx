'use client'

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { MD_QUERY, useMediaQuery } from '@/hooks/use-media-query'
import { useNotes } from '@/hooks/use-notes'
import { readMarkdownFiles } from '@/lib/export'
import { toggleTaskAtLine } from '@/lib/markdown-tasks'
import { getNoteTitle, type Note } from '@/lib/notes'
import { loadPrefs, savePrefs, type ViewMode } from '@/lib/prefs'
import { cn } from '@/lib/utils'
import { DeleteNoteDialog } from './delete-note-dialog'
import { EmptyState } from './empty-state'
import { MarkdownEditor } from './markdown-editor'
import { MarkdownPreview } from './markdown-preview'
import { NoteHeader } from './note-header'
import { NoteSidebar } from './note-sidebar'
import { ShareDialog } from './share-dialog'
import { Toast } from './toast'

export function NotesApp() {
  const {
    notes,
    activeNote,
    activeId,
    setActiveId,
    addNote,
    addNotes,
    updateNote,
    deleteNote,
    saveStatus,
  } = useNotes()

  const [query, setQuery] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => loadPrefs().viewMode)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)

  const deferredContent = useDeferredValue(activeNote?.content ?? '')
  const isDesktop = useMediaQuery(MD_QUERY)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  // Split needs two panes side by side, so below `md` it resolves to the editor.
  // Resolving it here keeps the toggle's pressed state honest.
  const effectiveViewMode: ViewMode = !isDesktop && viewMode === 'split' ? 'edit' : viewMode

  useEffect(() => {
    savePrefs({ viewMode })
  }, [viewMode])

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

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false)
    // Return focus to the control that opened the drawer.
    menuButtonRef.current?.focus()
  }, [])

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

  function handleImport(imported: Note[]) {
    addNotes(imported)
    setQuery('')
    setMessage(
      imported.length === 1
        ? `Imported “${getNoteTitle(imported[0])}”.`
        : `Imported ${imported.length} notes.`,
    )
  }

  /**
   * The preview renders deferred content, so a checkbox click can carry a line
   * number that has already shifted. Toggling against the live content and
   * letting `toggleTaskAtLine` no-op on a mismatch keeps a stale click harmless.
   */
  const handleToggleTask = useCallback(
    (line: number) => {
      if (!activeNote) return
      const next = toggleTaskAtLine(activeNote.content, line)
      if (next !== activeNote.content) updateNote(activeNote.id, { content: next })
    },
    [activeNote, updateNote],
  )

  async function handleDrop(event: React.DragEvent) {
    event.preventDefault()
    setIsDraggingFiles(false)
    const files = Array.from(event.dataTransfer.files)
    if (files.length === 0) return
    const imported = await readMarkdownFiles(files)
    if (imported.length === 0) {
      setMessage('No markdown files in that drop.')
      return
    }
    handleImport(imported)
  }

  return (
    <TooltipProvider>
      <a
        href="#note-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-xs focus:text-primary-foreground"
      >
        Skip to editor
      </a>

      <div
        className="flex h-dvh overflow-hidden bg-background text-foreground"
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes('Files')) return
          event.preventDefault()
          setIsDraggingFiles(true)
        }}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
          setIsDraggingFiles(false)
        }}
        onDrop={handleDrop}
      >
        <NoteSidebar
          notes={filteredNotes}
          totalCount={notes.length}
          activeId={activeId}
          query={query}
          onQueryChange={setQuery}
          onSelect={handleSelect}
          onCreate={handleCreate}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          // Off-screen on mobile, the drawer used to keep every control in the
          // tab order; `inert` takes it out while it is hidden.
          isInert={!isDesktop && !isSidebarOpen}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          {activeNote ? (
            <>
              <NoteHeader
                title={activeNote.title}
                onTitleChange={(title) => updateNote(activeNote.id, { title })}
                saveStatus={saveStatus}
                viewMode={effectiveViewMode}
                onViewModeChange={setViewMode}
                canSplit={isDesktop}
                onDelete={() => setIsDeleteOpen(true)}
                onShare={() => setIsShareOpen(true)}
                onOpenSidebar={() => setIsSidebarOpen(true)}
                isSidebarOpen={isSidebarOpen}
                menuButtonRef={menuButtonRef}
                note={activeNote}
                notes={notes}
                onImport={handleImport}
                onError={setMessage}
              />
              <div className="flex min-h-0 flex-1">
                <section
                  aria-label="Editor"
                  data-print="hide"
                  className={cn(
                    'min-w-0 flex-1 flex-col',
                    effectiveViewMode === 'preview' ? 'hidden' : 'flex',
                    effectiveViewMode === 'split' && 'md:border-r',
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
                  data-print="surface"
                  className={cn(
                    'min-w-0 flex-1 flex-col bg-card',
                    effectiveViewMode === 'edit' ? 'hidden' : 'flex',
                  )}
                >
                  <MarkdownPreview content={deferredContent} onToggleTask={handleToggleTask} />
                </section>
              </div>
            </>
          ) : (
            <EmptyState onCreate={handleCreate} onOpenSidebar={() => setIsSidebarOpen(true)} />
          )}
        </main>

        {isDraggingFiles && (
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <p className="rounded-xl border-2 border-dashed border-primary px-6 py-4 text-sm font-medium">
              Drop markdown files to import
            </p>
          </div>
        )}
      </div>

      {activeNote && (
        <>
          <DeleteNoteDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            noteTitle={getNoteTitle(activeNote)}
            onConfirm={() => deleteNote(activeNote.id)}
          />
          <ShareDialog open={isShareOpen} onOpenChange={setIsShareOpen} note={activeNote} />
        </>
      )}

      <Toast message={message} onDismiss={() => setMessage(null)} />
    </TooltipProvider>
  )
}
