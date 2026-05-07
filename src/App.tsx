import { useEffect, useMemo, useState } from 'react'
import { ChatPanel } from './components/ChatPanel'
import { NoteEditor } from './components/NoteEditor'
import { NotesSidebar } from './components/NotesSidebar'
import { interpretCommand } from './application/chatCommandInterpreter'
import type { ChatMessage } from './domain/chat'
import type { Note } from './domain/note'
import type { NoteDraft } from './shared/types/app'
import { loadNotes, saveNotes } from './infrastructure/persistence/localStorageNotesRepository'

const createEmptyNote = (seed?: Partial<NoteDraft>): Note => {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: '',
    content: '',
    category: 'General',
    date: now.slice(0, 10),
    createdAt: now,
    updatedAt: now,
    ...seed,
  }
}

function App() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes())
  const [selectedId, setSelectedId] = useState<string | null>(notes[0]?.id ?? null)
  const [query, setQuery] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: crypto.randomUUID(), role: 'assistant', content: 'Hola 👋 Puedes pedirme acciones sobre tus notas con comandos simulados.' },
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
    const note = createEmptyNote(seed)
    setNotes((prev) => [note, ...prev])
    setSelectedId(note.id)
  }

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    setSelectedId((prev) => (prev === id ? null : prev))
  }

  const sendCommand = () => {
    if (!chatInput.trim()) return
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: chatInput }
    const result = interpretCommand(chatInput, selectedNote, notes)

    if (result.type === 'create') createNote(result.payload)

    const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: result.message }
    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setChatInput('')
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 p-4">
        <h1 className="text-2xl font-bold">AI Notes Assistant</h1>
        <p className="text-sm text-slate-400">Gestión de notas + asistente IA simulado (sin backend).</p>
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
