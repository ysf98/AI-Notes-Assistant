import { useEffect, useMemo, useState } from 'react'
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
    localStorage.setItem(themeKey, theme)
  }, [theme])

  const filteredNotes = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return notes
    return notes.filter((n) => [n.title, n.content, n.category].join(' ').toLowerCase().includes(q))
  }, [notes, query])

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null

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

  return (
    <main className="min-h-screen transition-colors duration-300">
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
            <button className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-slate-950 font-medium hover:bg-cyan-400" onClick={closeOnboarding}>
              Start
            </button>
          </div>
        </div>
      ) : null}
      <header className="border-b border-slate-200 dark:border-slate-800 p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">AI Notes Assistant</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gestion de notas + asistente IA con respuestas estructuradas.</p>
            <p className="text-xs text-slate-500 mt-1">Persistencia activa: {storageMode === 'supabase' ? 'Supabase' : 'localStorage (fallback)'}</p>
            {isLoadingNotes ? <p className="text-xs text-cyan-600 dark:text-cyan-300 mt-1">Cargando notas...</p> : null}
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
        <div className="mt-3 flex md:hidden rounded-lg border border-slate-300 dark:border-slate-700 p-1 gap-1 bg-white dark:bg-slate-900 w-full">
          {(['notes', 'editor', 'chat'] as const).map((panel) => (
            <button
              key={panel}
              onClick={() => setMobilePanel(panel)}
              className={`flex-1 rounded-md px-2 py-1 text-sm transition-colors ${mobilePanel === panel ? 'bg-cyan-500 text-slate-950 font-medium' : 'text-slate-600 dark:text-slate-300'}`}
            >
              {panel === 'notes' ? 'Notes' : panel === 'editor' ? 'Editor' : 'AI'}
            </button>
          ))}
        </div>
      </header>
      <div className="md:flex md:flex-row xl:grid xl:grid-cols-[20rem_1fr_24rem] min-h-[calc(100vh-120px)]">
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
        <div className={`${mobilePanel === 'editor' ? 'block' : 'hidden'} md:block`}>
          <NoteEditor note={selectedNote} onChange={upsertNote} />
        </div>
        <div className={`${mobilePanel === 'chat' ? 'block' : 'hidden'} md:block`}>
          <ChatPanel messages={messages} value={chatInput} isLoading={isChatLoading} onChange={setChatInput} onSend={sendCommand} />
        </div>
      </div>
    </main>
  )
}

export default App
