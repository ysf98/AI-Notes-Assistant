# AI Notes Assistant

Aplicación de notas con interfaz moderna y asistente de comandos IA simulado. Pensada para portfolio técnico con estructura mantenible, tipado estricto y base lista para evolucionar a producto real.

## ✨ Qué incluye

- Gestión completa de notas: crear, editar, borrar y buscar.
- Persistencia local con `localStorage`.
- Comandos simulados en chat:
  - `crea una nota sobre...`
  - `resume esta nota`
  - `convierte esta nota en tareas`
  - `clasifica mis notas`
- Datos mock iniciales para demo inmediata (sin backend).

## 🧱 Arquitectura de carpetas

```text
src/
├─ application/                 # Casos de uso y lógica de aplicación
│  └─ chatCommandInterpreter.ts
├─ components/                  # UI React (presentación)
│  ├─ ChatPanel.tsx
│  ├─ NoteEditor.tsx
│  └─ NotesSidebar.tsx
├─ domain/                      # Entidades y tipos de dominio
│  ├─ chat.ts
│  └─ note.ts
├─ infrastructure/              # Implementaciones técnicas (persistencia)
│  └─ persistence/
│     └─ localStorageNotesRepository.ts
├─ shared/
│  ├─ mocks/                    # Datos mock iniciales
│  │  └─ notes.ts
│  └─ types/                    # Tipos TypeScript compartidos
│     └─ app.ts
├─ App.tsx
└─ main.tsx

docs/
└─ screenshots/                 # Capturas para GitHub
```

## 🧪 Tipado TypeScript añadido

Además de los tipos de dominio (`Note`, `ChatMessage`), se incorporan tipos compartidos para mejorar mantenibilidad:

- `NoteDraft`: shape mínimo para crear notas desde comandos.
- `CommandResult`: unión discriminada para resultados del intérprete.
- `CreateCommandResult` y `MessageCommandResult` para flujos explícitos y seguros.

## 🚀 Instalación y ejecución

```bash
npm install
npm run dev
```

### Scripts

```bash
npm run dev      # entorno local
npm run build    # build de producción
npm run preview  # previsualización del build
```


## ✅ Testing

Este proyecto usa **Vitest + React Testing Library + user-event + jsdom**.

```bash
npm run test
npm run test:watch
npm run test:coverage
```

Cobertura objetivo:

- 80% funciones utilitarias
- 70% componentes principales
- 100% persistencia y parseo del chatbot

## 📸 Screenshots

Puedes añadir capturas en `docs/screenshots/` y enlazarlas aquí.

Ejemplo:

```md
![Vista principal](docs/screenshots/dashboard-main.png)
![Editor](docs/screenshots/note-editor.png)
![Chat comandos](docs/screenshots/chat-commands.png)
```

> Se incluye `docs/screenshots/README.md` con una guía rápida de nombres recomendados.

## 🗺️ Futuras mejoras (roadmap)

1. **OpenAI API**
   - Reemplazar comandos simulados por completions reales con prompt engineering.
   - Soporte de acciones estructuradas (crear/resumir/convertir tareas) vía responses JSON.

2. **Supabase**
   - Persistencia cloud de notas.
   - Sincronización multi-dispositivo en tiempo real.

3. **Autenticación**
   - Login con email/password y proveedores OAuth.
   - Protección de rutas y datos por usuario.

4. **Despliegue**
   - Pipeline CI/CD.
   - Deploy en Vercel/Netlify + variables de entorno seguras.

## 📄 Licencia

Uso educativo / portfolio.
