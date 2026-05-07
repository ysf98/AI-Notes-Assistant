import { parseAiAssistantResponse } from '../src/features/ai-assistant/application/aiResponseParser'

interface ChatRequestBody {
  message?: string
  note?: { title?: string; content?: string }
}

interface OpenAiErrorResponse {
  error?: { message?: string; code?: string }
}

interface OpenAiResponsesSuccess {
  output_text?: string
  output?: Array<{
    content?: Array<{
      type?: string
      text?: string
    }>
  }>
}

const systemPrompt = `You are an AI Notes Assistant. Return valid JSON only. No markdown.
Use exactly one of these shapes:
{"action":"create_note","title":"...","content":"...","category":"General|Trabajo|Estudio|Ideas|Personal"}
{"action":"summarize_note","summary":"..."}
{"action":"convert_to_tasks","tasks":["..."]}
{"action":"suggest_title","title":"..."}
{"action":"classify_note","category":"General|Estudio|Ideas|Personal|Trabajo"}
{"action":"edit_note","title":"optional","content":"optional","category":"General|Trabajo|Estudio|Ideas|Personal"}
{"action":"unknown","message":"..."}
`

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
const FALLBACK_MODEL = 'gpt-4.1-mini'

const extractOutputText = (data: OpenAiResponsesSuccess): string | null => {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text

  for (const item of data.output ?? []) {
    for (const part of item.content ?? []) {
      if (part.type === 'output_text' && typeof part.text === 'string' && part.text.trim()) return part.text
    }
  }

  return null
}

const shouldRetryWithFallback = (status: number, errorData: OpenAiErrorResponse): boolean => {
  const message = (errorData.error?.message ?? '').toLowerCase()
  return status === 404 || message.includes('model') || errorData.error?.code === 'model_not_found'
}

export default async function handler(req: { method?: string; body?: ChatRequestBody }, res: { status: (n: number) => { json: (v: unknown) => void } }) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return res.status(500).json({ action: 'unknown', message: 'Server misconfigured' })

  const message = req.body?.message?.trim()
  if (!message) return res.status(400).json({ action: 'unknown', message: 'Invalid request' })

  try {
    const callResponsesApi = async (model: string) =>
      fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          input: [
            { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
            { role: 'user', content: [{ type: 'input_text', text: `Message: ${message}\nNote: ${req.body?.note?.content ?? ''}` }] },
          ],
        }),
      })

    let openAiResponse = await callResponsesApi(DEFAULT_MODEL)

    if (!openAiResponse.ok) {
      const errorData = (await openAiResponse.json().catch(() => ({}))) as OpenAiErrorResponse
      if (DEFAULT_MODEL !== FALLBACK_MODEL && shouldRetryWithFallback(openAiResponse.status, errorData)) {
        openAiResponse = await callResponsesApi(FALLBACK_MODEL)
      } else {
        return res.status(502).json({ action: 'unknown', message: 'AI service unavailable' })
      }
    }

    if (!openAiResponse.ok) return res.status(502).json({ action: 'unknown', message: 'AI service unavailable' })

    const data = (await openAiResponse.json()) as OpenAiResponsesSuccess
    const outputText = extractOutputText(data) ?? '{"action":"unknown","message":"No response"}'
    const parsed = parseAiAssistantResponse(JSON.parse(outputText))
    return res.status(200).json(parsed)
  } catch {
    return res.status(500).json({ action: 'unknown', message: 'Internal server error' })
  }
}
