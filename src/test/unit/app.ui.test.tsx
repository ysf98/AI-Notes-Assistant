import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const repositoryMock = vi.hoisted(() => ({
  load: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('../../infrastructure/persistence/notesRepository', () => ({
  createNotesRepository: () => repositoryMock,
}))

vi.mock('sonner', () => ({
  Toaster: () => null,
  toast: { success: toastSuccess, error: toastError },
}))

import App from '../../App'

describe('app ui behaviors', () => {
  beforeEach(() => {
    repositoryMock.load.mockResolvedValue({ notes: [], mode: 'localStorage' })
    repositoryMock.create.mockResolvedValue({ mode: 'localStorage' })
    repositoryMock.update.mockResolvedValue({ mode: 'localStorage' })
    repositoryMock.remove.mockResolvedValue({ mode: 'localStorage' })
    toastSuccess.mockReset()
    toastError.mockReset()
  })

  it('toggle dark mode', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => expect(screen.queryByText('Cargando notas...')).not.toBeInTheDocument())
    const button = screen.getByLabelText('Toggle dark mode')
    const before = document.documentElement.classList.contains('dark')
    await user.click(button)
    expect(document.documentElement.classList.contains('dark')).toBe(!before)
    expect(localStorage.getItem('ai-notes-theme')).toBe(!before ? 'dark' : 'light')
  })

  it('usa light por defecto si no hay tema guardado', async () => {
    render(<App />)
    await waitFor(() => expect(screen.queryByText('Cargando notas...')).not.toBeInTheDocument())
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('ai-notes-theme')).toBeNull()
  })

  it('onboarding se muestra la primera vez', async () => {
    localStorage.removeItem('ai-notes-onboarding-seen')
    render(<App />)
    expect(screen.getByText('Welcome to AI Notes Assistant')).toBeInTheDocument()
  })

  it('onboarding no se muestra si ya fue cerrado', async () => {
    localStorage.setItem('ai-notes-onboarding-seen', 'true')
    render(<App />)
    expect(screen.queryByText('Welcome to AI Notes Assistant')).not.toBeInTheDocument()
  })

  it('empty states de notas y chat', async () => {
    render(<App />)
    await waitFor(() => expect(screen.queryByText('Cargando notas...')).not.toBeInTheDocument())
    expect(screen.getByText('No notes yet')).toBeInTheDocument()
    expect(screen.getByText('No conversation yet')).toBeInTheDocument()
  })

  it('toast al crear y eliminar nota', async () => {
    const user = userEvent.setup()
    repositoryMock.load.mockResolvedValue({
      notes: [{ id: 'n1', title: 'Inicial', content: 'x', category: 'General', date: '2026-05-08', createdAt: '2026-05-08T00:00:00.000Z', updatedAt: '2026-05-08T00:00:00.000Z' }],
      mode: 'localStorage',
    })
    render(<App />)
    await waitFor(() => expect(screen.queryByText('Cargando notas...')).not.toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Nueva nota' }))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Note created'))

    const deleteButtons = screen.getAllByText('Borrar')
    await user.click(deleteButtons[0])
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Note deleted'))
  })
})
