import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../../App'

describe('App AI integration', () => {
  it('crea nota desde instrucción natural usando IA mockeada', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Comando del asistente'), 'Crea una nota sobre TypeScript')
    await user.click(screen.getByRole('button', { name: 'Enviar comando' }))

    expect(screen.getByText(/Nota: TypeScript/i)).toBeInTheDocument()
  })
})
