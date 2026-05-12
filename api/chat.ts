export const config = { runtime: 'nodejs' }

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

type NoteCategory = 'General' | 'Trabajo' | 'Estudio' | 'Ideas' | 'Personal'

type ApiResponse =
  | { action: 'create_note'; title: string; content: string; category: NoteCategory }
  | { action: 'summarize_note'; summary: string }
  | { action: 'convert_to_tasks'; tasks: string[] }
  | { action: 'suggest_title'; title: string }
  | { action: 'classify_note'; category: NoteCategory }
  | { action: 'edit_note'; title?: string; content?: string; category?: NoteCategory }
  | { action: 'unknown'; message: string }

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

const DEFAULT_MODEL = 'gpt-4o-mini'
const FALLBACK_MODEL = 'gpt-4.1-mini'
const categories: NoteCategory[] = ['General', 'Trabajo', 'Estudio', 'Ideas', 'Personal']

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const clampText = (value: string, maxChars: number): string =>
  value.length > maxChars ? value.slice(0, maxChars) : value

const getEnv = (key: string): string | undefined => {
  try {
    const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
      ?.env
    if (!env) return undefined
    return env[key]
  } catch {
    return undefined
  }
}

const extractOutputText = (data: OpenAiResponsesSuccess): string | null => {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text

  for (const item of data.output ?? []) {
    for (const part of item.content ?? []) {
      if (part.type === 'output_text' && typeof part.text === 'string' && part.text.trim())
        return part.text
    }
  }

  return null
}

const shouldRetryWithFallback = (status: number, errorData: OpenAiErrorResponse): boolean => {
  const message = (errorData.error?.message ?? '').toLowerCase()
  return status === 404 || message.includes('model') || errorData.error?.code === 'model_not_found'
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const parseAiResponse = (payload: unknown): ApiResponse => {
  if (!isObject(payload) || typeof payload.action !== 'string')
    return { action: 'unknown', message: 'Invalid AI response' }

  switch (payload.action) {
    case 'create_note':
      if (
        typeof payload.title !== 'string' ||
        typeof payload.content !== 'string' ||
        typeof payload.category !== 'string' ||
        !categories.includes(payload.category as NoteCategory)
      )
        return { action: 'unknown', message: 'Invalid create_note response' }
      return {
        action: 'create_note',
        title: payload.title,
        content: payload.content,
        category: payload.category as NoteCategory,
      }
    case 'summarize_note':
      return typeof payload.summary === 'string'
        ? { action: 'summarize_note', summary: payload.summary }
        : { action: 'unknown', message: 'Invalid summarize_note response' }
    case 'convert_to_tasks':
      return Array.isArray(payload.tasks) && payload.tasks.every((task) => typeof task === 'string')
        ? { action: 'convert_to_tasks', tasks: payload.tasks }
        : { action: 'unknown', message: 'Invalid convert_to_tasks response' }
    case 'suggest_title':
      return typeof payload.title === 'string'
        ? { action: 'suggest_title', title: payload.title }
        : { action: 'unknown', message: 'Invalid suggest_title response' }
    case 'classify_note':
      return typeof payload.category === 'string' &&
        categories.includes(payload.category as NoteCategory)
        ? { action: 'classify_note', category: payload.category as NoteCategory }
        : { action: 'unknown', message: 'Invalid classify_note response' }
    case 'edit_note': {
      const hasTitle = typeof payload.title === 'string'
      const hasContent = typeof payload.content === 'string'
      const hasCategory =
        typeof payload.category === 'string' &&
        categories.includes(payload.category as NoteCategory)
      if (!hasTitle && !hasContent && !hasCategory)
        return { action: 'unknown', message: 'Invalid edit_note response' }
      return {
        action: 'edit_note',
        ...(hasTitle ? { title: payload.title as string } : {}),
        ...(hasContent ? { content: payload.content as string } : {}),
        ...(hasCategory ? { category: payload.category as NoteCategory } : {}),
      }
    }
    case 'unknown':
      return typeof payload.message === 'string'
        ? { action: 'unknown', message: payload.message }
        : { action: 'unknown', message: 'Invalid unknown response' }
    default:
      return { action: 'unknown', message: 'Unsupported AI action' }
  }
}

export default async function handler(
  req: { method?: string; body?: ChatRequestBody },
  res: { status: (n: number) => { json: (v: unknown) => void } }
) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const model = getEnv('OPENAI_MODEL') ?? DEFAULT_MODEL
  const maxOutputTokens = parsePositiveInt(getEnv('OPENAI_MAX_OUTPUT_TOKENS'), 200)
  const maxMessageChars = parsePositiveInt(getEnv('OPENAI_MAX_MESSAGE_CHARS'), 800)
  const maxNoteChars = parsePositiveInt(getEnv('OPENAI_MAX_NOTE_CHARS'), 3000)

  const apiKey = getEnv('OPENAI_API_KEY')
  if (!apiKey) return res.status(500).json({ action: 'unknown', message: 'Server misconfigured' })

  const rawMessage = req.body?.message?.trim()
  if (!rawMessage) return res.status(400).json({ action: 'unknown', message: 'Invalid request' })

  const message = clampText(rawMessage, maxMessageChars)
  const noteContent = clampText((req.body?.note?.content ?? '').trim(), maxNoteChars)

  try {
    const callResponsesApi = async (modelName: string) =>
      fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: modelName,
          max_output_tokens: maxOutputTokens,
          input: [
            { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
            {
              role: 'user',
              content: [{ type: 'input_text', text: `Message: ${message}\nNote: ${noteContent}` }],
            },
          ],
        }),
      })

    let openAiResponse = await callResponsesApi(model)

    if (!openAiResponse.ok) {
      const errorData = (await openAiResponse.json().catch(() => ({}))) as OpenAiErrorResponse
      if (model !== FALLBACK_MODEL && shouldRetryWithFallback(openAiResponse.status, errorData)) {
        openAiResponse = await callResponsesApi(FALLBACK_MODEL)
      } else {
        return res.status(502).json({ action: 'unknown', message: 'AI service unavailable' })
      }
    }

    if (!openAiResponse.ok)
      return res.status(502).json({ action: 'unknown', message: 'AI service unavailable' })

    const data = (await openAiResponse.json()) as OpenAiResponsesSuccess
    const outputText = extractOutputText(data) ?? '{"action":"unknown","message":"No response"}'
    const parsed = parseAiResponse(JSON.parse(outputText))
    return res.status(200).json(parsed)
  } catch {
    return res.status(500).json({ action: 'unknown', message: 'Internal server error' })
  }
}
