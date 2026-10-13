import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Dropdown from './Dropdown'

afterEach(cleanup)

describe('Dropdown', () => {
  it('renders its label and placeholder before a selection is made', () => {
    render(
      <Dropdown
        label="Employment Status"
        placeholder="Select status"
        options={[
          { label: 'Employed', value: 'employed' },
          { label: 'Self-employed', value: 'self_employed' },
        ]}
      />,
    )

    expect(screen.getByRole('combobox', { name: 'Employment Status' })).toHaveTextContent(
      'Select status',
    )
  })

  it('shows options and displays the selected option', async () => {
    render(
      <Dropdown
        label="Employment Status"
        placeholder="Select status"
        options={[
          { label: 'Employed', value: 'employed' },
          { label: 'Self-employed', value: 'self_employed' },
        ]}
      />,
    )

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Employment Status' }))
    const listbox = await screen.findByRole('listbox')
    fireEvent.click(within(listbox).getByRole('option', { name: 'Self-employed' }))

    expect(screen.getByRole('combobox', { name: 'Employment Status' })).toHaveTextContent(
      'Self-employed',
    )
  })
})
