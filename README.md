# AI Notes Assistant

Aplicación de notas con asistente IA estructurado (mock + integración real preparada) usando npm.

## ✨ Qué incluye
- Gestión completa de notas: crear, editar, borrar y buscar.
- Persistencia local con `localStorage`.
- Asistente IA por feature separada con contratos tipados (`AiAssistantService`).
- Respuestas estructuradas para casos clave:
  - crear nota
  - resumir nota
  - convertir en tareas
  - proponer título
  - clasificar nota
- Implementación mock para tests y desarrollo local sin llamadas externas.
- Adaptador remoto preparado para futura serverless function (`/api/ai/assistant`).

## 🔐 Seguridad
- No exponer API keys en frontend.
- Usar únicamente endpoint backend/serverless para llamadas reales a IA.
- Configurar `VITE_AI_ASSISTANT_ENDPOINT` (ver `.env.example`) solo como URL, nunca como secreto.

## 🚀 Instalación y ejecución
```bash
npm install
npm run dev
```

## 📜 Scripts (npm)
```bash
npm run dev
npm run test
npm run test:watch
npm run test:coverage
npm run lint
npm run format
```

## 🧪 Testing
- Unit tests para parseo/validación de respuestas IA.
- Integration test para crear nota desde chatbot.
- Tests sin llamadas reales a APIs (siempre IA mockeada).

## 🧱 Arquitectura (features + scope rule)
```text
src/features/ai-assistant/
├─ domain/             # Contratos y tipos de IA
├─ application/        # Parseo y validación de respuestas IA
├─ infrastructure/     # Cliente remoto preparado para backend/serverless
├─ mocks/              # Implementación mock para entorno local y tests
└─ test/               # Tests unitarios de la feature
```
