# AI Notes Assistant

Aplicación web de notas con asistente de comandos IA simulado, construida con **React + TypeScript + Vite + Tailwind CSS**, enfocada en arquitectura limpia y UI apta para portfolio.

## Stack tecnológico

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Persistencia en `localStorage` (sin backend)

## Funcionalidades

- Panel lateral con listado de notas.
- Editor principal con:
  - Título
  - Contenido
  - Categoría
  - Fecha
- CRUD completo:
  - Crear nota
  - Editar nota
  - Eliminar nota
  - Búsqueda en tiempo real
- Persistencia automática en `localStorage`.
- Panel de chatbot con interpretación de comandos simulados:
  - `crea una nota sobre...`
  - `resume esta nota`
  - `convierte esta nota en tareas`
  - `clasifica mis notas`

## Clean Architecture aplicada

Se organiza el código en capas:

- `src/domain`: entidades y tipos de negocio (`Note`, `ChatMessage`).
- `src/application`: casos de uso/lógica de aplicación (`chatCommandInterpreter`).
- `src/infrastructure`: persistencia y adaptadores (`localStorageNotesRepository`).
- `src/components`: capa de presentación (UI desacoplada por componentes).

## Instalación

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev      # desarrollo
npm run build    # build producción
npm run preview  # vista previa del build
```

## Próximas mejoras

- Integración real con LLM (OpenAI API) para comandos inteligentes.
- Sincronización en la nube y autenticación.
- Etiquetas avanzadas y filtros múltiples.
- Exportar notas (PDF/Markdown).
- Tests unitarios y e2e.
