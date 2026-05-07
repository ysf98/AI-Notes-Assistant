import { describe, expect, it } from 'vitest'
import { parseAiAssistantResponse } from '../application/aiResponseParser'

describe('parseAiAssistantResponse', () => {
  it('valida create_note', () => {
    const result = parseAiAssistantResponse({ action: 'create_note', title: 'A', content: 'B', category: 'Ideas' })
    expect(result.action).toBe('create_note')
  })

  it('valida summarize_note', () => {
    const result = parseAiAssistantResponse({ action: 'summarize_note', summary: 'Resumen' })
    expect(result.action).toBe('summarize_note')
  })

  it('falla con payload inválido', () => {
    expect(() => parseAiAssistantResponse({ action: 'create_note', title: 'A' })).toThrowError()
  })
})


it('valida unknown', () => {
  const result = parseAiAssistantResponse({ action: 'unknown', message: 'No entiendo' })
  expect(result.action).toBe('unknown')
})
