import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import LoanEligibilityPage from './LoanEligibilityPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
})

const productsResponse = {
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
    {
      id: 'vehicle_loan',
      name: 'Vehicle Finance',
      minAmount: 50000,
      maxAmount: 1500000,
      minTerm: 12,
      maxTerm: 72,
      purposes: ['new_vehicle', 'used_vehicle'],
    },
  ],
}

const validationRulesResponse = {
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

const rateResponse = {
  interestRate: 12.5,
  monthlyPayment: 7096.1,
  totalInterest: 20306.4,
  totalRepayment: 170306.4,
  paymentSchedule: [{ month: 1, payment: 7096.1, principal: 5533.6, interest: 1562.5, balance: 144466.4 }],
}

function mockFetch(eligibilityResponse?: unknown) {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input)
    const response = url.endsWith('/api/loans/products')
      ? productsResponse
      : url.endsWith('/api/loans/validation-rules')
        ? validationRulesResponse
      : url.endsWith('/api/loans/calculate-rate')
        ? rateResponse
        : eligibilityResponse
    return Promise.resolve({
      ok: true,
      json: async () => response,
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function enterValidApplication() {
  await screen.findByRole('form', { name: 'Loan eligibility application' })
  const values = [
    ['Age', '35'],
    ['Employment Duration (months)', '24'],
    ['Monthly Income (ZAR)', '25000'],
    ['Monthly Expenses (ZAR)', '15000'],
    ['Existing Debt (ZAR)', '5000'],
    ['Credit Score (optional)', '650'],
  ] as const

  for (const [label, value] of values) {
    fireEvent.change(screen.getByRole('spinbutton', { name: label }), {
      target: { value },
    })
  }
  const dropdownOptions = [
    ['Employment Status', 'Employed'],
    ['Loan Term', '24 months'],
    ['Loan Purpose', 'Home Improvement'],
  ] as const
  for (const [label, option] of dropdownOptions.slice(0, 1)) {
    fireEvent.mouseDown(screen.getByRole('combobox', { name: label }))
    fireEvent.click(await screen.findByRole('option', { name: option }))
  }
  fireEvent.click(screen.getByRole('radio', { name: 'Personal Loan' }))
  for (const [label, option] of dropdownOptions.slice(1)) {
    fireEvent.mouseDown(screen.getByRole('combobox', { name: label }))
    fireEvent.click(await screen.findByRole('option', { name: option }))
  }
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Requested Loan Amount (ZAR)' }), {
    target: { value: '150000' },
  })
}

describe('LoanEligibilityPage', () => {
  it('renders the simulator application form after loading its API rules', async () => {
    mockFetch()
    render(<LoanEligibilityPage />)

    expect(await screen.findByRole('form', { name: 'Loan eligibility application' })).toBeInTheDocument()
    expect(
      screen.queryByText(
        'Enter your details to see your estimated eligibility, recommended loan amount and monthly repayments.',
      ),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Age' })).toHaveValue(null)
    expect(screen.getByRole('button', { name: 'Check Eligibility' })).toBeInTheDocument()
  })

  it('loads products and filters purpose options by the selected product', async () => {
    const fetchMock = mockFetch()
    render(<LoanEligibilityPage />)

    await screen.findByRole('form', { name: 'Loan eligibility application' })
    expect(screen.getByRole('heading', { name: 'Ready to get started?' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Important Information' })).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Loan eligibility application' })).toBeInTheDocument()
    const vehicleProduct = await screen.findByRole('radio', { name: 'Vehicle Finance' })
    await waitFor(() => expect(vehicleProduct).not.toBeDisabled())
    fireEvent.click(vehicleProduct)
    const purposeDropdown = screen.getByRole('combobox', { name: 'Loan Purpose' })
    expect(purposeDropdown).not.toBeDisabled()
    fireEvent.mouseDown(purposeDropdown)
    expect(await screen.findByRole('option', { name: 'New Vehicle' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Home Improvement' })).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/loans/products')
  })

  it('submits to the API and replaces the welcome panel with the eligibility result', async () => {
    const result = {
      eligibilityResult: {
        isEligible: true,
        approvalLikelihood: 85,
        riskCategory: 'low',
        decisionReason: 'Manageable debt',
      },
      recommendedLoan: {
        maxAmount: 180000,
        recommendedAmount: 150000,
        interestRate: 12.5,
        monthlyPayment: 7096.1,
        totalRepayment: 170306.4,
      },
      affordabilityAnalysis: {
        disposableIncome: 10000,
        debtToIncomeRatio: 20,
        loanToIncomeRatio: 60,
        affordabilityScore: 'good',
      },
    }
    const fetchMock = mockFetch(result)
    render(<LoanEligibilityPage />)

    await enterValidApplication()
    fireEvent.click(screen.getByRole('button', { name: 'Check Eligibility' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/loans/eligibility',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(fetchMock).toHaveBeenCalledWith(
    '/api/loans/calculate-rate',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        loanAmount: 150000,
        loanTerm: 24,
        creditScore: 650,
        loanType: 'personal_loan',
      }),
    }),
    )
    expect(
      await screen.findByRole('heading', { name: 'You are likely eligible!' }),
    ).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(await screen.findAllByRole('heading', { name: 'Loan Details' })).toHaveLength(2)
    expect(screen.getByText(/7,096\.10/)).toBeInTheDocument()
    expect(screen.getByText('12.5% p.a.')).toBeInTheDocument()
    expect(screen.getAllByText('24 months')).toHaveLength(2)
    expect(screen.queryByRole('heading', { name: 'Ready to get started?' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Your Financial Summary' })).not.toBeInTheDocument()

    fireEvent.click(await screen.findByRole('button', { name: 'Reset Calculator' }))

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ready to get started?' })).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Age' })).toHaveValue(null)
  })

  it('scrolls results into view on mobile after a successful eligibility check', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    const scrollIntoView = vi.fn()
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
    mockFetch({
      eligibilityResult: {
        isEligible: false,
        approvalLikelihood: 20,
        riskCategory: 'high',
        decisionReason: 'Affordability criteria not met',
      },
      recommendedLoan: {
        maxAmount: 0,
        recommendedAmount: 0,
        interestRate: 0,
        monthlyPayment: 0,
        totalRepayment: 0,
      },
      affordabilityAnalysis: {
        disposableIncome: 0,
        debtToIncomeRatio: 80,
        loanToIncomeRatio: 0,
        affordabilityScore: 'poor',
      },
    })
    render(<LoanEligibilityPage />)

    await enterValidApplication()
    fireEvent.click(screen.getByRole('button', { name: 'Check Eligibility' }))

    await screen.findByRole('heading', { name: 'You are unlikely to be eligible' })
    await waitFor(() =>
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' }),
    )
  })

  it('shows validation errors returned by the API', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) =>
      Promise.resolve(
        String(input).endsWith('/api/loans/products')
          ? { ok: true, json: async () => productsResponse }
          : String(input).endsWith('/api/loans/validation-rules')
            ? { ok: true, json: async () => validationRulesResponse }
            : String(input).endsWith('/api/loans/calculate-rate')
              ? { ok: true, json: async () => rateResponse }
          : {
              ok: false,
              status: 400,
              json: async () => ({
          error: 'Validation failed',
          details: [{ message: 'Age is invalid' }, { message: 'Income is invalid' }],
              }),
            },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(<LoanEligibilityPage />)

    await enterValidApplication()
    fireEvent.click(screen.getByRole('button', { name: 'Check Eligibility' }))

    expect(await screen.findByText('Age is invalid. Income is invalid')).toBeInTheDocument()
  })

  it('uses the configured API origin for hosted deployments', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/')
    const eligibilityResponse = {
        eligibilityResult: {
          isEligible: true,
          approvalLikelihood: 85,
          riskCategory: 'low',
          decisionReason: 'Manageable debt',
        },
        recommendedLoan: {
          recommendedAmount: 150000,
          monthlyPayment: 7096.1,
          totalRepayment: 170306.4,
        },
        affordabilityAnalysis: {
          disposableIncome: 10000,
          affordabilityScore: 'good',
        },
    }
    const fetchMock = mockFetch(eligibilityResponse)
    render(<LoanEligibilityPage />)

    await enterValidApplication()
    fireEvent.click(screen.getByRole('button', { name: 'Check Eligibility' }))

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.test/api/loans/eligibility',
        expect.any(Object),
      ),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/loans/calculate-rate',
      expect.any(Object),
    )
  })

  it('reports unexpected server responses and network failures', async () => {
    let eligibilityCallCount = 0
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (String(input).endsWith('/api/loans/products')) {
        return Promise.resolve({ ok: true, json: async () => productsResponse })
      }
      if (String(input).endsWith('/api/loans/validation-rules')) {
        return Promise.resolve({ ok: true, json: async () => validationRulesResponse })
      }
      if (String(input).endsWith('/api/loans/calculate-rate')) {
        return Promise.resolve({ ok: true, json: async () => rateResponse })
      }
      eligibilityCallCount += 1
      return eligibilityCallCount === 1
        ? Promise.resolve({ ok: true, json: async () => ({}) })
        : Promise.reject(new Error('Network unavailable'))
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<LoanEligibilityPage />)

    await enterValidApplication()
    fireEvent.click(screen.getByRole('button', { name: 'Check Eligibility' }))
    expect(
      await screen.findByText('The server returned an unexpected eligibility response.'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Check Eligibility' }))
    expect(await screen.findByText('Network unavailable')).toBeInTheDocument()
  })

  it('shows a not-eligible decision from the API response', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) =>
      Promise.resolve(
        String(input).endsWith('/api/loans/products')
          ? { ok: true, json: async () => productsResponse }
          : String(input).endsWith('/api/loans/validation-rules')
            ? { ok: true, json: async () => validationRulesResponse }
          : {
              ok: true,
              json: async () => ({
          eligibilityResult: {
            isEligible: false,
            approvalLikelihood: 15,
            riskCategory: 'high',
            decisionReason: 'High existing debt',
          },
          recommendedLoan: {
            recommendedAmount: 0,
            monthlyPayment: 0,
            totalRepayment: 0,
          },
          affordabilityAnalysis: {
            disposableIncome: 0,
            affordabilityScore: 'poor',
          },
              }),
            },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(<LoanEligibilityPage />)

    await enterValidApplication()
    fireEvent.click(screen.getByRole('button', { name: 'Check Eligibility' }))

    expect(
      await screen.findByRole('heading', { name: 'You are unlikely to be eligible' }),
    ).toBeInTheDocument()
  })
})
