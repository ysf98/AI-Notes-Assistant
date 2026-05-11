import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const { repositoryMock } = vi.hoisted(() => ({
  repositoryMock: {
    load: vi.fn().mockResolvedValue({ notes: [], mode: 'supabase' as const }),
    create: vi.fn().mockResolvedValue({ mode: 'supabase' as const }),
    update: vi.fn().mockResolvedValue({ mode: 'supabase' as const }),
    remove: vi.fn().mockResolvedValue({ mode: 'supabase' as const }),
  },
}))

vi.mock('../../infrastructure/persistence/notesRepository', () => ({
  createNotesRepository: () => repositoryMock,
}))

import App from '../../App'

describe('chatbot persistence on repository', () => {
  it('guarda en repositorio cuando el chatbot crea una nota', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Crear con asistente IA' }))
    const chatInput = screen.getByLabelText('Comando del asistente')
    await user.clear(chatInput)
    await user.type(chatInput, 'Crea una nota sobre Supabase')
    await user.click(screen.getByRole('button', { name: 'Enviar comando' }))

    await waitFor(() => {
      expect(repositoryMock.create).toHaveBeenCalled()
    })
  })
})
