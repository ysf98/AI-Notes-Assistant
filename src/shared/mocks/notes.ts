import type { Note } from '../../domain/note'

const today = new Date().toISOString().slice(0, 10)

export const initialMockNotes: Note[] = [
  {
    id: 'mock-note-1',
    title: 'Plan semanal del proyecto',
    content:
      'Definir objetivos del sprint. Priorizar tareas de interfaz. Revisar backlog con el equipo y establecer entregables claros para el viernes.',
    category: 'Trabajo',
    date: today,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-note-2',
    title: 'Resumen de estudio TypeScript',
    content:
      'Repasar tipos utilitarios (Pick, Omit, Partial). Practicar con discriminated unions para estados de UI y resultados de comandos.',
    category: 'Estudio',
    date: today,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-note-3',
    title: 'Ideas para mejorar la app',
    content: 'Añadir modo colaborativo. Mejorar búsqueda por etiquetas. Integrar sugerencias inteligentes basadas en contexto.',
    category: 'Ideas',
    date: today,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]
