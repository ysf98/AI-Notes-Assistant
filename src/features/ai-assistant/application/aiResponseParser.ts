import { categories, type NoteCategory } from '../../../domain/note'
import type { AiAssistantResponse } from '../domain/aiAssistantTypes'

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export const parseAiAssistantResponse = (payload: unknown): AiAssistantResponse => {
  if (!isObject(payload) || typeof payload.action !== 'string') throw new Error('Invalid AI response: missing action')

  switch (payload.action) {
    case 'create_note':
      if (typeof payload.title !== 'string' || typeof payload.content !== 'string' || typeof payload.category !== 'string' || !categories.includes(payload.category as NoteCategory)) throw new Error('Invalid create_note response')
      return { action: 'create_note', title: payload.title, content: payload.content, category: payload.category as NoteCategory }
    case 'summarize_note':
      if (typeof payload.summary !== 'string') throw new Error('Invalid summarize_note response')
      return { action: 'summarize_note', summary: payload.summary }
    case 'convert_to_tasks':
      if (!Array.isArray(payload.tasks) || !payload.tasks.every((task) => typeof task === 'string')) throw new Error('Invalid convert_to_tasks response')
      return { action: 'convert_to_tasks', tasks: payload.tasks }
    case 'suggest_title':
      if (typeof payload.title !== 'string') throw new Error('Invalid suggest_title response')
      return { action: 'suggest_title', title: payload.title }
    case 'classify_note':
      if (typeof payload.category !== 'string' || !categories.includes(payload.category as NoteCategory)) throw new Error('Invalid classify_note response')
      return { action: 'classify_note', category: payload.category as NoteCategory }
    case 'edit_note': {
      const hasTitle = typeof payload.title === 'string'
      const hasContent = typeof payload.content === 'string'
      const hasCategory = typeof payload.category === 'string'
      if (!hasTitle && !hasContent && !hasCategory) throw new Error('Invalid edit_note response')
      if (hasCategory && !categories.includes(payload.category as NoteCategory)) throw new Error('Invalid edit_note response')
      return {
        action: 'edit_note',
        ...(hasTitle ? { title: payload.title as string } : {}),
        ...(hasContent ? { content: payload.content as string } : {}),
        ...(hasCategory ? { category: payload.category as NoteCategory } : {}),
      }
    }
    case 'unknown':
      if (typeof payload.message !== 'string') throw new Error('Invalid unknown response')
      return { action: 'unknown', message: payload.message }
    default:
      throw new Error('Unsupported AI action')
  }
}
