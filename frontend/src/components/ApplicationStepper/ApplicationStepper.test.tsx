import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import ApplicationStepper from './ApplicationStepper'

afterEach(cleanup)

describe('ApplicationStepper', () => {
  it('shows the application steps vertically with accessible status labels', () => {
    render(
      <ApplicationStepper
        steps={['Personal details', 'Financial information', 'Loan details']}
        activeStep={1}
      >
        <div>Current step form</div>
      </ApplicationStepper>,
    )

    expect(screen.getByRole('navigation', { name: 'Application progress' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Financial information').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    )
    expect(screen.getByText('Current step form').closest('li')).toBe(
      screen.getByText('Financial information').closest('li'),
    )
  })
})
