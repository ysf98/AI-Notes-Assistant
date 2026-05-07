import { describe, expect, it, vi } from 'vitest'
import { createNoteFromDraft, formatNoteDate, generateNoteId } from '../../shared/utils/noteFactory'

describe('noteFactory', () => {
  it('genera id', () => {
    expect(generateNoteId()).toBeTypeOf('string')
  })
  it('formatea fecha', () => {
    expect(formatNoteDate(new Date('2026-01-03T00:00:00.000Z'))).toBe('2026-01-03')
  })
  it('crea nota desde draft', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('id-test')
    const note = createNoteFromDraft({ title: 'A' })
    expect(note.id).toBe('id-test')
    expect(note.title).toBe('A')
  })
})
