import { describe, expect, it, vi } from 'vitest'
import type { Note } from '../../domain/note'
import { createNotesRepository } from '../../infrastructure/persistence/notesRepository'

const sampleNote: Note = {
  id: 'note-1',
  title: 'Nota',
  content: 'Contenido',
  category: 'General',
  date: '2026-05-08',
  createdAt: '2026-05-08T10:00:00.000Z',
  updatedAt: '2026-05-08T10:00:00.000Z',
}

const createSupabaseMock = () => {
  const select = vi.fn().mockReturnThis()
  const order = vi.fn().mockResolvedValue({
    data: [
      {
        id: 'supa-1',
        title: 'Supa',
        content: 'Desde DB',
        category: 'Ideas',
        created_at: '2026-05-08T10:00:00.000Z',
        updated_at: '2026-05-08T11:00:00.000Z',
      },
    ],
    error: null,
  })
  const insert = vi.fn().mockResolvedValue({ error: null })
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
  const del = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
  const from = vi.fn().mockImplementation(() => ({ select, order, insert, update, delete: del }))
  return { from, select, order, insert, update, del }
}

describe('notesRepository', () => {
  it('carga notas desde Supabase cuando esta configurado', async () => {
    const supabase = createSupabaseMock()
    const saveLocal = vi.fn()

    const repository = createNotesRepository({
      isConfigured: () => true,
      getClient: () => ({ from: supabase.from }) as never,
      loadLocal: () => [],
      saveLocal,
    })

    const result = await repository.load()
    expect(result.mode).toBe('supabase')
    expect(result.notes[0].id).toBe('supa-1')
    expect(saveLocal).toHaveBeenCalled()
  })

  it('crea nota en Supabase', async () => {
    const supabase = createSupabaseMock()
    const repository = createNotesRepository({
      isConfigured: () => true,
      getClient: () => ({ from: supabase.from }) as never,
      loadLocal: () => [],
      saveLocal: vi.fn(),
    })

    const result = await repository.create(sampleNote)
    expect(result.mode).toBe('supabase')
    expect(supabase.insert).toHaveBeenCalled()
  })

  it('actualiza nota en Supabase', async () => {
    const supabase = createSupabaseMock()
    const repository = createNotesRepository({
      isConfigured: () => true,
      getClient: () => ({ from: supabase.from }) as never,
      loadLocal: () => [],
      saveLocal: vi.fn(),
    })

    const result = await repository.update(sampleNote)
    expect(result.mode).toBe('supabase')
    expect(supabase.update).toHaveBeenCalled()
  })

  it('elimina nota en Supabase', async () => {
    const supabase = createSupabaseMock()
    const repository = createNotesRepository({
      isConfigured: () => true,
      getClient: () => ({ from: supabase.from }) as never,
      loadLocal: () => [],
      saveLocal: vi.fn(),
    })

    const result = await repository.remove(sampleNote.id)
    expect(result.mode).toBe('supabase')
    expect(supabase.del).toHaveBeenCalled()
  })

  it('usa localStorage fallback si Supabase no esta configurado', async () => {
    const loadLocal = vi.fn(() => [sampleNote])
    const saveLocal = vi.fn()
    const repository = createNotesRepository({
      isConfigured: () => false,
      getClient: () => null,
      loadLocal,
      saveLocal,
    })

    const loadResult = await repository.load()
    expect(loadResult.mode).toBe('localStorage')
    expect(loadResult.notes[0].id).toBe(sampleNote.id)

    await repository.create(sampleNote)
    await repository.update({ ...sampleNote, title: 'Editada' })
    await repository.remove(sampleNote.id)
    expect(saveLocal).toHaveBeenCalled()
  })
})
