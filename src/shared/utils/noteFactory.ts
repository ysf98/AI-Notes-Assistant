import type { Note } from '../../domain/note'
import type { NoteDraft } from '../types/app'

export const generateNoteId = (): string => crypto.randomUUID()

export const formatNoteDate = (date = new Date()): string => date.toISOString().slice(0, 10)

export const createNoteFromDraft = (seed?: Partial<NoteDraft>): Note => {
  const now = new Date().toISOString()

  return {
    id: generateNoteId(),
    title: '',
    content: '',
    category: 'General',
    date: formatNoteDate(new Date(now)),
    createdAt: now,
    updatedAt: now,
    ...seed,
  }
}
