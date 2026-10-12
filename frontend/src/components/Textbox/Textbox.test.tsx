import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Textbox from './Textbox'

afterEach(cleanup)

describe('Textbox', () => {
  it('renders a labeled text field with its placeholder', () => {
    render(<Textbox label="Monthly Income (ZAR)" placeholder="e.g. 25000" />)

    expect(screen.getByRole('textbox', { name: 'Monthly Income (ZAR)' })).toHaveAttribute(
      'placeholder',
      'e.g. 25000',
    )
  })

  it('forwards input type, constraints, and disabled state', () => {
    render(
      <Textbox
        label="Age"
        type="number"
        min={18}
        max={65}
        required
        disabled
      />,
    )

    const input = screen.getByRole('spinbutton', { name: 'Age' })
    expect(input).toHaveAttribute('min', '18')
    expect(input).toHaveAttribute('max', '65')
    expect(input).toBeRequired()
    expect(input).toBeDisabled()
  })
})
