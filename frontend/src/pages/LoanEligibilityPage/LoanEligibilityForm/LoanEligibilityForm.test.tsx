import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LoanEligibilityForm from './LoanEligibilityForm'
import type { LoanProduct, ValidationRules } from '../../../api/loans'

afterEach(cleanup)

const loanProducts: LoanProduct[] = [
  {
    id: 'personal_loan',
    name: 'Personal Loan',
    description: 'Flexible personal financing for various needs',
    minAmount: 5000,
    maxAmount: 300000,
    minTerm: 6,
    maxTerm: 60,
    purposes: ['debt_consolidation', 'home_improvement', 'education', 'medical', 'other'],
  },
  {
    id: 'vehicle_loan',
    name: 'Vehicle Finance',
    description: 'Financing for new and used vehicles',
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

async function enterPersonalDetailsExceptDuration() {
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Age' }), { target: { value: '35' } })
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Employment Status' }))
  fireEvent.click(await screen.findByRole('option', { name: 'Employed' }))
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  await screen.findByRole('spinbutton', { name: 'Monthly Income (ZAR)' })
}

async function enterPersonalDetails() {
  const personalValues = [
    ['Age', '35'],
  ] as const
  for (const [label, value] of personalValues) {
    fireEvent.change(screen.getByRole('spinbutton', { name: label }), {
      target: { value },
    })
  }
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Employment duration (years)' }), { target: { value: '2' } })
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Employment Status' }))
  fireEvent.click(await screen.findByRole('option', { name: 'Employed' }))
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  await screen.findByRole('spinbutton', { name: 'Monthly Income (ZAR)' })
}

async function enterFinancialDetails() {
  const financialValues = [
    ['Monthly Income (ZAR)', '25000'],
    ['Monthly Expenses (ZAR)', '15000'],
    ['Existing Debt (ZAR)', '5000'],
  ] as const
  for (const [label, value] of financialValues) {
    fireEvent.change(screen.getByRole('spinbutton', { name: label }), {
      target: { value },
    })
  }
  expect(screen.queryByRole('checkbox', { name: 'I know my credit score' })).not.toBeInTheDocument()
  const creditScoreSlider = screen.getByRole('slider', { name: 'Credit score' })
  expect(creditScoreSlider).toBeEnabled()
  expect(creditScoreSlider).toHaveAttribute('aria-valuemin', '300')
  expect(creditScoreSlider).toHaveAttribute('aria-valuemax', '850')
  fireEvent.keyDown(creditScoreSlider, { key: 'End' })
  expect(creditScoreSlider).toHaveAttribute('aria-valuenow', '850')
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  await screen.findByRole('radio', { name: 'Personal Loan' })
}

async function enterValidApplication() {
  await enterPersonalDetails()
  await enterFinancialDetails()
  fireEvent.click(screen.getByRole('radio', { name: 'Personal Loan' }))
  const dropdownOptions = [
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
    expect(screen.getByRole('navigation', { name: 'Application progress' })).toBeInTheDocument()
    expect(screen.getAllByText('Personal Details')[0].closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    )
    expect(screen.getByText(/Tell us a little about yourself and your current employment/)).toBeInTheDocument()
    await enterValidApplication()
    expect(screen.getByText('Flexible personal financing for various needs')).toBeInTheDocument()
    expect(screen.getByText('Financing for new and used vehicles')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Personal Loan/ }).closest('label')).toHaveStyle({
      width: '100%',
    })
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
          creditScore: 850,
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

  it('shows product validation feedback when no loan product is selected', async () => {
    const onSubmit = vi.fn()
    render(<LoanEligibilityForm onSubmit={onSubmit} products={loanProducts} validationRules={validationRules} />)

    await enterPersonalDetails()
    await enterFinancialDetails()
    fireEvent.submit(screen.getByRole('form', { name: 'Loan eligibility application' }))

    expect(await screen.findByText('Please select a loan product')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Loan Product' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not show purpose validation until submission and clears it on product change', async () => {
    render(
      <LoanEligibilityForm
        onSubmit={vi.fn()}
        products={loanProducts}
        validationRules={validationRules}
      />,
    )

    await enterPersonalDetails()
    await enterFinancialDetails()
    fireEvent.click(screen.getByRole('radio', { name: 'Personal Loan' }))
    expect(screen.queryByText('Please select a loan purpose')).not.toBeInTheDocument()

    fireEvent.submit(screen.getByRole('form', { name: 'Loan eligibility application' }))
    expect(await screen.findByText('Please select a loan purpose')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: 'Vehicle Finance' }))
    expect(screen.queryByText('Please select a loan purpose')).not.toBeInTheDocument()
  })

  it('always enables the credit score slider and submits its value', async () => {
    const onSubmit = vi.fn()
    render(<LoanEligibilityForm onSubmit={onSubmit} products={loanProducts} validationRules={validationRules} />)

    await enterValidApplication()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('slider', { name: 'Credit score' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await screen.findByRole('radio', { name: 'Personal Loan' })
    fireEvent.submit(screen.getByRole('form', { name: 'Loan eligibility application' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          financialInfo: expect.objectContaining({ creditScore: 850 }),
        }),
      ),
    )
  })

  it('filters purpose and term options after selecting a product', async () => {
    render(<LoanEligibilityForm onSubmit={vi.fn()} products={loanProducts} validationRules={validationRules} />)

    await enterPersonalDetails()
    await enterFinancialDetails()
    fireEvent.click(screen.getByRole('radio', { name: 'Vehicle Finance' }))

    expect(screen.getByRole('spinbutton', { name: 'Requested Loan Amount (ZAR)' })).toHaveAttribute(
      'min',
      '50000',
    )
    expect(screen.getByRole('spinbutton', { name: 'Requested Loan Amount (ZAR)' })).toHaveAttribute(
      'max',
      '1500000',
    )
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Loan Purpose' }))
    expect(await screen.findByRole('option', { name: 'New Vehicle' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Home Improvement' })).not.toBeInTheDocument()
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Loan Term' }))
    expect(await screen.findByRole('option', { name: '72 months' })).toBeInTheDocument()
  })

  it('clears product-dependent values when switching and submits the new product payload', async () => {
    const onSubmit = vi.fn()
    render(<LoanEligibilityForm onSubmit={onSubmit} products={loanProducts} validationRules={validationRules} />)

    await enterValidApplication()
    fireEvent.click(screen.getByRole('radio', { name: 'Vehicle Finance' }))

    expect(screen.getByRole('combobox', { name: 'Loan Purpose' })).toHaveTextContent(
      'Select a loan purpose',
    )
    expect(screen.getByRole('spinbutton', { name: 'Requested Loan Amount (ZAR)' })).toHaveValue(null)
    expect(screen.getByRole('combobox', { name: 'Loan Term' })).toHaveTextContent(
      'Select an option',
    )

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Loan Purpose' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Used Vehicle' }))
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Requested Loan Amount (ZAR)' }), {
      target: { value: '400000' },
    })
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Loan Term' }))
    fireEvent.click(await screen.findByRole('option', { name: '72 months' }))
    fireEvent.submit(screen.getByRole('form', { name: 'Loan eligibility application' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          loanDetails: {
            loanType: 'vehicle_loan',
            requestedAmount: 400000,
            loanTerm: 72,
            loanPurpose: 'used_vehicle',
          },
        }),
      ),
    )
  })

  it('announces loading and empty product states accessibly', async () => {
    const { rerender } = render(
      <LoanEligibilityForm
        onSubmit={vi.fn()}
        products={loanProducts}
        validationRules={validationRules}
        isLoadingProducts
      />,
    )

    await enterPersonalDetails()
    await enterFinancialDetails()
    expect(screen.getByRole('status')).toHaveTextContent('Loading loan products…')

    rerender(
      <LoanEligibilityForm onSubmit={vi.fn()} products={[]} validationRules={validationRules} />,
    )
    expect(screen.getByText('No loan products are currently available.')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Loan Product' })).toBeInTheDocument()
  })

  it('marks required fields with an asterisk and leaves the credit score unmarked', async () => {
    const { container } = render(
      <LoanEligibilityForm onSubmit={vi.fn()} products={loanProducts} validationRules={validationRules} />,
    )
    const asterisks = () => container.querySelectorAll('.MuiFormLabel-asterisk').length

    expect(asterisks()).toBe(3)
    expect(screen.getByRole('spinbutton', { name: 'Age' })).toBeRequired()

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Age' }), { target: { value: '30' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Employment duration (years)' }), { target: { value: '1' } })
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Employment Status' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Employed' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await screen.findByRole('spinbutton', { name: 'Monthly Income (ZAR)' })
    expect(asterisks()).toBe(3)
    expect(screen.queryByText(/Optional\. Set a score/)).not.toBeInTheDocument()
  })

  it('converts employment years and months to total months on submit', async () => {
    const onSubmit = vi.fn()
    render(<LoanEligibilityForm onSubmit={onSubmit} products={loanProducts} validationRules={validationRules} />)

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Employment duration (years)' }), { target: { value: '2' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Employment duration (months)' }), { target: { value: '6' } })
    expect(screen.getByRole('spinbutton', { name: 'Employment duration (years)' })).toHaveValue(2)
    expect(screen.getByRole('spinbutton', { name: 'Employment duration (months)' })).toHaveValue(6)
    await enterPersonalDetailsExceptDuration()
    await enterFinancialDetails()
    fireEvent.click(screen.getByRole('radio', { name: 'Personal Loan' }))
    for (const [label, option] of [['Loan Term', '24 months'], ['Loan Purpose', 'Home Improvement']] as const) {
      fireEvent.mouseDown(screen.getByRole('combobox', { name: label }))
      fireEvent.click(await screen.findByRole('option', { name: option }))
    }
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Requested Loan Amount (ZAR)' }), { target: { value: '150000' } })
    fireEvent.submit(screen.getByRole('form', { name: 'Loan eligibility application' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          personalInfo: expect.objectContaining({ employmentDuration: 30 }),
        }),
      ),
    )
  })

  it('guides the applicant through the steps before showing the eligibility action', async () => {
    render(<LoanEligibilityForm onSubmit={vi.fn()} products={loanProducts} validationRules={validationRules} />)

    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Check Eligibility' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reset Calculator' })).not.toBeInTheDocument()
    await enterValidApplication()
    expect(screen.getByRole('button', { name: 'Check Eligibility' })).toBeInTheDocument()
  })

  it('disables the submit button while checking eligibility', async () => {
    render(<LoanEligibilityForm onSubmit={vi.fn()} products={loanProducts} validationRules={validationRules} isSubmitting />)

    await enterValidApplication()
    expect(screen.getByRole('button', { name: 'Checking Eligibility…' })).toBeDisabled()
  })
})
