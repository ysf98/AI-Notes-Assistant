import { parseAiAssistantResponse } from '../src/features/ai-assistant/application/aiResponseParser'

interface ChatRequestBody {
  message?: string
  note?: { title?: string; content?: string }
}

const systemPrompt = `You are an AI Notes Assistant. Return valid JSON only. No markdown.
Use exactly one of these shapes:
{"action":"create_note","title":"...","content":"...","category":"General|Trabajo|Estudio|Ideas|Personal"}
{"action":"summarize_note","summary":"..."}
{"action":"convert_to_tasks","tasks":["..."]}
{"action":"suggest_title","title":"..."}
{"action":"classify_note","category":"General|Estudio|Ideas|Personal|Trabajo"}
{"action":"unknown","message":"..."}
`

export default async function handler(req: { method?: string; body?: ChatRequestBody }, res: { status: (n: number) => { json: (v: unknown) => void } }) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return res.status(500).json({ action: 'unknown', message: 'Server misconfigured' })

  const message = req.body?.message?.trim()
  if (!message) return res.status(400).json({ action: 'unknown', message: 'Invalid request' })

  try {
    const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
        input: [
          { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
          { role: 'user', content: [{ type: 'input_text', text: `Message: ${message}\nNote: ${req.body?.note?.content ?? ''}` }] },
        ],
      }),
    })

    if (!openAiResponse.ok) return res.status(502).json({ action: 'unknown', message: 'AI service unavailable' })

    const data = (await openAiResponse.json()) as { output_text?: string }
    const parsed = parseAiAssistantResponse(JSON.parse(data.output_text ?? '{"action":"unknown","message":"No response"}'))
    return res.status(200).json(parsed)
  } catch {
    return res.status(500).json({ action: 'unknown', message: 'Internal server error' })
  }
}
