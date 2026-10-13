import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import EligibilityResult from './EligibilityResult'

afterEach(cleanup)

describe('EligibilityResult', () => {
  it('shows the likely-eligible state and approval likelihood', () => {
    render(<EligibilityResult isEligible approvalLikelihood={85} />)

    expect(screen.getByRole('heading', { name: 'You are likely eligible!' })).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText('Approval Likelihood')).toBeInTheDocument()
    expect(
      screen.getByText(/you have a high chance of approval/),
    ).toBeInTheDocument()
  })

  it('shows a low-likelihood outcome when the applicant is not eligible', () => {
    render(<EligibilityResult isEligible={false} approvalLikelihood={15} />)

    expect(
      screen.getByRole('heading', { name: 'You are unlikely to be eligible' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/your chance of approval is low/),
    ).toBeInTheDocument()
  })

  it('clamps likelihood values to the displayed percentage range', () => {
    render(<EligibilityResult isEligible approvalLikelihood={120} />)

    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'You are likely eligible! Approval likelihood: 100%',
    )
  })
})
