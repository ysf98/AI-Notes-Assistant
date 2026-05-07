export type NoteCategory = 'General' | 'Trabajo' | 'Estudio' | 'Ideas' | 'Personal'

export interface Note {
  id: string
  title: string
  content: string
  category: NoteCategory
  date: string
  createdAt: string
  updatedAt: string
}

export const categories: NoteCategory[] = ['General', 'Trabajo', 'Estudio', 'Ideas', 'Personal']
