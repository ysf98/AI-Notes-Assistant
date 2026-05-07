import type { Note } from '../../domain/note'
import { initialMockNotes } from '../../shared/mocks/notes'

const STORAGE_KEY = 'ai-notes-assistant-notes'

export const loadNotes = (): Note[] => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return initialMockNotes

  try {
    return JSON.parse(raw) as Note[]
  } catch {
    return initialMockNotes
  }
}

export const saveNotes = (notes: Note[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}
