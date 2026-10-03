'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createNote, loadNotes, saveNotes, type Note } from '@/lib/notes'
import { loadPrefs, savePrefs } from '@/lib/prefs'

const SAVE_DELAY_MS = 600

export type SaveStatus = 'saved' | 'saving' | 'error'

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(loadNotes)
  const [activeId, setActiveId] = useState<string | null>(() => {
    // Reopen whatever was last open, falling back to the most recent note.
    const stored = loadPrefs().activeId
    if (stored !== null && notes.some((note) => note.id === stored)) return stored
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
      // saveNotes reports quota and private-mode failures instead of swallowing
      // them, so a failed write never shows up as "Saved".
      setSaveStatus(saveNotes(notes) ? 'saved' : 'error')
    }, SAVE_DELAY_MS)
    return () => window.clearTimeout(timeout)
  }, [notes])

  // Flush any pending debounced save if the tab closes mid-typing.
  useEffect(() => {
    const flush = () => saveNotes(latestNotes.current)
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [])

  useEffect(() => {
    savePrefs({ activeId })
  }, [activeId])

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

  /** Add imported notes, re-issuing ids so re-importing a backup cannot collide. */
  const addNotes = useCallback((incoming: Note[]) => {
    if (incoming.length === 0) return
    const taken = new Set(latestNotes.current.map((note) => note.id))
    const fresh = incoming.map((note) =>
      taken.has(note.id) ? { ...note, id: createNote().id } : note,
    )
    setNotes((prev) => [...fresh, ...prev])
    setActiveId(fresh[0].id)
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
    addNotes,
    updateNote,
    deleteNote,
    saveStatus,
  }
}
