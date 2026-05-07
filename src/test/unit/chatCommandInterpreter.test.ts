import { describe, expect, it } from 'vitest'
import { interpretCommand } from '../../application/chatCommandInterpreter'
import type { Note } from '../../domain/note'

const note: Note = {
  id: '1', title: 'Demo', content: 'Primera frase. Segunda frase. Tercera frase.', category: 'General', date: '2026-05-07', createdAt: '', updatedAt: ''
}

describe('chatCommandInterpreter', () => {
  it('crea nota con comando', () => {
    const result = interpretCommand('crea una nota sobre testing', note, [note])
    expect(result.type).toBe('create')
  })
  it('resume nota', () => {
    const result = interpretCommand('resume esta nota', note, [note])
    expect(result.message).toContain('Resumen:')
  })
  it('convierte en tareas', () => {
    const result = interpretCommand('convierte esta nota en tareas', note, [note])
    expect(result.message).toContain('Tareas sugeridas:')
  })
  it('comando desconocido', () => {
    const result = interpretCommand('hola', note, [note])
    expect(result.message).toContain('Comando no reconocido')
  })
})
