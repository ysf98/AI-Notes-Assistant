import type { SupabaseClient } from '@supabase/supabase-js'
import type { Note } from '../../domain/note'
import {
  loadNotes as loadLocalNotes,
  saveNotes as saveLocalNotes,
} from './localStorageNotesRepository'
import { getSupabaseClient, isSupabaseConfigured } from '../supabase/client'

type StorageMode = 'supabase' | 'localStorage'

interface NoteRow {
  id: string
  title: string
  content: string
  category: Note['category']
  created_at: string
  updated_at: string
}

interface NotesRepositoryDeps {
  getClient: () => SupabaseClient | null
  isConfigured: () => boolean
  loadLocal: () => Note[]
  saveLocal: (notes: Note[]) => void
}

export interface NotesRepository {
  load: () => Promise<{ notes: Note[]; mode: StorageMode }>
  create: (note: Note) => Promise<{ mode: StorageMode }>
  update: (note: Note) => Promise<{ mode: StorageMode }>
  remove: (id: string) => Promise<{ mode: StorageMode }>
}

const toRow = (note: Note): NoteRow => ({
  id: note.id,
  title: note.title,
  content: note.content,
  category: note.category,
  created_at: note.createdAt,
  updated_at: note.updatedAt,
})

const toDomain = (row: NoteRow): Note => ({
  id: row.id,
  title: row.title,
  content: row.content,
  category: row.category,
  date: row.created_at.slice(0, 10),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const createNotesRepository = (deps?: Partial<NotesRepositoryDeps>): NotesRepository => {
  const getClient = deps?.getClient ?? getSupabaseClient
  const isConfigured = deps?.isConfigured ?? isSupabaseConfigured
  const loadLocal = deps?.loadLocal ?? loadLocalNotes
  const saveLocal = deps?.saveLocal ?? saveLocalNotes

  const load = async (): Promise<{ notes: Note[]; mode: StorageMode }> => {
    if (!isConfigured()) return { notes: loadLocal(), mode: 'localStorage' }

    const client = getClient()
    if (!client) return { notes: loadLocal(), mode: 'localStorage' }

    const { data, error } = await client
      .from('notes')
      .select('id,title,content,category,created_at,updated_at')
      .order('updated_at', { ascending: false })

    if (error) return { notes: loadLocal(), mode: 'localStorage' }

    const notes = (data as NoteRow[]).map(toDomain)
    saveLocal(notes)
    return { notes, mode: 'supabase' }
  }

  const create = async (note: Note): Promise<{ mode: StorageMode }> => {
    if (!isConfigured()) {
      const notes = [note, ...loadLocal()]
      saveLocal(notes)
      return { mode: 'localStorage' }
    }

    const client = getClient()
    if (!client) {
      const notes = [note, ...loadLocal()]
      saveLocal(notes)
      return { mode: 'localStorage' }
    }

    const { error } = await client.from('notes').insert(toRow(note))
    if (error) {
      const notes = [note, ...loadLocal()]
      saveLocal(notes)
      return { mode: 'localStorage' }
    }

    return { mode: 'supabase' }
  }

  const update = async (note: Note): Promise<{ mode: StorageMode }> => {
    if (!isConfigured()) {
      const notes = loadLocal().map((current) => (current.id === note.id ? note : current))
      saveLocal(notes)
      return { mode: 'localStorage' }
    }

    const client = getClient()
    if (!client) {
      const notes = loadLocal().map((current) => (current.id === note.id ? note : current))
      saveLocal(notes)
      return { mode: 'localStorage' }
    }

    const { error } = await client.from('notes').update(toRow(note)).eq('id', note.id)
    if (error) {
      const notes = loadLocal().map((current) => (current.id === note.id ? note : current))
      saveLocal(notes)
      return { mode: 'localStorage' }
    }

    return { mode: 'supabase' }
  }

  const remove = async (id: string): Promise<{ mode: StorageMode }> => {
    if (!isConfigured()) {
      const notes = loadLocal().filter((current) => current.id !== id)
      saveLocal(notes)
      return { mode: 'localStorage' }
    }

    const client = getClient()
    if (!client) {
      const notes = loadLocal().filter((current) => current.id !== id)
      saveLocal(notes)
      return { mode: 'localStorage' }
    }

    const { error } = await client.from('notes').delete().eq('id', id)
    if (error) {
      const notes = loadLocal().filter((current) => current.id !== id)
      saveLocal(notes)
      return { mode: 'localStorage' }
    }

    return { mode: 'supabase' }
  }

  return { load, create, update, remove }
}
