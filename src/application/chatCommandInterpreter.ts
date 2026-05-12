import type { Note } from '../domain/note'
import type { CommandResult } from '../shared/types/app'

const summarize = (text: string): string => {
  if (!text.trim()) return 'La nota está vacía, no hay nada que resumir.'
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean)
  return sentences.slice(0, 2).join(' ') || text.slice(0, 180)
}

const tasksFromNote = (text: string): string[] => {
  const lines = text
    .split(/\n|\.|;/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (!lines.length) {
    return ['Definir objetivo principal de la nota', 'Añadir próximos pasos concretos']
  }

  return lines.slice(0, 5).map((line) => `- [ ] ${line.charAt(0).toUpperCase()}${line.slice(1)}`)
}

export const interpretCommand = (
  command: string,
  selectedNote: Note | null,
  notes: Note[]
): CommandResult => {
  const normalized = command.toLowerCase().trim()

  if (normalized.startsWith('crea una nota sobre')) {
    const topic = command.replace(/crea una nota sobre/i, '').trim()
    return {
      type: 'create' as const,
      payload: {
        title: topic ? `Nota: ${topic}` : 'Nueva nota sugerida',
        content: topic
          ? `Ideas clave sobre ${topic}:\n- \n- \n- `
          : 'Escribe aquí el contenido sugerido.',
        category: 'Ideas' as const,
      },
      message: `He preparado una nota base sobre "${topic || 'tu tema'}". Puedes editarla cuando quieras.`,
    }
  }

  if (normalized.includes('resume esta nota')) {
    if (!selectedNote)
      return { type: 'message' as const, message: 'Selecciona una nota para poder resumirla.' }
    return { type: 'message' as const, message: `Resumen:\n${summarize(selectedNote.content)}` }
  }

  if (normalized.includes('convierte esta nota en tareas')) {
    if (!selectedNote)
      return {
        type: 'message' as const,
        message: 'Selecciona una nota para convertirla en tareas.',
      }
    return {
      type: 'message' as const,
      message: `Tareas sugeridas:\n${tasksFromNote(selectedNote.content).join('\n')}`,
    }
  }

  if (normalized.includes('clasifica mis notas')) {
    if (!notes.length)
      return { type: 'message' as const, message: 'Aún no tienes notas para clasificar.' }
    const grouped = notes.reduce<Record<string, number>>((acc, note) => {
      acc[note.category] = (acc[note.category] ?? 0) + 1
      return acc
    }, {})
    const summary = Object.entries(grouped)
      .map(([category, count]) => `• ${category}: ${count}`)
      .join('\n')
    return { type: 'message' as const, message: `Clasificación actual:\n${summary}` }
  }

  return {
    type: 'message' as const,
    message:
      'Comando no reconocido. Prueba con: "crea una nota sobre...", "resume esta nota", "convierte esta nota en tareas" o "clasifica mis notas".',
  }
}
