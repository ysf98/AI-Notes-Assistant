# AGENTS.md

Guía para colaboradores humanos y agentes en **AI Notes Assistant**.

## 1) Propósito del proyecto
AI Notes Assistant es una aplicación de **notas + chatbot local** con foco en:
- Productividad personal (captura, búsqueda y organización de notas).
- Asistencia conversacional local (privacidad-first).
- Código mantenible y evolutivo.

---

## 2) Reglas de arquitectura (Clean Architecture)

### 2.1 Principios base
- Mantener separación estricta por capas:
  - **Dominio**: entidades, value objects, reglas de negocio puras.
  - **Aplicación**: casos de uso/orquestación (sin framework).
  - **Infraestructura**: persistencia, LLM local, filesystem, APIs externas.
  - **Interfaz** (UI/API): controladores, rutas, componentes de presentación.
- Las dependencias siempre apuntan hacia adentro (la capa externa depende de la interna, nunca al revés).
- No mezclar lógica de negocio en UI/controladores.
- Cada caso de uso debe tener una única responsabilidad y contratos explícitos (interfaces/puertos).

### 2.2 Reglas de diseño
- Preferir composición sobre herencia.
- Evitar singletons globales no controlados.
- Definir DTOs claros entre capas; no filtrar modelos de infraestructura al dominio.
- Todo acceso a IO (DB, red, disco, modelo local) debe estar abstraído detrás de puertos/adaptadores.
- Manejo de errores consistente: errores de dominio tipados, sin ocultar fallos críticos.

### 2.3 Estructura sugerida
> Ajustar nombres al stack real del repo, pero respetando el aislamiento.

- `src/domain/*`
- `src/application/*`
- `src/infrastructure/*`
- `src/interface/*` o `src/presentation/*`
- `tests/unit/*`, `tests/integration/*`, `tests/e2e/*`

---

## 3) Reglas de testing

### 3.1 Pirámide de pruebas
- **Unit tests** (mayoría): dominio y casos de uso aislados.
- **Integration tests**: adaptadores (DB, repositorios, proveedor LLM local, filesystem).
- **E2E tests**: flujos críticos de usuario (crear nota, buscar, conversar, vincular respuesta a nota).

### 3.2 Criterios mínimos
- Cada feature nueva debe incluir pruebas.
- Cada bugfix debe incluir al menos una prueba de regresión.
- No hacer merge si hay pruebas rotas.
- Evitar flaky tests: controlar seeds, tiempos y dependencias externas.

### 3.3 Buenas prácticas
- Doble A/Triple A (Arrange-Act-Assert) explícito.
- Nombres de tests descriptivos y orientados a comportamiento.
- Mockear solo bordes externos; no mockear lógica de dominio.
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
- Incluir contexto: problema, solución, trade-offs, riesgos.
- Actualizar documentación cuando cambie comportamiento visible.

### 4.3 Seguridad y privacidad
- No registrar secretos ni contenido sensible en logs.
- Proteger datos de notas del usuario (principio de mínimo acceso).
- Validar y sanitizar entradas antes de persistir o procesar.

---

## 5) Regla de npm (obligatoria)

- **Usar `npm` como gestor de paquetes oficial del proyecto.**
- No mezclar lockfiles ni gestores:
  - Permitido: `package-lock.json`
  - No permitido: `yarn.lock`, `pnpm-lock.yaml`, `bun.lockb`
- Scripts estándar esperados (si no existen, proponerlos en PR):
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `npm run dev`
- Antes de abrir PR, ejecutar como mínimo:
  - `npm ci`
  - `npm run lint`
  - `npm run test`
  - `npm run build`

---

## 6) Definición de Done (DoD)
Una tarea está terminada cuando:
1. Cumple arquitectura limpia y separación de capas.
2. Incluye pruebas adecuadas y passing.
3. Pasa lint/build/test sin errores.
4. Mantiene o mejora legibilidad, seguridad y privacidad.
5. Documentación y contratos actualizados.

---

## 7) Convención para agentes
- No hacer cambios masivos sin justificación.
- Explicar decisiones técnicas de forma breve en el PR.
- Priorizar mantenibilidad sobre atajos.
- Si una decisión rompe estas reglas, documentar motivo y plan de mitigación.
