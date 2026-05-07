import type { AiAssistantService } from '../domain/AiAssistantService'
import type { AiAssistantResponse, AiContext } from '../domain/aiAssistantTypes'
import { parseAiAssistantResponse } from '../application/aiResponseParser'

const AI_ASSISTANT_URL = import.meta.env.VITE_AI_ASSISTANT_ENDPOINT || '/api/ai/assistant'

export class RemoteAiAssistantService implements AiAssistantService {
  async runInstruction(instruction: string, context: AiContext): Promise<AiAssistantResponse> {
    const response = await fetch(AI_ASSISTANT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction, context }),
    })

    if (!response.ok) throw new Error('AI assistant endpoint failed')

    const payload: unknown = await response.json()
    return parseAiAssistantResponse(payload)
  }
}
