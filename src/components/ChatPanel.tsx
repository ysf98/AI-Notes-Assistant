import type { ChatMessage } from '../domain/chat'

interface ChatPanelProps {
  messages: ChatMessage[]
  value: string
  isLoading: boolean
  onChange: (value: string) => void
  onSend: () => void
}

export const ChatPanel = ({ messages, value, isLoading, onChange, onSend }: ChatPanelProps) => (
  <section className="w-full xl:w-96 border-l border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/40 p-4 flex flex-col transition-all duration-300">
    <h2 className="text-slate-900 dark:text-slate-100 font-semibold mb-3">Asistente IA</h2>
    <div className="flex-1 space-y-2 overflow-y-auto pr-1">
      {messages.length === 0 ? (
        <div className="card-ui p-4 text-sm text-slate-600 dark:text-slate-300">
          <p className="font-medium text-slate-900 dark:text-slate-100">No conversation yet</p>
          <p className="mt-1">Ask AI to generate a note</p>
        </div>
      ) : null}
      {messages.map((message) => (
        <div
          key={message.id}
          className={`rounded-lg p-3 text-sm transition-all duration-300 ${
            message.role === 'user' ? 'bg-cyan-500/15 text-cyan-900 dark:text-cyan-100' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
          }`}
        >
          {message.content}
        </div>
      ))}
      {isLoading ? (
        <div className="rounded-lg p-3 text-sm bg-white dark:bg-slate-800 animate-pulse">
          <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded mt-2" />
        </div>
      ) : null}
    </div>
    <div className="mt-3 space-y-2">
      <textarea
        aria-label="Comando del asistente"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder='Ej: "crea una nota sobre arquitectura limpia"'
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 text-slate-900 dark:text-slate-100"
      />
      <button
        aria-label="Enviar comando"
        onClick={onSend}
        disabled={isLoading}
        className="w-full rounded-lg bg-indigo-500 p-2 font-medium text-white hover:bg-indigo-400 disabled:opacity-60 transition-all duration-200"
      >
        {isLoading ? 'Generando...' : 'Enviar'}
      </button>
    </div>
  </section>
)
