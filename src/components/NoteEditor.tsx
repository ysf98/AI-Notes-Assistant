import { categories, type Note } from '../domain/note'

interface NoteEditorProps {
  note: Note | null
  onChange: (next: Note) => void
}

export const NoteEditor = ({ note, onChange }: NoteEditorProps) => {
  if (!note) {
    return <section className="flex-1 grid place-items-center text-slate-400">Selecciona o crea una nota para comenzar.</section>
  }

  return (
    <section className="flex-1 p-6 space-y-4">
      <label className="sr-only" htmlFor="note-title">Título</label>
      <input
        id="note-title"
        aria-label="Título"
        value={note.title}
        onChange={(e) => onChange({ ...note, title: e.target.value })}
        placeholder="Título"
        className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-xl font-semibold text-slate-100"
      />
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="sr-only" htmlFor="note-category">Categoría</label>
        <select
          id="note-category"
          aria-label="Categoría"
          value={note.category}
          onChange={(e) => onChange({ ...note, category: e.target.value as Note['category'] })}
          className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-100"
        >
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="note-date">Fecha</label>
        <input
          id="note-date"
          aria-label="Fecha"
          type="date"
          value={note.date}
          onChange={(e) => onChange({ ...note, date: e.target.value })}
          className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-100"
        />
      </div>
      <label className="sr-only" htmlFor="note-content">Contenido</label>
      <textarea
        id="note-content"
        aria-label="Contenido"
        value={note.content}
        onChange={(e) => onChange({ ...note, content: e.target.value })}
        rows={16}
        placeholder="Escribe tu nota aquí..."
        className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-slate-100"
      />
    </section>
  )
}
