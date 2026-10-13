import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import EligibilitySummary from './EligibilitySummary'

afterEach(cleanup)

describe('EligibilitySummary', () => {
  it.each([
    ['low', 'bg-[#d1fae5] text-[#047857]'],
    ['medium', 'bg-[#fef3c7] text-[#b45309]'],
    ['high', 'bg-[#fee2e2] text-[#b91c1c]'],
  ])('uses the coordinated color for %s risk', (riskCategory, colorClass) => {
    render(
      <EligibilitySummary riskCategory={riskCategory} decisionReason="Affordability criteria met" />,
    )

    expect(screen.getByText(riskCategory)).toHaveClass(...colorClass.split(' '))
  })

  it('uses a neutral color for an unrecognized risk category', () => {
    render(<EligibilitySummary riskCategory="unknown" decisionReason="Review required" />)

    expect(screen.getByText('unknown')).toHaveClass('bg-[#e2e8f0]', 'text-[#475569]')
  })
})
