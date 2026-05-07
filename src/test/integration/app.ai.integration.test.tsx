import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../../App'

describe('App AI integration', () => {
  it('crea nota desde instruccion natural usando IA mockeada', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Comando del asistente'), 'Crea una nota sobre TypeScript')
    await user.click(screen.getByRole('button', { name: 'Enviar comando' }))

    expect(screen.getAllByText(/Nota: TypeScript/i).length).toBeGreaterThan(0)
  })

  it('edita nota seleccionada desde instruccion natural usando IA mockeada', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Comando del asistente'), 'Edita esta nota')
    await user.click(screen.getByRole('button', { name: 'Enviar comando' }))

    expect(screen.getByDisplayValue(/\(editada\)$/i)).toBeInTheDocument()
    expect(screen.getByText(/He actualizado la nota seleccionada\./i)).toBeInTheDocument()
  })
})
