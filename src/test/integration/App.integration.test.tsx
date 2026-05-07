import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../../App'

describe('App integration', () => {
  it('crea nota manualmente, la edita y la busca', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Nueva nota' }))
    await user.type(screen.getByLabelText('Título'), 'Nota manual')
    await user.type(screen.getByLabelText('Contenido'), 'Contenido de prueba')

    await user.clear(screen.getByLabelText('Buscar notas'))
    await user.type(screen.getByLabelText('Buscar notas'), 'manual')
    expect(screen.getByText('Nota manual')).toBeInTheDocument()
  })

  it('crea nota desde chatbot y aparece en lista', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText('Comando del asistente'), 'crea una nota sobre React')
    await user.click(screen.getByRole('button', { name: 'Enviar comando' }))
    expect(screen.getByText(/Nota: React/i)).toBeInTheDocument()
  })

  it('eliminar nota funciona', async () => {
    const user = userEvent.setup()
    render(<App />)
    const btn = screen.getAllByRole('button', { name: 'Borrar' })[0]
    await user.click(btn)
    expect(screen.queryByText("Plan semanal del proyecto")).not.toBeInTheDocument()
  })
})
