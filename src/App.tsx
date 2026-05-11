import { useEffect, useMemo, useRef, useState } from 'react'
import { Toaster, toast } from 'sonner'
import { ChatPanel } from './components/ChatPanel'
import { NoteEditor } from './components/NoteEditor'
import { NotesSidebar } from './components/NotesSidebar'
import type { ChatMessage } from './domain/chat'
import type { Note } from './domain/note'
import type { NoteDraft } from './shared/types/app'
import { createNoteFromDraft } from './shared/utils/noteFactory'
import { MockAiAssistantService } from './features/ai-assistant/mocks/MockAiAssistantService'
import { RemoteAiAssistantService } from './features/ai-assistant/infrastructure/RemoteAiAssistantService'
import { createNotesRepository } from './infrastructure/persistence/notesRepository'

const aiService = import.meta.env.MODE === 'test' ? new MockAiAssistantService() : new RemoteAiAssistantService()
const notesRepository = createNotesRepository()
const themeKey = 'ai-notes-theme'
const onboardingKey = 'ai-notes-onboarding-seen'

type MobilePanel = 'notes' | 'editor' | 'chat'

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isLoadingNotes, setIsLoadingNotes] = useState(true)
  const [notesError, setNotesError] = useState<string | null>(null)
  const [storageMode, setStorageMode] = useState<'supabase' | 'localStorage'>('localStorage')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'))
  const hasHydratedTheme = useRef(false)
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem(onboardingKey) !== 'true')
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('notes')

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoadingNotes(true)
      setNotesError(null)
      try {
        const { notes: loadedNotes, mode } = await notesRepository.load()
        setNotes(loadedNotes)
        setSelectedId(loadedNotes[0]?.id ?? null)
        setStorageMode(mode)
      } catch {
        setNotesError('No se pudieron cargar las notas.')
      } finally {
        setIsLoadingNotes(false)
      }
    }
    void bootstrap()
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    if (!hasHydratedTheme.current) {
      hasHydratedTheme.current = true
      return
    }
    localStorage.setItem(themeKey, theme)
  }, [theme])

  useEffect(() => {
    if (localStorage.getItem(themeKey)) return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light')
    }
    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [])

  const filteredNotes = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return notes
    return notes.filter((n) => [n.title, n.content, n.category].join(' ').toLowerCase().includes(q))
  }, [notes, query])

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null
  const recentNotes = filteredNotes.slice(0, 6)
  const hasNotes = notes.length > 0
  const hasChatContext = messages.length > 0 || isChatLoading || chatInput.trim().length > 0 || mobilePanel === 'chat'
  const showNotesPanel = hasNotes
  const showChatPanel = hasChatContext

  const mobilePanels = [
    ...(showNotesPanel ? ([{ value: 'notes', label: 'Notes' }] as const) : []),
    { value: 'editor' as const, label: 'Editor' },
    ...(showChatPanel ? ([{ value: 'chat', label: 'Assistant' }] as const) : []),
  ]

  useEffect(() => {
    const isCurrentPanelAvailable = mobilePanels.some((panel) => panel.value === mobilePanel)
    if (!isCurrentPanelAvailable) {
      setMobilePanel('editor')
    }
  }, [mobilePanel, mobilePanels])

  const upsertNote = (note: Note) => {
    const next = { ...note, updatedAt: new Date().toISOString() }
    setNotes((prev) => prev.map((n) => (n.id === next.id ? next : n)))
    void notesRepository
      .update(next)
      .then(({ mode }) => {
        setStorageMode(mode)
        toast.success('Note updated')
      })
      .catch(() => {
        toast.error('Error saving note')
      })
  }

  const createNote = (seed?: Partial<NoteDraft>) => {
    const note = createNoteFromDraft(seed)
    setNotes((prev) => [note, ...prev])
    setSelectedId(note.id)
    setMobilePanel('editor')
    void notesRepository
      .create(note)
      .then(({ mode }) => {
        setStorageMode(mode)
        toast.success('Note created')
      })
      .catch(() => toast.error('Error saving note'))
  }

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    setSelectedId((prev) => (prev === id ? null : prev))
    void notesRepository
      .remove(id)
      .then(({ mode }) => {
        setStorageMode(mode)
        toast.success('Note deleted')
      })
      .catch(() => toast.error('Error saving note'))
  }

  const sendCommand = async () => {
    if (!chatInput.trim() || isChatLoading) return
    const currentInput = chatInput
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: currentInput }
    setMessages((prev) => [...prev, userMessage])
    setChatInput('')
    setIsChatLoading(true)

    try {
      const aiResponse = await aiService.runInstruction(currentInput, {
        selectedNoteTitle: selectedNote?.title,
        selectedNoteContent: selectedNote?.content,
        categories: ['General', 'Trabajo', 'Estudio', 'Ideas', 'Personal'],
      })

      let assistantText = 'Accion completada.'

      if (aiResponse.action === 'create_note') {
        createNote({ title: aiResponse.title, content: aiResponse.content, category: aiResponse.category })
        assistantText = `He creado la nota "${aiResponse.title}".`
      }
      if (aiResponse.action === 'edit_note') {
        if (!selectedNote) {
          assistantText = 'Selecciona una nota antes de pedir una edicion.'
        } else {
          const updatedNote = {
            ...selectedNote,
            ...(aiResponse.title ? { title: aiResponse.title } : {}),
            ...(aiResponse.content ? { content: aiResponse.content } : {}),
            ...(aiResponse.category ? { category: aiResponse.category } : {}),
          }
          upsertNote(updatedNote)
          assistantText = 'He actualizado la nota seleccionada.'
        }
      }

      if (aiResponse.action === 'summarize_note') assistantText = `Resumen:\n${aiResponse.summary}`
      if (aiResponse.action === 'convert_to_tasks') assistantText = `Tareas:\n${aiResponse.tasks.map((task) => `- [ ] ${task}`).join('\n')}`
      if (aiResponse.action === 'suggest_title') assistantText = `Titulo sugerido: ${aiResponse.title}`
      if (aiResponse.action === 'unknown') assistantText = aiResponse.message
      if (aiResponse.action === 'classify_note') assistantText = `Categoria sugerida: ${aiResponse.category}`

      const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: assistantText }
      setMessages((prev) => [...prev, assistantMessage])
      toast.success('AI response generated')
    } catch {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'No he podido conectar con el asistente IA. Revisa OPENAI_API_KEY y /api/chat.',
      }
      setMessages((prev) => [...prev, assistantMessage])
      toast.error('Error generating AI response')
    } finally {
      setIsChatLoading(false)
    }
  }

  const closeOnboarding = () => {
    setShowOnboarding(false)
    localStorage.setItem(onboardingKey, 'true')
  }

  const startAiNoteFlow = () => {
    setMobilePanel('chat')
    setChatInput((prev) => (prev.trim() ? prev : 'Crea una nota profesional sobre '))
  }

  return (
    <main className="min-h-screen bg-slate-300 dark:bg-slate-950 transition-colors duration-300">
      <Toaster richColors position="top-right" />
      {showOnboarding ? (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm grid place-items-center p-4">
          <div className="card-ui p-6 max-w-lg w-full">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Welcome to AI Notes Assistant</h2>
            <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>1. Create or write a note</li>
              <li>2. Ask AI to summarize, improve or organize it</li>
              <li>3. Save everything automatically with Supabase</li>
            </ol>
            <button className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-slate-100 font-medium hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300 transition-colors" onClick={closeOnboarding}>
              Start
            </button>
          </div>
        </div>
      ) : null}
      <header className="border-b border-slate-200 dark:border-slate-800 p-4 bg-slate-300 dark:bg-slate-950 transition-colors duration-300">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">AI Notes Assistant</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gestion de notas + asistente IA con respuestas estructuradas.</p>
            <p className="text-xs text-slate-500 mt-1">Persistencia activa: {storageMode === 'supabase' ? 'Supabase' : 'localStorage (fallback)'}</p>
            {isLoadingNotes ? <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Cargando notas...</p> : null}
            {notesError ? <p className="text-xs text-rose-500 mt-1">Error loading notes</p> : null}
          </div>
          <button
            aria-label="Toggle dark mode"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
        <div className="mt-3 md:hidden">
          <label htmlFor="mobile-view" className="sr-only">
            Vista en móvil
          </label>
          <select
            id="mobile-view"
            value={mobilePanel}
            onChange={(e) => setMobilePanel(e.target.value as MobilePanel)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
          >
            {mobilePanels.map((panel) => (
              <option key={panel.value} value={panel.value}>
                {panel.label}
              </option>
            ))}
          </select>
        </div>
      </header>
      <div
        className={`min-h-[calc(100vh-120px)] bg-slate-300 dark:bg-slate-950 transition-colors duration-300 md:flex md:flex-row ${
          showNotesPanel && showChatPanel
            ? 'xl:grid xl:grid-cols-[20rem_1fr_24rem]'
            : showNotesPanel
            ? 'xl:grid xl:grid-cols-[20rem_1fr]'
            : showChatPanel
            ? 'xl:grid xl:grid-cols-[1fr_24rem]'
            : ''
        }`}
      >
        {showNotesPanel ? (
          <div className={`${mobilePanel === 'notes' ? 'block' : 'hidden'} md:block`}>
          <NotesSidebar
            notes={filteredNotes}
            selectedId={selectedId}
            query={query}
            isLoading={isLoadingNotes}
            onQueryChange={setQuery}
            onSelect={(id) => {
              setSelectedId(id)
              setMobilePanel('editor')
            }}
            onCreate={() => createNote()}
            onDelete={deleteNote}
            onClearSearch={() => setQuery('')}
          />
          </div>
        ) : null}
        <div className={`${mobilePanel === 'editor' ? 'block' : 'hidden'} md:block`}>
          {selectedNote ? (
            <NoteEditor note={selectedNote} onChange={upsertNote} />
          ) : (
            <section className="p-4 sm:p-6 h-full">
              <div className="h-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm p-5 sm:p-6">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Workspace</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">No hay una nota abierta</h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Selecciona una nota existente o crea una nueva desde aquí para empezar a trabajar.</p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 p-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notas existentes</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Acceso rápido a tus notas más recientes.</p>
                    <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto pr-1">
                      {isLoadingNotes ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Cargando notas...</p>
                      ) : recentNotes.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Aún no tienes notas creadas.</p>
                      ) : (
                        recentNotes.map((note) => (
                          <button
                            key={note.id}
                            onClick={() => setSelectedId(note.id)}
                            className="w-full text-left rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                          >
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{note.title || 'Sin titulo'}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                              {note.category} • {note.date || 'Sin fecha'}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </article>
                  <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 p-4 flex flex-col">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Crear nueva nota</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Elige tu flujo de trabajo y empieza en segundos.</p>
                    <div className="mt-4 space-y-3">
                      <button
                        onClick={() => createNote()}
                        className="w-full rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300 transition-colors"
                      >
                        Crear nota manual
                      </button>
                      <button
                        onClick={startAiNoteFlow}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Crear con asistente IA
                      </button>
                    </div>
                    <div className="mt-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-3 text-xs text-slate-600 dark:text-slate-300">
                      Consejo: también puedes seleccionar una nota desde la columna izquierda y pedir al asistente que la resuma, mejore o convierta en tareas.
                    </div>
                  </article>
                </div>
              </div>
            </section>
          )}
        </div>
        {showChatPanel ? (
          <div className={`${mobilePanel === 'chat' ? 'block' : 'hidden'} md:block`}>
            <ChatPanel messages={messages} value={chatInput} isLoading={isChatLoading} onChange={setChatInput} onSend={sendCommand} />
          </div>
        ) : null}
      </div>
    </main>
  )
}

export default App
