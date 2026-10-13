import { afterEach, describe, expect, it, vi } from 'vitest'
import { calculateLoanRate, getLoanProducts, getValidationRules } from './loans'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('getLoanProducts', () => {
  it('returns supported loan products and their purposes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          products: [
            {
              id: 'vehicle_loan',
              name: 'Vehicle Finance',
              minAmount: 50000,
              maxAmount: 1500000,
              minTerm: 12,
              maxTerm: 72,
              purposes: ['new_vehicle'],
            },
            {
              id: 'personal_loan',
              name: 'Personal Loan',
              minAmount: 5000,
              maxAmount: 300000,
              minTerm: 6,
              maxTerm: 60,
              purposes: ['home_improvement', 'education'],
            },
          ],
        }),
      }),
    )

    await expect(getLoanProducts()).resolves.toMatchObject([
      { id: 'vehicle_loan', purposes: ['new_vehicle'] },
      { id: 'personal_loan', purposes: ['home_improvement', 'education'] },
    ])
  })

  describe('getValidationRules', () => {
    const rules = {
      personalInfo: {
        age: { min: 18, max: 65, integer: true, required: true, errorMessage: 'Age is invalid' },
        employmentStatus: { required: true, options: ['employed'], errorMessage: 'Select employment status' },
        employmentDuration: { min: 3, integer: true, required: true, errorMessage: 'Duration is invalid' },
      },
      financialInfo: {
        monthlyIncome: { min: 5000, required: true, errorMessage: 'Income is invalid' },
        monthlyExpenses: { min: 0, required: true, errorMessage: 'Expenses are invalid' },
        existingDebt: { min: 0, required: true, errorMessage: 'Debt is invalid' },
        creditScore: { min: 300, max: 850, integer: true, required: false, errorMessage: 'Score is invalid' },
      },
      loanDetails: {
        loanType: { required: true, options: ['personal_loan'], errorMessage: 'Product is required' },
        loanPurpose: { required: true, errorMessage: 'Purpose is required' },
        requestedAmount: { min: 5000, max: 300000, required: true, errorMessage: 'Amount is invalid' },
        loanTerm: { min: 6, max: 60, integer: true, required: true, errorMessage: 'Term is invalid' },
      },
    }

    it('returns server-provided field validation rules', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => rules,
      })
      vi.stubGlobal('fetch', fetchMock)

      await expect(getValidationRules()).resolves.toEqual(rules)
      expect(fetchMock).toHaveBeenCalledWith('/api/loans/validation-rules')
    })

    it('reports unsuccessful and malformed validation rule responses', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ error: 'Rules unavailable' }),
        })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      vi.stubGlobal('fetch', fetchMock)

      await expect(getValidationRules()).rejects.toThrow('Rules unavailable')
      await expect(getValidationRules()).rejects.toThrow('The server returned unexpected validation rules.')
    })
  })

  describe('calculateLoanRate', () => {
    const request = {
      loanAmount: 150000,
      loanTerm: 24,
      creditScore: 650,
      loanType: 'personal_loan',
    }
    const response = {
      interestRate: 12.5,
      monthlyPayment: 7096.1,
      totalInterest: 20306.4,
      totalRepayment: 170306.4,
      paymentSchedule: [{ month: 1, payment: 1, principal: 1, interest: 0, balance: 149999 }],
    }

    it('posts loan details and returns the repayment calculation', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => response,
      })
      vi.stubGlobal('fetch', fetchMock)

      await expect(calculateLoanRate(request)).resolves.toEqual(response)
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/loans/calculate-rate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request),
        }),
      )
    })

    it('reports unsuccessful and malformed rate responses', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Invalid loan amount' }),
        })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      vi.stubGlobal('fetch', fetchMock)

      await expect(calculateLoanRate(request)).rejects.toThrow('Invalid loan amount')
      await expect(calculateLoanRate(request)).rejects.toThrow(
        'The server returned an unexpected loan rate response.',
      )
    })
  })

  it('reports unsuccessful product requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Products unavailable' }),
      }),
    )

    await expect(getLoanProducts()).rejects.toThrow('Products unavailable')
  })

  it('rejects malformed product responses and missing personal-loan purposes', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ products: [] }),
      })
    vi.stubGlobal('fetch', fetchMock)

    await expect(getLoanProducts()).rejects.toThrow(
      'The server returned an unexpected loan products response.',
    )
    await expect(getLoanProducts()).rejects.toThrow('No loan products are available.')
  })
})
