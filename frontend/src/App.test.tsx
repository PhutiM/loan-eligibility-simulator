import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('App', () => {
  it('renders the branded header and simulator dashboard with the eligibility form', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const isRulesRequest = String(input).endsWith('/api/loans/validation-rules')
      return {
        ok: true,
        json: async () =>
          isRulesRequest
            ? {
                personalInfo: {
                  age: { min: 18, max: 65, integer: true, required: true, errorMessage: 'Age must be between 18 and 65' },
                  employmentStatus: { required: true, options: ['employed', 'self_employed', 'unemployed', 'retired'], errorMessage: 'Please select your employment status' },
                  employmentDuration: { min: 3, integer: true, required: true, errorMessage: 'Minimum 3 months employment required' },
                },
                financialInfo: {
                  monthlyIncome: { min: 5000, required: true, errorMessage: 'Minimum monthly income of R5,000 required' },
                  monthlyExpenses: { min: 0, required: true, errorMessage: 'Please enter your monthly expenses' },
                  existingDebt: { min: 0, required: true, errorMessage: 'Please enter your existing debt' },
                  creditScore: { min: 300, max: 850, integer: true, required: false, errorMessage: 'Credit score must be between 300 and 850' },
                },
                loanDetails: {
                  loanType: { required: true, options: ['personal_loan', 'vehicle_loan'], errorMessage: 'Please select a loan product' },
                  loanPurpose: { required: true, errorMessage: 'Please select a loan purpose' },
                  requestedAmount: { min: 5000, max: 300000, required: true, errorMessage: 'Loan amount must be between R5,000 and R300,000' },
                  loanTerm: { min: 6, max: 60, integer: true, required: true, errorMessage: 'Loan term must be between 6 and 60 months' },
                },
              }
            : {
          products: [
            {
              id: 'personal_loan',
              name: 'Personal Loan',
              minAmount: 5000,
              maxAmount: 300000,
              minTerm: 6,
              maxTerm: 60,
              purposes: ['debt_consolidation', 'home_improvement', 'education', 'medical', 'other'],
            },
          ],
              },
      } as Response
    })
    render(<App />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Loan Eligibility home' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Loan Eligibility Simulator' }),
    ).toBeInTheDocument()
    const form = await screen.findByRole('form', { name: 'Loan eligibility application' })
    expect(form).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ready to get started?' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Important Information' })).toBeInTheDocument()
    const informationCard = screen
      .getByRole('heading', { name: 'Important Information' })
      .closest('.loan-information-card')
    expect(informationCard).not.toBeNull()
    if (!informationCard) {
      throw new Error('Important Information card is missing')
    }
    expect(
      informationCard.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Check Eligibility' })).toBeInTheDocument()
    expect(screen.queryByText(/Secure & Confidential/)).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/loans/products')
  })
})
