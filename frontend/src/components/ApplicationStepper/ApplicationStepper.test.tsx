import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

  it('lets users click a completed step to go back to it', () => {
    const onStepSelect = vi.fn()
    render(
      <ApplicationStepper
        steps={['Personal details', 'Financial information', 'Loan details']}
        activeStep={2}
        onStepSelect={onStepSelect}
      >
        <div>Current step form</div>
      </ApplicationStepper>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Go back to Personal details' }))

    expect(onStepSelect).toHaveBeenCalledWith(0)
    expect(screen.queryByRole('button', { name: 'Go back to Loan details' })).not.toBeInTheDocument()
  })
})
