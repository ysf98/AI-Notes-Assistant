import type { AiAssistantService } from '../domain/AiAssistantService'
import type { AiAssistantResponse, AiContext } from '../domain/aiAssistantTypes'
import { parseAiAssistantResponse } from '../application/aiResponseParser'

export class RemoteAiAssistantService implements AiAssistantService {
  async runInstruction(instruction: string, context: AiContext): Promise<AiAssistantResponse> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: instruction, note: { title: context.selectedNoteTitle, content: context.selectedNoteContent } }),
    })

    if (!response.ok) throw new Error('AI assistant endpoint failed')
    return parseAiAssistantResponse(await response.json())
  }
}
