# AGENTS.md

Guía para colaboradores humanos y agentes en **AI Notes Assistant**.

## 1) Propósito del proyecto
AI Notes Assistant es una aplicación de **notas + asistente conversacional** con foco en:
- Productividad personal (captura, edición, búsqueda y organización de notas).
- Asistencia con IA para automatizar tareas sobre notas.
- Privacidad-first con ejecución local del frontend y control explícito de integraciones externas.
- Código mantenible y evolutivo.

Estado funcional actual:
- Gestión completa de notas (crear, editar, eliminar, buscar).
- Chat con comandos de productividad sobre notas.
- Persistencia remota con Supabase (cuando está configurado).
- Fallback automático a `localStorage` cuando Supabase no está disponible.

---

## 2) Reglas de arquitectura (Clean Architecture)

### 2.1 Principios base
- Mantener separación estricta por capas:
  - **Dominio**: entidades, value objects, reglas de negocio puras.
  - **Aplicación**: casos de uso/orquestación (sin framework).
  - **Infraestructura**: persistencia, cliente de IA, filesystem, APIs externas.
  - **Interfaz** (UI/API): componentes de presentación, rutas, controladores.
- Las dependencias siempre apuntan hacia adentro (la capa externa depende de la interna, nunca al revés).
- No mezclar lógica de negocio en UI/controladores.
- Cada caso de uso debe tener una única responsabilidad y contratos explícitos (interfaces/puertos).

### 2.2 Reglas de diseño
- Preferir composición sobre herencia.
- Evitar singletons globales no controlados.
- Definir DTOs claros entre capas; no filtrar modelos de infraestructura al dominio.
- Todo acceso a IO (DB, red, disco, modelo IA) debe estar abstraído detrás de puertos/adaptadores.
- Manejo de errores consistente: errores de dominio tipados, sin ocultar fallos críticos.

### 2.3 Estructura real del proyecto (actual)
Mantener esta organización como referencia al añadir nuevas features:

- `src/domain/*` → modelos y reglas de dominio (`note`, `chat`).
- `src/application/*` → orquestación de comandos/casos de uso.
- `src/infrastructure/supabase/*` → cliente Supabase.
- `src/infrastructure/persistence/*` → repositorios (`Supabase` y `localStorage`).
- `src/features/ai-assistant/domain/*` → contratos/tipos del asistente IA.
- `src/features/ai-assistant/application/*` → parser y lógica de interpretación de respuestas IA.
- `src/features/ai-assistant/infrastructure/*` → implementación remota del servicio IA.
- `src/components/*` → UI (sidebar, editor, panel de chat).
- `api/chat.ts` → endpoint backend para OpenAI Responses API.
- `src/shared/*` → utilidades, tipos y mocks compartidos.
- `src/test/unit/*` y `src/test/integration/*` → cobertura actual de pruebas.

Regla clave:
- La UI no debe hablar directamente con Supabase ni con OpenAI; debe hacerlo a través de servicios/repositorios de infraestructura y contratos de aplicación.

---

## 3) Reglas de testing

### 3.1 Pirámide de pruebas
- **Unit tests** (mayoría): dominio, parser IA, repositorios y componentes aislados.
- **Integration tests**: flujos de app que integran UI + persistencia/servicios.
- **E2E tests**: recomendados para flujos críticos de usuario (pendiente de ampliación formal).

### 3.2 Criterios mínimos
- Cada feature nueva debe incluir pruebas.
- Cada bugfix debe incluir al menos una prueba de regresión.
- No hacer merge si hay pruebas rotas.
- Evitar flaky tests: controlar seeds, tiempos y dependencias externas.

### 3.3 Buenas prácticas
- Arrange-Act-Assert explícito.
- Nombres de tests descriptivos y orientados a comportamiento.
- Mockear solo bordes externos (red, DB, almacenamiento, APIs).
- No mockear reglas de dominio puras.
- Mantener fixtures simples y reutilizables.

---

## 4) Reglas de calidad

### 4.1 Código
- Funciones pequeñas y cohesivas.
- Nombres semánticos (sin abreviaturas ambiguas).
- Evitar duplicación; extraer utilidades cuando sea recurrente.
- Comentarios solo cuando añadan contexto de negocio o decisiones no obvias.

### 4.2 Revisiones y cambios
- PRs pequeños y enfocados.
- Incluir contexto: problema, solución, trade-offs y riesgos.
- Actualizar documentación cuando cambie comportamiento visible.
- Si se toca arquitectura, justificar impacto en capas y contratos.

### 4.3 Seguridad y privacidad
- No registrar secretos ni contenido sensible en logs.
- Proteger datos de notas del usuario (principio de mínimo acceso).
- Validar y sanitizar entradas antes de persistir o procesar.
- Nunca exponer claves privadas en frontend (`service_role`, API keys, etc.).

---

## 5) Regla de npm (obligatoria)

- **Usar `npm` como gestor de paquetes oficial del proyecto.**
- No mezclar lockfiles ni gestores:
  - Permitido: `package-lock.json`
  - No permitido: `yarn.lock`, `pnpm-lock.yaml`, `bun.lockb`

Scripts actuales del proyecto:
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run test`
- `npm run test:watch`
- `npm run test:coverage`
- `npm run lint`
- `npm run format`

Antes de abrir PR, ejecutar como mínimo:
- `npm ci`
- `npm run lint`
- `npm run test`
- `npm run build`

---

## 6) Configuración y entorno

Variables esperadas:
- Frontend (públicas):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Backend IA (`api/chat.ts`):
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
  - `OPENAI_MAX_OUTPUT_TOKENS`
  - `OPENAI_MAX_MESSAGE_CHARS`
  - `OPENAI_MAX_NOTE_CHARS`

Reglas:
- Si Supabase no está configurado, mantener funcionamiento por fallback local.
- No romper compatibilidad con `localStorage` salvo cambio explícito de arquitectura.

---

## 7) Definición de Done (DoD)
Una tarea está terminada cuando:
1. Cumple arquitectura limpia y separación de capas.
2. Incluye pruebas adecuadas y en verde.
3. Pasa `lint`/`build`/`test` sin errores.
4. Mantiene o mejora legibilidad, seguridad y privacidad.
5. Documentación y contratos actualizados.
6. No introduce acoplamientos directos UI ↔ infraestructura externa.

---

## 8) Convención para agentes
- No hacer cambios masivos sin justificación.
- Explicar decisiones técnicas de forma breve en el PR.
- Priorizar mantenibilidad sobre atajos.
- Si una decisión rompe estas reglas, documentar motivo y plan de mitigación.
- No modificar archivos fuera del alcance de la tarea solicitada.
- Al actualizar documentación, reflejar el estado real del código, no el estado deseado.
