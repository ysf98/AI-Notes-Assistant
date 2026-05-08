import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../../App'

describe('App integration', () => {
  it('crea nota manualmente, la edita y la busca', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => {
      expect(screen.queryByText('Cargando notas...')).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Nueva nota' }))
    const titleInput = screen.getByLabelText(/T.tulo/i)
    await user.clear(titleInput)
    await user.type(titleInput, 'Nota manual')
    await user.type(screen.getByLabelText('Contenido'), 'Contenido de prueba')

    await user.clear(screen.getByLabelText('Buscar notas'))
    await user.type(screen.getByLabelText('Buscar notas'), 'manual')
    expect((await screen.findAllByText('Nota manual')).length).toBeGreaterThan(0)
  })

  it('crea nota desde chatbot y aparece en lista', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => {
      expect(screen.queryByText('Cargando notas...')).not.toBeInTheDocument()
    })
    await user.type(screen.getByLabelText('Comando del asistente'), 'crea una nota sobre React')
    await user.click(screen.getByRole('button', { name: 'Enviar comando' }))
    expect(screen.getAllByText(/Nota: React/i).length).toBeGreaterThan(0)
  })

  it('eliminar nota funciona', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => {
      expect(screen.queryByText('Cargando notas...')).not.toBeInTheDocument()
    })
    const before = screen.getAllByText('Borrar').length
    await user.click(screen.getAllByText('Borrar')[0])
    await waitFor(() => {
      expect(screen.getAllByText('Borrar').length).toBe(before - 1)
    })
  })
})
