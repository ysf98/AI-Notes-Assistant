import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import App from '../../App'

describe('chatbot mocked', () => {
  it('usa asistente mock sin llamadas reales', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Comando del asistente'), 'resume esta nota')
    await user.click(screen.getByRole('button', { name: 'Enviar comando' }))

    expect(screen.getByText(/Resumen:/)).toBeInTheDocument()
  })
})
