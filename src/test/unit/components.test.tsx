import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NotesSidebar } from '../../components/NotesSidebar'
import { NoteEditor } from '../../components/NoteEditor'

const notes = [
  {
    id: '1',
    title: 'Uno',
    content: 'Contenido',
    category: 'General' as const,
    date: '2026-05-07',
    createdAt: '',
    updatedAt: '',
  },
]

describe('componentes principales', () => {
  it('lista muestra notas', () => {
    render(
      <NotesSidebar
        notes={notes}
        selectedId={null}
        query=""
        isLoading={false}
        onQueryChange={() => {}}
        onSelect={() => {}}
        onCreate={() => {}}
        onDelete={() => {}}
        onClearSearch={() => {}}
      />
    )
    expect(screen.getByText('Uno')).toBeInTheDocument()
  })

  it('editor modifica titulo contenido y categoria', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onSave = vi.fn()
    const onBack = vi.fn()
    render(
      <NoteEditor
        note={notes[0]}
        onChange={onChange}
        onSave={onSave}
        onBack={onBack}
        hasUnsavedChanges={true}
      />
    )
    await user.type(screen.getByLabelText(/T.tulo/i), ' x')
    await user.type(screen.getByLabelText('Contenido'), ' y')
    await user.selectOptions(screen.getByLabelText(/Categor.a/i), 'Ideas')
    await user.click(screen.getByRole('button', { name: /Guardar/i }))
    await user.click(screen.getByRole('button', { name: /Atras/i }))
    expect(onChange).toHaveBeenCalled()
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
