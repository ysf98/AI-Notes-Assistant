# AI Notes Assistant

Aplicación de **notas personales + asistente IA** con enfoque privacy-first: la UI vive en React y las llamadas a OpenAI pasan por un endpoint backend (`/api/chat`) para no exponer la API key en el navegador.

## 1) ¿Para qué sirve?

AI Notes Assistant te permite:

- Crear, editar y organizar notas.
- Buscar notas rápidamente por texto.
- Usar un chatbot para automatizar tareas sobre notas:
  - crear nota,
  - resumir nota,
  - convertir nota en tareas,
  - sugerir título,
  - clasificar categoría,
  - editar nota seleccionada.

## 2) Demo

- Demo local: `http://localhost:5173` (con `npm run dev`).
- Demo online: depende de tu despliegue en Vercel.

## 3) Features principales

- Editor de notas con título, contenido, categoría y fecha.
- Sidebar con listado, búsqueda y creación/eliminación de notas.
- Persistencia local en `localStorage`.
- Asistente IA con respuestas JSON tipadas y validadas.
- Endpoint backend seguro para OpenAI (`api/chat.ts`).
- Límites de consumo configurables por entorno:
  - tokens de salida,
  - tamaño máximo del mensaje,
  - tamaño máximo del contenido de nota.
- Suite de tests unitarios e integración.

## 4) Stack técnico

- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS
- **Backend API (serverless):** `api/chat.ts` (Vercel-compatible)
- **Testing:** Vitest + Testing Library + JSDOM
- **Persistencia local:** `localStorage`
- **IA:** OpenAI Responses API

## 5) Arquitectura (visión rápida)

Estructura por capas siguiendo principios de Clean Architecture:

- `src/domain/*`: entidades y tipos de dominio (`note`, `chat`).
- `src/application/*`: lógica de casos de uso local.
- `src/infrastructure/*`: persistencia y adaptadores técnicos.
- `src/features/ai-assistant/*`: dominio, parser y servicios IA.
- `src/components/*`: UI.
- `api/chat.ts`: endpoint backend para OpenAI.

Flujo IA:

1. Frontend envía instrucción a `/api/chat`.
2. Backend valida input + límites.
3. Backend llama a OpenAI con la API key del servidor.
4. Backend normaliza/valida JSON de respuesta.
5. Frontend aplica acción recibida en la UI.

## 6) Instalación y arranque

### Requisitos

- Node.js 20+ (recomendado LTS actual).
- npm.

### Pasos

```bash
npm ci
cp .env.example .env
```

Configura tu `.env`:

```bash
OPENAI_API_KEY=tu_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_OUTPUT_TOKENS=200
OPENAI_MAX_MESSAGE_CHARS=800
OPENAI_MAX_NOTE_CHARS=3000
```

Arranque en desarrollo:

```bash
npm run dev
```

## 7) Scripts disponibles

```bash
npm run dev        # servidor local
npm run build      # build producción
npm run preview    # preview local de build
npm run test       # tests (run)
npm run test:watch # tests en watch
npm run test:coverage
npm run lint       # en este repo equivale a build
```

## 8) Variables de entorno

- `OPENAI_API_KEY` (obligatoria): clave de OpenAI en backend.
- `OPENAI_MODEL` (opcional): modelo IA. Default: `gpt-4o-mini`.
- `OPENAI_MAX_OUTPUT_TOKENS` (opcional): límite de salida. Default: `200`.
- `OPENAI_MAX_MESSAGE_CHARS` (opcional): máximo chars instrucción usuario. Default: `800`.
- `OPENAI_MAX_NOTE_CHARS` (opcional): máximo chars contenido de nota enviado al modelo. Default: `3000`.

## 9) Seguridad

- No uses `VITE_` para la API key.
- `.env` está ignorado en `.gitignore`.
- La key solo se usa en backend (`api/chat.ts`).
- Cualquier usuario de una app pública puede consumir tu cuota de OpenAI: añade auth/rate-limit antes de abrirla al público.

## 10) Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Configura variables de entorno del proyecto (Production y Preview).
3. Deploy.
4. Verifica `POST /api/chat`.

Si ves latencia en la primera llamada del chatbot, puede ser un **cold start** del runtime serverless.

## 11) Troubleshooting

- `Server misconfigured`: falta `OPENAI_API_KEY` en entorno del deploy.
- `AI service unavailable (502)`: fallo aguas arriba de OpenAI o modelo no disponible.
- `FUNCTION_INVOCATION_FAILED`: revisar logs de Vercel y runtime/env del endpoint.
- El chatbot tarda al inicio: posible cold start.

## 12) Estado de calidad

- Tests unitarios e integración activos en `src/test`.
- Validación de respuestas IA con parser tipado.
- Build de producción con TypeScript.

---

Si vas a contribuir, revisa también `AGENTS.md` para reglas de arquitectura, testing y definición de done.
