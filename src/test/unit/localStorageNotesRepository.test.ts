import { describe, expect, it } from 'vitest'
import { loadNotes, saveNotes } from '../../infrastructure/persistence/localStorageNotesRepository'
import type { Note } from '../../domain/note'

describe('localStorageNotesRepository', () => {
  it('guarda y carga notas', () => {
    const notes: Note[] = [
      {
        id: 'a',
        title: 't',
        content: 'c',
        category: 'General',
        date: '2026-05-07',
        createdAt: 'x',
        updatedAt: 'x',
      },
    ]
    saveNotes(notes)
    expect(loadNotes()[0].id).toBe('a')
  })

  it('carga mocks si localStorage vacío', () => {
    localStorage.clear()
    expect(loadNotes().length).toBeGreaterThan(0)
  })
})
