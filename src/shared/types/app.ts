import type { Note, NoteCategory } from '../../domain/note'

export type NoteDraft = Pick<Note, 'title' | 'content' | 'category'>

export interface CreateCommandResult {
  type: 'create'
  payload: NoteDraft
  message: string
}

export interface MessageCommandResult {
  type: 'message'
  message: string
}

export type CommandResult = CreateCommandResult | MessageCommandResult

export interface CategoryCount {
  category: NoteCategory
  count: number
}
