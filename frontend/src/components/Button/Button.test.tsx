import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Button from './Button'

afterEach(cleanup)

describe('Button', () => {
  it('renders a primary button by default and forwards attributes', () => {
    render(<Button type="submit">Continue</Button>)

    expect(screen.getByRole('button', { name: 'Continue' })).toHaveClass(
      'MuiButton-contained',
    )
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('renders a secondary disabled button with a custom class', () => {
    render(
      <Button className="extra-class" disabled variant="secondary">
        Cancel
      </Button>,
    )

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass(
      'MuiButton-outlined',
      'extra-class',
    )
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })
})
