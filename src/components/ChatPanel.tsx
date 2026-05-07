import type { ChatMessage } from '../domain/chat'

interface ChatPanelProps {
  messages: ChatMessage[]
  value: string
  onChange: (value: string) => void
  onSend: () => void
}

export const ChatPanel = ({ messages, value, onChange, onSend }: ChatPanelProps) => (
  <section className="w-full xl:w-96 border-l border-slate-800 bg-slate-900 p-4 flex flex-col">
    <h2 className="text-slate-100 font-semibold mb-3">Asistente IA (simulado)</h2>
    <div className="flex-1 space-y-2 overflow-y-auto pr-1">
      {messages.map((message) => (
        <div key={message.id} className={`rounded-lg p-3 text-sm ${message.role === 'user' ? 'bg-cyan-500/15 text-cyan-100' : 'bg-slate-800 text-slate-100'}`}>
          {message.content}
        </div>
      ))}
    </div>
    <div className="mt-3 space-y-2">
      <textarea
        aria-label="Comando del asistente"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder='Ej: "crea una nota sobre arquitectura limpia"'
        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-100"
      />
      <button aria-label="Enviar comando" onClick={onSend} className="w-full rounded-lg bg-indigo-500 p-2 font-medium text-white hover:bg-indigo-400">Enviar</button>
    </div>
  </section>
)
