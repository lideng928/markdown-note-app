'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createNote, loadNotes, saveNotes, type Note } from '@/lib/notes'

const SAVE_DELAY_MS = 600

export type SaveStatus = 'saved' | 'saving'

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(loadNotes)
  const [activeId, setActiveId] = useState<string | null>(() => {
    const [first] = [...notes].sort((a, b) => b.updatedAt - a.updatedAt)
    return first?.id ?? null
  })
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const latestNotes = useRef(notes)
  const hasMounted = useRef(false)

  useEffect(() => {
    latestNotes.current = notes
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    setSaveStatus('saving')
    const timeout = window.setTimeout(() => {
      saveNotes(notes)
      setSaveStatus('saved')
    }, SAVE_DELAY_MS)
    return () => window.clearTimeout(timeout)
  }, [notes])

  // Flush any pending debounced save if the tab closes mid-typing.
  useEffect(() => {
    const flush = () => saveNotes(latestNotes.current)
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [])

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => b.updatedAt - a.updatedAt),
    [notes],
  )

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeId) ?? null,
    [notes, activeId],
  )

  const addNote = useCallback(() => {
    const note = createNote()
    setNotes((prev) => [note, ...prev])
    setActiveId(note.id)
    return note
  }, [])

  const updateNote = useCallback(
    (id: string, changes: Partial<Pick<Note, 'title' | 'content'>>) => {
      setNotes((prev) =>
        prev.map((note) =>
          note.id === id ? { ...note, ...changes, updatedAt: Date.now() } : note,
        ),
      )
    },
    [],
  )

  const deleteNote = useCallback(
    (id: string) => {
      const remaining = sortedNotes.filter((note) => note.id !== id)
      setNotes((prev) => prev.filter((note) => note.id !== id))
      setActiveId((current) => (current === id ? (remaining[0]?.id ?? null) : current))
    },
    [sortedNotes],
  )

  return {
    notes: sortedNotes,
    activeNote,
    activeId,
    setActiveId,
    addNote,
    updateNote,
    deleteNote,
    saveStatus,
  }
}
