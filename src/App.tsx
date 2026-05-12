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

const aiService =
  import.meta.env.MODE === 'test' ? new MockAiAssistantService() : new RemoteAiAssistantService()
const notesRepository = createNotesRepository()
const themeKey = 'ai-notes-theme'
const onboardingKey = 'ai-notes-onboarding-seen'

type MobilePanel = 'notes' | 'editor'

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [messagesByNote, setMessagesByNote] = useState<Record<string, ChatMessage[]>>({})
  const [chatInputsByNote, setChatInputsByNote] = useState<Record<string, string>>({})
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isLoadingNotes, setIsLoadingNotes] = useState(true)
  const [notesError, setNotesError] = useState<string | null>(null)
  const [storageMode, setStorageMode] = useState<'supabase' | 'localStorage'>('localStorage')
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  )
  const hasHydratedTheme = useRef(false)
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem(onboardingKey) !== 'true'
  )
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('notes')
  const [savedSnapshots, setSavedSnapshots] = useState<Record<string, string>>({})

  const serializeNote = (note: Note) =>
    JSON.stringify({
      title: note.title,
      content: note.content,
      category: note.category,
      date: note.date,
    })

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoadingNotes(true)
      setNotesError(null)
      try {
        const { notes: loadedNotes, mode } = await notesRepository.load()
        setNotes(loadedNotes)
        setSavedSnapshots(
          Object.fromEntries(loadedNotes.map((note) => [note.id, serializeNote(note)]))
        )
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
  const activeMessages = selectedId ? (messagesByNote[selectedId] ?? []) : []
  const activeChatInput = selectedId ? (chatInputsByNote[selectedId] ?? '') : ''
  const recentNotes = filteredNotes.slice(0, 6)
  const hasNotes = notes.length > 0

  const upsertNote = (note: Note) => {
    setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)))
  }

  const saveSelectedNote = () => {
    if (!selectedNote) return
    const next = { ...selectedNote, updatedAt: new Date().toISOString() }
    setNotes((prev) => prev.map((n) => (n.id === next.id ? next : n)))
    void notesRepository
      .update(next)
      .then(({ mode }) => {
        setStorageMode(mode)
        setSavedSnapshots((prev) => ({ ...prev, [next.id]: serializeNote(next) }))
        toast.success('Note updated')
      })
      .catch(() => {
        toast.error('Error saving note')
      })
  }

  const createNote = (seed?: Partial<NoteDraft>) => {
    const note = createNoteFromDraft(seed)
    setNotes((prev) => [note, ...prev])
    setSavedSnapshots((prev) => ({ ...prev, [note.id]: serializeNote(note) }))
    setSelectedId(note.id)
    setMobilePanel('editor')
    void Promise.resolve(notesRepository.create(note))
      .then((result) => {
        if (result?.mode) setStorageMode(result.mode)
        toast.success('Note created')
      })
      .catch(() => toast.error('Error saving note'))
    return note
  }

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    setSavedSnapshots((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setMessagesByNote((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setChatInputsByNote((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
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
    if (!selectedNote) {
      toast.error('Selecciona o crea una nota para usar el asistente.')
      return
    }
    if (!activeChatInput.trim() || isChatLoading) return
    const currentInput = activeChatInput
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: currentInput,
    }
    setMessagesByNote((prev) => ({
      ...prev,
      [selectedNote.id]: [...(prev[selectedNote.id] ?? []), userMessage],
    }))
    setChatInputsByNote((prev) => ({ ...prev, [selectedNote.id]: '' }))
    setIsChatLoading(true)

    try {
      const aiResponse = await aiService.runInstruction(currentInput, {
        selectedNoteTitle: selectedNote.title,
        selectedNoteContent: selectedNote.content,
        categories: ['General', 'Trabajo', 'Estudio', 'Ideas', 'Personal'],
      })

      let assistantText = 'Accion completada.'

      if (aiResponse.action === 'create_note') {
        createNote({
          title: aiResponse.title,
          content: aiResponse.content,
          category: aiResponse.category,
        })
        assistantText = `He creado la nota "${aiResponse.title}".`
      }

      if (aiResponse.action === 'edit_note') {
        const updatedNote = {
          ...selectedNote,
          ...(aiResponse.title ? { title: aiResponse.title } : {}),
          ...(aiResponse.content ? { content: aiResponse.content } : {}),
          ...(aiResponse.category ? { category: aiResponse.category } : {}),
        }
        upsertNote(updatedNote)
        assistantText = 'He actualizado la nota seleccionada.'
      }

      if (aiResponse.action === 'summarize_note') assistantText = `Resumen:\n${aiResponse.summary}`
      if (aiResponse.action === 'convert_to_tasks')
        assistantText = `Tareas:\n${aiResponse.tasks.map((task) => `- [ ] ${task}`).join('\n')}`
      if (aiResponse.action === 'suggest_title')
        assistantText = `Titulo sugerido: ${aiResponse.title}`
      if (aiResponse.action === 'unknown') assistantText = aiResponse.message
      if (aiResponse.action === 'classify_note')
        assistantText = `Categoria sugerida: ${aiResponse.category}`

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantText,
      }
      setMessagesByNote((prev) => ({
        ...prev,
        [selectedNote.id]: [...(prev[selectedNote.id] ?? []), assistantMessage],
      }))
      toast.success('AI response generated')
    } catch {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'No he podido conectar con el asistente IA. Revisa OPENAI_API_KEY y /api/chat.',
      }
      setMessagesByNote((prev) => ({
        ...prev,
        [selectedNote.id]: [...(prev[selectedNote.id] ?? []), assistantMessage],
      }))
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
    const note = createNote()
    setChatInputsByNote((prev) => ({ ...prev, [note.id]: prev[note.id] ?? '' }))
  }

  const hasUnsavedChanges = selectedNote
    ? savedSnapshots[selectedNote.id] !== serializeNote(selectedNote)
    : false

  return (
    <main className="min-h-screen bg-slate-300 dark:bg-slate-950 transition-colors duration-300">
      <Toaster richColors position="top-right" />
      {showOnboarding ? (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm grid place-items-center p-4">
          <div className="card-ui p-6 max-w-lg w-full">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Welcome to AI Notes Assistant
            </h2>
            <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>1. Create or write a note</li>
              <li>2. Ask AI to summarize, improve or organize it</li>
              <li>3. Save everything automatically with Supabase</li>
            </ol>
            <button
              className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-slate-100 font-medium hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300 transition-colors"
              onClick={closeOnboarding}
            >
              Start
            </button>
          </div>
        </div>
      ) : null}
      <header className="border-b border-slate-200 dark:border-slate-800 p-4 bg-slate-300 dark:bg-slate-950 transition-colors duration-300">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              AI Notes Assistant
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Gestion de notas + asistente IA con respuestas estructuradas.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Persistencia activa:{' '}
              {storageMode === 'supabase' ? 'Supabase' : 'localStorage (fallback)'}
            </p>
            {isLoadingNotes ? (
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Cargando notas...</p>
            ) : null}
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
          <button
            onClick={startAiNoteFlow}
            className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300 transition-colors"
          >
            Crear nota
          </button>
        </div>
      </header>
      <div
        className={`min-h-[calc(100vh-120px)] bg-slate-300 dark:bg-slate-950 transition-colors duration-300 md:flex md:flex-row ${
          hasNotes
            ? 'xl:grid xl:grid-cols-[20rem_minmax(0,1100px)] xl:justify-center'
            : 'xl:flex xl:justify-center'
        }`}
      >
        {hasNotes ? (
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
            <section className="p-4 sm:p-6 space-y-4">
              <NoteEditor
                note={selectedNote}
                onChange={upsertNote}
                onSave={saveSelectedNote}
                onBack={() => setSelectedId(null)}
                hasUnsavedChanges={hasUnsavedChanges}
              />
              <ChatPanel
                messages={activeMessages}
                value={activeChatInput}
                isLoading={isChatLoading}
                onChange={(value) =>
                  setChatInputsByNote((prev) => ({ ...prev, [selectedNote.id]: value }))
                }
                onSend={sendCommand}
              />
            </section>
          ) : (
            <section className="p-4 sm:p-6 h-full">
              <div className="h-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm p-5 sm:p-6">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Workspace
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    No hay una nota abierta
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Selecciona una nota existente o crea una nueva desde aqui para empezar a
                    trabajar.
                  </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 p-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Notas existentes
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Acceso rapido a tus notas mas recientes.
                    </p>
                    <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto pr-1">
                      {isLoadingNotes ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Cargando notas...
                        </p>
                      ) : recentNotes.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Aun no tienes notas creadas.
                        </p>
                      ) : (
                        recentNotes.map((note) => (
                          <button
                            key={note.id}
                            onClick={() => setSelectedId(note.id)}
                            className="w-full text-left rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                          >
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {note.title || 'Sin titulo'}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                              {note.category} • {note.date || 'Sin fecha'}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </article>
                  <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 p-4 flex flex-col">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Crear nueva nota
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Elige tu flujo de trabajo y empieza en segundos.
                    </p>
                    <div className="mt-4 space-y-3">
                      <button
                        onClick={startAiNoteFlow}
                        className="w-full rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300 transition-colors"
                      >
                        Crear nota
                      </button>
                    </div>
                    <div className="mt-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-3 text-xs text-slate-600 dark:text-slate-300">
                      Consejo: al abrir una nota, el asistente aparece debajo del editor y solo usa
                      el contenido de esa nota.
                    </div>
                  </article>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}

export default App
