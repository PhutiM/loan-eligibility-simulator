import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LoanEligibilityForm from './LoanEligibilityForm'
import type { LoanProduct, ValidationRules } from '../../../api/loans'

afterEach(cleanup)

const loanProducts: LoanProduct[] = [
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
]

const validationRules: ValidationRules = {
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

async function enterValidApplication() {
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
    ['Loan Product', 'Personal Loan'],
    ['Loan Term', '24 months'],
    ['Loan Purpose', 'Home Improvement'],
  ] as const
  for (const [label, option] of dropdownOptions) {
    fireEvent.mouseDown(screen.getByRole('combobox', { name: label }))
    fireEvent.click(await screen.findByRole('option', { name: option }))
  }
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Requested Loan Amount (ZAR)' }), {
    target: { value: '150000' },
  })
}

describe('Loan Eligibility Page Form', () => {
  it('starts with empty values and submits entered values as numeric API data', async () => {
    const onSubmit = vi.fn()
    render(
      <LoanEligibilityForm
        onSubmit={onSubmit}
        products={loanProducts}
        validationRules={validationRules}
      />,
    )

    expect(screen.getByRole('spinbutton', { name: 'Age' })).toHaveValue(null)
    expect(screen.getByRole('combobox', { name: 'Employment Status' })).toHaveTextContent(
      'Select an option',
    )
    expect(screen.getByRole('combobox', { name: 'Loan Product' })).toHaveTextContent(
      'Select a loan product',
    )
    expect(screen.getByRole('combobox', { name: 'Loan Term' })).toHaveTextContent('Select an option')
    expect(screen.getByRole('combobox', { name: 'Loan Purpose' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await enterValidApplication()
    fireEvent.submit(screen.getByRole('form', { name: 'Loan eligibility application' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        personalInfo: {
          age: 35,
          employmentStatus: 'employed',
          employmentDuration: 24,
        },
        financialInfo: {
          monthlyIncome: 25000,
          monthlyExpenses: 15000,
          existingDebt: 5000,
          creditScore: 650,
        },
        loanDetails: {
          loanType: 'personal_loan',
          requestedAmount: 150000,
          loanTerm: 24,
          loanPurpose: 'home_improvement',
        },
      })
    })
  })

  it('prevents submission and shows validation feedback for invalid values', async () => {
    const onSubmit = vi.fn()
    render(<LoanEligibilityForm onSubmit={onSubmit} products={loanProducts} validationRules={validationRules} />)

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Age' }), {
      target: { value: '17' },
    })
    fireEvent.submit(screen.getByRole('form', { name: 'Loan eligibility application' }))

    expect(await screen.findByText('Age must be between 18 and 65')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('uses the server-provided bounds and message for field validation', async () => {
    const onSubmit = vi.fn()
    const apiRules: ValidationRules = {
      ...validationRules,
      personalInfo: {
        ...validationRules.personalInfo,
        age: {
          ...validationRules.personalInfo.age,
          min: 21,
          errorMessage: 'Applicants must be at least 21',
        },
      },
    }
    render(
      <LoanEligibilityForm
        onSubmit={onSubmit}
        products={loanProducts}
        validationRules={apiRules}
      />,
    )

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Age' }), {
      target: { value: '20' },
    })
    fireEvent.submit(screen.getByRole('form', { name: 'Loan eligibility application' }))

    expect(await screen.findByText('Applicants must be at least 21')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('allows the optional credit score to be left blank', async () => {
    const onSubmit = vi.fn()
    render(<LoanEligibilityForm onSubmit={onSubmit} products={loanProducts} validationRules={validationRules} />)

    await enterValidApplication()
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Credit Score (optional)' }), {
      target: { value: '' },
    })
    fireEvent.submit(screen.getByRole('form', { name: 'Loan eligibility application' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          financialInfo: expect.objectContaining({ creditScore: undefined }),
        }),
      ),
    )
  })

  it('filters purpose and term options after selecting a product', async () => {
    render(<LoanEligibilityForm onSubmit={vi.fn()} products={loanProducts} validationRules={validationRules} />)

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Loan Product' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Vehicle Finance' }))

    expect(screen.getByRole('spinbutton', { name: 'Requested Loan Amount (ZAR)' })).toHaveAttribute(
      'min',
      '50000',
    )
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Loan Purpose' }))
    expect(await screen.findByRole('option', { name: 'New Vehicle' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Home Improvement' })).not.toBeInTheDocument()
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Loan Term' }))
    expect(await screen.findByRole('option', { name: '72 months' })).toBeInTheDocument()
  })

  it('renders the eligibility action without a reset action in the form', () => {
    render(<LoanEligibilityForm onSubmit={vi.fn()} products={[]} validationRules={validationRules} />)

    expect(screen.getByRole('button', { name: 'Check Eligibility' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reset Calculator' })).not.toBeInTheDocument()
  })

  it('disables the submit button while checking eligibility', () => {
    render(<LoanEligibilityForm onSubmit={vi.fn()} products={[]} validationRules={validationRules} isSubmitting />)

    expect(screen.getByRole('button', { name: 'Checking Eligibility…' })).toBeDisabled()
  })
})
