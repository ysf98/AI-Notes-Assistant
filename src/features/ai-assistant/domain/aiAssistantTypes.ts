import type { NoteCategory } from '../../../domain/note'

export type AiAction = 'create_note' | 'summarize_note' | 'convert_to_tasks' | 'propose_title' | 'classify_note'

export interface AiContext {
  selectedNoteTitle?: string
  selectedNoteContent?: string
  categories: NoteCategory[]
}

export interface CreateNoteResponse {
  action: 'create_note'
  title: string
  content: string
  category: NoteCategory
}

export interface SummarizeNoteResponse {
  action: 'summarize_note'
  summary: string
}

export interface ConvertToTasksResponse {
  action: 'convert_to_tasks'
  tasks: string[]
}

export interface ProposeTitleResponse {
  action: 'propose_title'
  title: string
}

export interface ClassifyNoteResponse {
  action: 'classify_note'
  category: NoteCategory
}

export type AiAssistantResponse =
  | CreateNoteResponse
  | SummarizeNoteResponse
  | ConvertToTasksResponse
  | ProposeTitleResponse
  | ClassifyNoteResponse
