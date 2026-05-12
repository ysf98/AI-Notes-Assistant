import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../../App'

describe('App AI integration', () => {
  it('crea nota desde instruccion natural usando IA mockeada', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole('button', { name: 'Crear nota' })[0])
    const chatInput = screen.getByLabelText('Comando del asistente')
    await user.type(chatInput, 'Crea una nota sobre TypeScript')
    await user.click(screen.getByRole('button', { name: 'Enviar comando' }))

    expect(screen.getByText(/AI response generated/i)).toBeInTheDocument()
  })

  it('edita nota seleccionada desde instruccion natural usando IA mockeada', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole('button', { name: 'Crear nota' })[0])
    await user.type(screen.getByLabelText(/Titulo/i), 'Base')
    const chatInput = screen.getByLabelText('Comando del asistente')
    await user.type(chatInput, 'Edita esta nota')
    await user.click(screen.getByRole('button', { name: 'Enviar comando' }))

    expect(screen.getByText(/He actualizado la nota seleccionada\./i)).toBeInTheDocument()
  })
})
