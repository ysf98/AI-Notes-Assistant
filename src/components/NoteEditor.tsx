import { categories, type Note } from '../domain/note'

interface NoteEditorProps {
  note: Note | null
  onChange: (next: Note) => void
}

export const NoteEditor = ({ note, onChange }: NoteEditorProps) => {
  if (!note) {
    return (
      <section className="flex-1 grid place-items-center p-6">
        <div className="card-ui p-6 max-w-md text-center">
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">No note selected</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Create your first note or ask AI to generate a note.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="flex-1 p-4 sm:p-6 space-y-4 transition-all duration-300">
      <label className="sr-only" htmlFor="note-title">
        Titulo
      </label>
      <input
        id="note-title"
        aria-label="Titulo"
        value={note.title}
        onChange={(e) => onChange({ ...note, title: e.target.value })}
        placeholder="Titulo"
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xl font-semibold text-slate-900 dark:text-slate-100"
      />
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="sr-only" htmlFor="note-category">
          Categoria
        </label>
        <select
          id="note-category"
          aria-label="Categoria"
          value={note.category}
          onChange={(e) => onChange({ ...note, category: e.target.value as Note['category'] })}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-slate-100"
        >
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="note-date">
          Fecha
        </label>
        <input
          id="note-date"
          aria-label="Fecha"
          type="date"
          value={note.date}
          onChange={(e) => onChange({ ...note, date: e.target.value })}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-slate-100"
        />
      </div>
      <label className="sr-only" htmlFor="note-content">
        Contenido
      </label>
      <textarea
        id="note-content"
        aria-label="Contenido"
        value={note.content}
        onChange={(e) => onChange({ ...note, content: e.target.value })}
        rows={16}
        placeholder="Escribe tu nota aqui..."
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-slate-100"
      />
    </section>
  )
}
