import type { Note } from '../../domain/note'

const STORAGE_KEY = 'ai-notes-assistant-notes'

export const loadNotes = (): Note[] => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    return JSON.parse(raw) as Note[]
  } catch {
    return []
  }
}

export const saveNotes = (notes: Note[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}
