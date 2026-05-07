import { categories } from '../../../domain/note'
import type { AiAssistantService } from '../domain/AiAssistantService'
import type { AiAssistantResponse, AiContext } from '../domain/aiAssistantTypes'

const firstSentence = (text: string): string => text.split(/(?<=[.!?])\s+/).filter(Boolean)[0] ?? text.slice(0, 160)

export class MockAiAssistantService implements AiAssistantService {
  async runInstruction(instruction: string, context: AiContext): Promise<AiAssistantResponse> {
    const normalized = instruction.toLowerCase().trim()

    if (normalized.startsWith('crea una nota sobre')) {
      const topic = instruction.replace(/crea una nota sobre/i, '').trim() || 'Nuevo tema'
      return { action: 'create_note', title: `Nota: ${topic}`, content: `Resumen inicial sobre ${topic}.`, category: 'Ideas' }
    }

    if (normalized.includes('resume la nota actual') || normalized.includes('resume esta nota')) {
      return { action: 'summarize_note', summary: firstSentence(context.selectedNoteContent ?? 'No hay nota seleccionada.') }
    }

    if (normalized.includes('convierte esta nota en tareas')) {
      const base = (context.selectedNoteContent ?? '').split(/\n|\.|;/).map((line) => line.trim()).filter(Boolean).slice(0, 4)
      return { action: 'convert_to_tasks', tasks: base.length ? base : ['Definir objetivo', 'Agregar próximos pasos'] }
    }

    if (normalized.includes('propón un título para esta nota') || normalized.includes('propon un título para esta nota')) {
      return { action: 'propose_title', title: context.selectedNoteTitle ? `Título sugerido: ${context.selectedNoteTitle}` : 'Título sugerido para la nota' }
    }

    if (normalized.includes('clasifica esta nota en una categoría') || normalized.includes('clasifica esta nota en una categoria')) {
      return { action: 'classify_note', category: categories.includes('Trabajo') ? 'Trabajo' : categories[0] }
    }

    return { action: 'summarize_note', summary: 'No pude mapear la instrucción a una acción específica.' }
  }
}
