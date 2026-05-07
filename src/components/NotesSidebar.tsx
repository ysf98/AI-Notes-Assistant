import type { Note } from '../domain/note'

interface NotesSidebarProps {
  notes: Note[]
  selectedId: string | null
  query: string
  onQueryChange: (value: string) => void
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
}

export const NotesSidebar = ({ notes, selectedId, query, onQueryChange, onSelect, onCreate, onDelete }: NotesSidebarProps) => (
  <aside className="w-full lg:w-80 bg-slate-900 border-r border-slate-800 p-4 space-y-4">
    <button onClick={onCreate} className="w-full rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-400">
      + Nueva nota
    </button>
    <input
      value={query}
      onChange={(e) => onQueryChange(e.target.value)}
      placeholder="Buscar notas..."
      className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm text-slate-100"
    />
    <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
      {notes.map((note) => (
        <article
          key={note.id}
          className={`rounded-lg p-3 border cursor-pointer ${selectedId === note.id ? 'border-cyan-400 bg-slate-800' : 'border-slate-700 bg-slate-900/50'}`}
          onClick={() => onSelect(note.id)}
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-100 truncate">{note.title || 'Sin título'}</h3>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(note.id)
              }}
              className="text-xs text-rose-300 hover:text-rose-200"
            >
              Borrar
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">{note.category} • {note.date || 'Sin fecha'}</p>
        </article>
      ))}
    </div>
  </aside>
)
