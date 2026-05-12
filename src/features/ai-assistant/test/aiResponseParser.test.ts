import { describe, expect, it } from 'vitest'
import { parseAiAssistantResponse } from '../application/aiResponseParser'

describe('parseAiAssistantResponse', () => {
  it('valida create_note', () => {
    const result = parseAiAssistantResponse({
      action: 'create_note',
      title: 'A',
      content: 'B',
      category: 'Ideas',
    })
    expect(result.action).toBe('create_note')
  })

  it('valida summarize_note', () => {
    const result = parseAiAssistantResponse({ action: 'summarize_note', summary: 'Resumen' })
    expect(result.action).toBe('summarize_note')
  })

  it('valida edit_note', () => {
    const result = parseAiAssistantResponse({
      action: 'edit_note',
      title: 'Nuevo titulo',
      content: 'Nuevo contenido',
    })
    expect(result.action).toBe('edit_note')
    if (result.action === 'edit_note') expect(result.title).toBe('Nuevo titulo')
  })

  it('falla con payload invalido', () => {
    expect(() => parseAiAssistantResponse({ action: 'create_note', title: 'A' })).toThrowError()
  })

  it('valida unknown', () => {
    const result = parseAiAssistantResponse({ action: 'unknown', message: 'No entiendo' })
    expect(result.action).toBe('unknown')
  })
})
