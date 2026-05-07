# AI Notes Assistant

App de notas + chatbot IA con integración segura mediante endpoint backend (`/api/chat`).

## Seguridad de API key (OpenAI)
1. Crea un archivo `.env` local (no se sube a GitHub).
2. Añade tu clave:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```
3. La key se lee **solo en backend/serverless** con `process.env.OPENAI_API_KEY`.
4. Nunca uses `VITE_` para la API key.

> `.env` está ignorado por git en `.gitignore`.

## Flujo de arquitectura
- Frontend: `fetch('/api/chat')`.
- Backend/serverless (`api/chat.ts`): valida `OPENAI_API_KEY`, llama a OpenAI y devuelve JSON estructurado.
- Tests: IA mockeada, sin llamadas reales a OpenAI.

## Acciones JSON soportadas
- `create_note`
- `summarize_note`
- `convert_to_tasks`
- `suggest_title`
- `classify_note`
- `unknown`

## Ejecutar con npm
```bash
npm install
npm run dev
```

## Tests y calidad
```bash
npm run dev
npm run test
npm run lint
```

## Regla crítica
La API key **nunca** debe subirse a GitHub ni incluirse en frontend.
