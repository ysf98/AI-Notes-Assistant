import type { Note } from '../domain/note'

interface NotesSidebarProps {
  notes: Note[]
  selectedId: string | null
  query: string
  isLoading: boolean
  onQueryChange: (value: string) => void
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
  onClearSearch: () => void
}

const NotesSkeleton = () => (
  <div className="space-y-2 animate-pulse">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
        <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded mt-2" />
      </div>
    ))}
  </div>
)

export const NotesSidebar = ({ notes, selectedId, query, isLoading, onQueryChange, onSelect, onCreate, onDelete, onClearSearch }: NotesSidebarProps) => (
  <aside className="w-full lg:w-80 border-r border-slate-200 dark:border-slate-800 p-4 space-y-4 bg-slate-300 dark:bg-slate-950 transition-colors duration-300">
    <button
      aria-label="Nueva nota"
      onClick={onCreate}
      className="w-full rounded-lg bg-slate-800 px-4 py-2 font-medium text-slate-100 hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300 transition-all duration-200 active:scale-[0.99]"
    >
      + Nueva nota
    </button>
    <input
      aria-label="Buscar notas"
      value={query}
      onChange={(e) => onQueryChange(e.target.value)}
      placeholder="Buscar notas..."
      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-900 dark:text-slate-100"
    />
    <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
      {isLoading ? <NotesSkeleton /> : null}
      {!isLoading && notes.length === 0 && !query ? (
        <div className="card-ui p-4 text-sm text-slate-600 dark:text-slate-300">
          <p className="font-medium text-slate-900 dark:text-slate-100">No notes yet</p>
          <p className="mt-1">Create your first note</p>
        </div>
      ) : null}
      {!isLoading && notes.length === 0 && query ? (
        <div className="card-ui p-4 text-sm text-slate-600 dark:text-slate-300">
          <p className="font-medium text-slate-900 dark:text-slate-100">No results found</p>
          <button className="mt-2 text-slate-700 dark:text-slate-300 hover:underline" onClick={onClearSearch}>
            Clear search
          </button>
        </div>
      ) : null}
      {!isLoading &&
        notes.map((note) => (
          <article
            key={note.id}
            className={`rounded-lg p-3 border cursor-pointer transition-all duration-200 ${
              selectedId === note.id
                ? 'border-slate-400 bg-slate-200 dark:border-slate-500 dark:bg-slate-800'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400'
            }`}
            onClick={() => onSelect(note.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{note.title || 'Sin titulo'}</h3>
              <button
                aria-label={`Borrar ${note.title || note.id}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(note.id)
                }}
                className="text-xs text-rose-500 hover:text-rose-400"
              >
                Borrar
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {note.category} • {note.date || 'Sin fecha'}
            </p>
          </article>
        ))}
    </div>
  </aside>
)
