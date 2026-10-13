import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import EligibilityResult from './EligibilityResult'

afterEach(cleanup)

describe('EligibilityResult', () => {
  it('shows an eligibility estimate and clearly labels its simulator score', () => {
    render(<EligibilityResult isEligible approvalLikelihood={85} />)

    expect(screen.getByRole('heading', { name: 'Positive simulator result' })).toBeInTheDocument()
    expect(screen.getByText('85/100')).toBeInTheDocument()
    expect(screen.getByText('Simulator score')).toBeInTheDocument()
    expect(
      screen.getByText(/not a probability of approval or a lender decision/),
    ).toBeInTheDocument()
  })

  it('shows a screening result when the applicant does not meet the current criteria', () => {
    render(<EligibilityResult isEligible={false} approvalLikelihood={15} />)

    expect(
      screen.getByRole('heading', { name: 'Further review recommended' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Your details don't meet the simulator's current screening criteria."),
    ).toBeInTheDocument()
  })

  it('clamps the simulator score to its displayed range', () => {
    render(<EligibilityResult isEligible approvalLikelihood={120} />)

    expect(screen.getByText('100/100')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Positive simulator result. Simulator score: 100 out of 100.',
    )
  })
})
