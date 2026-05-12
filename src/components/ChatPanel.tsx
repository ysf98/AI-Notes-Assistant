import type { ChatMessage } from '../domain/chat'

interface ChatPanelProps {
  messages: ChatMessage[]
  value: string
  isLoading: boolean
  onChange: (value: string) => void
  onSend: () => void
}

export const ChatPanel = ({ messages, value, isLoading, onChange, onSend }: ChatPanelProps) => (
  <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm p-4 flex flex-col">
    <div className="mb-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        Assistant
      </p>
      <h2 className="text-slate-900 dark:text-slate-100 font-semibold">Asistente IA</h2>
    </div>
    <div className="flex-1 space-y-2 overflow-y-auto pr-1">
      {messages.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 p-4 text-sm text-slate-600 dark:text-slate-300">
          <p className="font-medium text-slate-900 dark:text-slate-100">
            Todavia no hay conversacion
          </p>
          <p className="mt-1">
            Pide al asistente crear una nota, resumirla o convertirla en tareas.
          </p>
        </div>
      ) : null}
      {messages.map((message) => (
        <div
          key={message.id}
          className={`rounded-xl p-3 text-sm leading-relaxed transition-all duration-300 ${
            message.role === 'user'
              ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
          }`}
        >
          {message.content}
        </div>
      ))}
      {isLoading ? (
        <div className="rounded-xl p-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-pulse">
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
        placeholder=""
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 text-slate-900 dark:text-slate-100"
      />
      <button
        aria-label="Enviar comando"
        onClick={onSend}
        disabled={isLoading}
        className="w-full rounded-lg bg-slate-800 p-2 font-medium text-slate-100 hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300 disabled:opacity-60 transition-all duration-200"
      >
        {isLoading ? 'Generando...' : 'Enviar'}
      </button>
    </div>
  </section>
)
