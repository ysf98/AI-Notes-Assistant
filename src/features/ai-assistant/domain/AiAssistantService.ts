import type { AiAssistantResponse, AiContext } from './aiAssistantTypes'

export interface AiAssistantService {
  runInstruction(instruction: string, context: AiContext): Promise<AiAssistantResponse>
}
