import { useEffect, useMemo, useState } from 'react'
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

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [isLoadingNotes, setIsLoadingNotes] = useState(true)
  const [notesError, setNotesError] = useState<string | null>(null)
  const [storageMode, setStorageMode] = useState<'supabase' | 'localStorage'>('localStorage')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: crypto.randomUUID(), role: 'assistant', content: 'Hola! Puedes pedirme crear, resumir, convertir, titular o clasificar notas.' },
  ])

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

  const filteredNotes = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return notes
    return notes.filter((n) => [n.title, n.content, n.category].join(' ').toLowerCase().includes(q))
  }, [notes, query])

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null

  const upsertNote = (note: Note) => {
    const next = { ...note, updatedAt: new Date().toISOString() }
    setNotes((prev) => prev.map((n) => (n.id === next.id ? next : n)))
    setNotesError(null)
    void notesRepository.update(next).then(({ mode }) => setStorageMode(mode)).catch(() => setNotesError('No se pudo guardar la edicion de la nota.'))
  }

  const createNote = (seed?: Partial<NoteDraft>) => {
    const note = createNoteFromDraft(seed)
    setNotes((prev) => [note, ...prev])
    setSelectedId(note.id)
    setNotesError(null)
    void notesRepository.create(note).then(({ mode }) => setStorageMode(mode)).catch(() => setNotesError('No se pudo crear la nota.'))
  }

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    setSelectedId((prev) => (prev === id ? null : prev))
    setNotesError(null)
    void notesRepository.remove(id).then(({ mode }) => setStorageMode(mode)).catch(() => setNotesError('No se pudo eliminar la nota.'))
  }

  const sendCommand = async () => {
    if (!chatInput.trim()) return
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: chatInput }

    try {
      const aiResponse = await aiService.runInstruction(chatInput, {
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
      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setChatInput('')
    } catch {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'No he podido conectar con el asistente IA. Revisa OPENAI_API_KEY y /api/chat.',
      }
      setMessages((prev) => [...prev, userMessage, assistantMessage])
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 p-4">
        <h1 className="text-2xl font-bold">AI Notes Assistant</h1>
        <p className="text-sm text-slate-400">Gestion de notas + asistente IA con respuestas estructuradas.</p>
        <p className="text-xs text-slate-500 mt-1">Persistencia activa: {storageMode === 'supabase' ? 'Supabase' : 'localStorage (fallback)'}</p>
        {isLoadingNotes ? <p className="text-xs text-cyan-300 mt-1">Cargando notas...</p> : null}
        {notesError ? <p className="text-xs text-rose-300 mt-1">{notesError}</p> : null}
      </header>
      <div className="flex flex-col lg:flex-row xl:grid xl:grid-cols-[20rem_1fr_24rem] min-h-[calc(100vh-82px)]">
        <NotesSidebar
          notes={filteredNotes}
          selectedId={selectedId}
          query={query}
          onQueryChange={setQuery}
          onSelect={setSelectedId}
          onCreate={() => createNote()}
          onDelete={deleteNote}
        />
        <NoteEditor note={selectedNote} onChange={upsertNote} />
        <ChatPanel messages={messages} value={chatInput} onChange={setChatInput} onSend={sendCommand} />
      </div>
    </main>
  )
}

export default App
