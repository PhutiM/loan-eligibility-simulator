import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import EligibilityResult from './EligibilityResult'

afterEach(cleanup)

describe('EligibilityResult', () => {
  it('shows an eligibility estimate and clearly labels its simulator score', () => {
    render(<EligibilityResult isEligible approvalLikelihood={85} />)

    expect(screen.getByRole('heading', { name: 'Good news, you look likely to qualify' })).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText('Approval chance')).toBeInTheDocument()
    expect(
      screen.getByText(/not a guarantee. The final decision is made by the lender/),
    ).toBeInTheDocument()
  })

  it('shows a screening result when the applicant does not meet the current criteria', () => {
    render(<EligibilityResult isEligible={false} approvalLikelihood={15} />)

    expect(
      screen.getByRole('heading', { name: 'You may not qualify yet' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Based on the details you shared, you don't meet all of our simulator's requirements yet. See below for why."),
    ).toBeInTheDocument()
  })

  it('clamps the simulator score to its displayed range', () => {
    render(<EligibilityResult isEligible approvalLikelihood={120} />)

    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Good news, you look likely to qualify. Estimated approval chance: 100%.',
    )
  })
})
