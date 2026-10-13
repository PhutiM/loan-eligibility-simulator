import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import AffordabilityAnalysis from './AffordabilityAnalysis'

afterEach(cleanup)

const analysis = {
  disposableIncome: 10000,
  debtToIncomeRatio: 20,
  loanToIncomeRatio: 60,
  affordabilityScore: 'good',
}

describe('AffordabilityAnalysis', () => {
  it.each([
    ['good', 'bg-[#d1fae5] text-[#047857]'],
    ['fair', 'bg-[#fef3c7] text-[#b45309]'],
    ['poor', 'bg-[#fee2e2] text-[#b91c1c]'],
  ])('uses the coordinated color for a %s score', (affordabilityScore, colorClass) => {
    render(<AffordabilityAnalysis analysis={{ ...analysis, affordabilityScore }} />)

    expect(screen.getByText(affordabilityScore)).toHaveClass(...colorClass.split(' '))
  })

  it('uses a neutral color for an unrecognized score', () => {
    render(
      <AffordabilityAnalysis analysis={{ ...analysis, affordabilityScore: 'unknown' }} />,
    )

    expect(screen.getByText('unknown')).toHaveClass('bg-[#e2e8f0]', 'text-[#475569]')
  })
})
