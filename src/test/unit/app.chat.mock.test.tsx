import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../application/chatCommandInterpreter', () => ({
  interpretCommand: vi.fn(() => ({ type: 'message', message: 'Respuesta mock' })),
}))

import App from '../../App'

describe('chatbot mocked', () => {
  it('usa función mock sin llamadas reales', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText('Comando del asistente'), 'resume esta nota')
    await user.click(screen.getByRole('button', { name: 'Enviar comando' }))
    expect(screen.getByText('Respuesta mock')).toBeInTheDocument()
  })
})
