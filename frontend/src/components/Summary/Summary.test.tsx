import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import FinancialSummary from './Summary'

afterEach(cleanup)

describe('FinancialSummary', () => {
  it('renders its default empty state', () => {
    render(<FinancialSummary />)

    expect(screen.getByRole('heading', { name: 'Ready to get started?' })).toBeInTheDocument()
    expect(
      screen.getByText(/Complete the form to see your personalised financial summary/),
    ).toBeInTheDocument()
  })

  it('accepts a custom description', () => {
    render(<FinancialSummary description="No estimates yet." />)

    expect(screen.getByText('No estimates yet.')).toBeInTheDocument()
  })

  it('supports a custom title and summary content', () => {
    render(
      <FinancialSummary title="Application Summary">
        <p>Estimated monthly repayment: R7,000</p>
      </FinancialSummary>,
    )

    expect(screen.getByRole('heading', { name: 'Application Summary' })).toBeInTheDocument()
    expect(screen.getByText('Estimated monthly repayment: R7,000')).toBeInTheDocument()
    expect(
      screen.queryByText(/Complete the form to see your personalised financial summary/),
    ).not.toBeInTheDocument()
  })
})
