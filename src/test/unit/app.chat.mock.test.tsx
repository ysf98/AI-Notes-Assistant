import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import App from '../../App'

describe('chatbot mocked', () => {
  it('usa asistente mock sin llamadas reales', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Crear nota manual' }))
    await user.type(screen.getByLabelText('Contenido'), 'Texto de prueba para resumir.')
    const chatInput = screen.getByLabelText('Comando del asistente')
    await user.type(chatInput, 'resume la nota actual')
    await user.click(screen.getByRole('button', { name: 'Enviar comando' }))

    expect(screen.getByText(/Resumen:/)).toBeInTheDocument()
  })
})
