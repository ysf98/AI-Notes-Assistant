import { useEffect, useMemo, useState } from 'react'
import { ChatPanel } from './components/ChatPanel'
import { NoteEditor } from './components/NoteEditor'
import { NotesSidebar } from './components/NotesSidebar'
import type { ChatMessage } from './domain/chat'
import type { Note } from './domain/note'
import type { NoteDraft } from './shared/types/app'
import { createNoteFromDraft } from './shared/utils/noteFactory'
import { loadNotes, saveNotes } from './infrastructure/persistence/localStorageNotesRepository'
import { MockAiAssistantService } from './features/ai-assistant/mocks/MockAiAssistantService'
import { RemoteAiAssistantService } from './features/ai-assistant/infrastructure/RemoteAiAssistantService'

const aiService = import.meta.env.MODE === 'test' ? new MockAiAssistantService() : new RemoteAiAssistantService()

function App() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes())
  const [selectedId, setSelectedId] = useState<string | null>(notes[0]?.id ?? null)
  const [query, setQuery] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: crypto.randomUUID(), role: 'assistant', content: 'Hola 👋 Puedes pedirme crear, resumir, convertir, titular o clasificar notas.' },
  ])

  useEffect(() => {
    saveNotes(notes)
  }, [notes])

  const filteredNotes = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return notes
    return notes.filter((n) => [n.title, n.content, n.category].join(' ').toLowerCase().includes(q))
  }, [notes, query])

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null

  const upsertNote = (note: Note) => {
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...note, updatedAt: new Date().toISOString() } : n)))
  }

  const createNote = (seed?: Partial<NoteDraft>) => {
    const note = createNoteFromDraft(seed)
    setNotes((prev) => [note, ...prev])
    setSelectedId(note.id)
  }

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    setSelectedId((prev) => (prev === id ? null : prev))
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

      let assistantText = 'Acción completada.'

      if (aiResponse.action === 'create_note') {
        createNote({ title: aiResponse.title, content: aiResponse.content, category: aiResponse.category })
        assistantText = `He creado la nota "${aiResponse.title}".`
      }
      if (aiResponse.action === 'edit_note') {
        if (!selectedNote) {
          assistantText = 'Selecciona una nota antes de pedir una edición.'
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
      if (aiResponse.action === 'suggest_title') assistantText = `Título sugerido: ${aiResponse.title}`
      if (aiResponse.action === 'unknown') assistantText = aiResponse.message
      if (aiResponse.action === 'classify_note') assistantText = `Categoría sugerida: ${aiResponse.category}`

      const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: assistantText }
      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setChatInput('')
    } catch {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'No he podido conectar con el asistente IA. Revisa que el servidor tenga configurada OPENAI_API_KEY y que /api/chat responda.',
      }
      setMessages((prev) => [...prev, userMessage, assistantMessage])
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 p-4">
        <h1 className="text-2xl font-bold">AI Notes Assistant</h1>
        <p className="text-sm text-slate-400">Gestión de notas + asistente IA con respuestas estructuradas.</p>
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
