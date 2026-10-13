import type { LoanEligibilityFormValues } from '../pages/LoanEligibilityPage/LoanEligibilityForm/LoanEligibilityForm'

export type EligibilityResponse = {
  eligibilityResult: {
    isEligible: boolean
    approvalLikelihood: number
    riskCategory: string
    decisionReason: string
  }
  recommendedLoan: {
    maxAmount: number
    recommendedAmount: number
    interestRate: number
    monthlyPayment: number
    totalRepayment: number
  }
  affordabilityAnalysis: {
    disposableIncome: number
    debtToIncomeRatio: number
    loanToIncomeRatio: number
    affordabilityScore: string
  }
}

export type LoanRateResponse = {
  interestRate: number
  monthlyPayment: number
  totalInterest: number
  totalRepayment: number
  paymentSchedule: Array<{
    month: number
    payment: number
    principal: number
    interest: number
    balance: number
  }>
}

export type LoanRateRequest = {
  loanAmount: number
  loanTerm: number
  creditScore: number
  loanType: string
}

export type LoanProduct = {
  id: string
  name: string
  minAmount: number
  maxAmount: number
  minTerm: number
  maxTerm: number
  purposes: string[]
}

export type ValidationRule = {
  min?: number
  max?: number
  integer?: boolean
  required: boolean
  options?: string[]
  errorMessage: string
}

export type ValidationRules = {
  personalInfo: {
    age: ValidationRule
    employmentStatus: ValidationRule
    employmentDuration: ValidationRule
  }
  financialInfo: {
    monthlyIncome: ValidationRule
    monthlyExpenses: ValidationRule
    existingDebt: ValidationRule
    creditScore: ValidationRule
  }
  loanDetails: {
    loanType: ValidationRule
    loanPurpose: ValidationRule
    requestedAmount: ValidationRule
    loanTerm: ValidationRule
  }
}

function isValidationRule(value: unknown): value is ValidationRule {
  if (typeof value !== 'object' || value === null) return false
  const rule = value as Record<string, unknown>
  return (
    typeof rule.required === 'boolean' &&
    typeof rule.errorMessage === 'string' &&
    (rule.min === undefined || typeof rule.min === 'number') &&
    (rule.max === undefined || typeof rule.max === 'number') &&
    (rule.integer === undefined || typeof rule.integer === 'boolean') &&
    (rule.options === undefined ||
      (Array.isArray(rule.options) && rule.options.every((option) => typeof option === 'string')))
  )
}

function isValidationRules(value: unknown): value is ValidationRules {
  if (typeof value !== 'object' || value === null) return false
  const rules = value as Record<string, unknown>
  const groups = ['personalInfo', 'financialInfo', 'loanDetails']
  const fields = {
    personalInfo: ['age', 'employmentStatus', 'employmentDuration'],
    financialInfo: ['monthlyIncome', 'monthlyExpenses', 'existingDebt', 'creditScore'],
    loanDetails: ['loanType', 'loanPurpose', 'requestedAmount', 'loanTerm'],
  }
  return groups.every((group) => {
    const section = rules[group]
    if (typeof section !== 'object' || section === null) return false
    const sectionRules = section as Record<string, unknown>
    return fields[group as keyof typeof fields].every((field) => isValidationRule(sectionRules[field]))
  })
}

function isEligibilityResponse(value: unknown): value is EligibilityResponse {
  if (typeof value !== 'object' || value === null) return false
  const response = value as Record<string, unknown>
  const eligibility = response.eligibilityResult
  const loan = response.recommendedLoan
  const affordability = response.affordabilityAnalysis
  if (
    typeof eligibility !== 'object' ||
    eligibility === null ||
    typeof loan !== 'object' ||
    loan === null ||
    typeof affordability !== 'object' ||
    affordability === null
  ) {
    return false
  }
  const eligibilityResult = eligibility as Record<string, unknown>
  const recommendedLoan = loan as Record<string, unknown>
  const affordabilityAnalysis = affordability as Record<string, unknown>
  return (
    typeof eligibilityResult.isEligible === 'boolean' &&
    typeof eligibilityResult.approvalLikelihood === 'number' &&
    typeof eligibilityResult.riskCategory === 'string' &&
    typeof eligibilityResult.decisionReason === 'string' &&
    typeof recommendedLoan.recommendedAmount === 'number' &&
    typeof recommendedLoan.monthlyPayment === 'number' &&
    typeof recommendedLoan.totalRepayment === 'number' &&
    typeof affordabilityAnalysis.disposableIncome === 'number' &&
    typeof affordabilityAnalysis.affordabilityScore === 'string'
  )
}

function isLoanRateResponse(value: unknown): value is LoanRateResponse {
  if (typeof value !== 'object' || value === null) return false
  const response = value as Record<string, unknown>
  return (
    typeof response.interestRate === 'number' &&
    typeof response.monthlyPayment === 'number' &&
    typeof response.totalInterest === 'number' &&
    typeof response.totalRepayment === 'number' &&
    Array.isArray(response.paymentSchedule) &&
    response.paymentSchedule.length > 0
  )
}

function getApiErrorMessage(value: unknown, status: number, operation: string) {
  if (typeof value === 'object' && value !== null) {
    const error = value as { error?: unknown; details?: unknown }
    if (Array.isArray(error.details)) {
      const messages = error.details
        .map((detail) =>
          typeof detail === 'object' && detail !== null && 'message' in detail
            ? detail.message
            : undefined,
        )
        .filter((message): message is string => typeof message === 'string')
      if (messages.length > 0) return messages.join('. ')
    }
    if (typeof error.error === 'string') return error.error
  }
  return `${operation} failed (HTTP ${status}). Please try again.`
}

function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
}

export async function getLoanProducts(): Promise<LoanProduct[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/loans/products`)
  const payload: unknown = await response.json()

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, response.status, 'Loading loan products'))
  }
  const productList =
    typeof payload === 'object' && payload !== null
      ? (payload as { products?: unknown }).products
      : undefined
  if (
    !Array.isArray(productList) ||
    !productList.every(
      (product) =>
        typeof product === 'object' &&
        product !== null &&
        'id' in product &&
        typeof product.id === 'string' &&
        'name' in product &&
        typeof product.name === 'string' &&
        'minAmount' in product &&
        typeof product.minAmount === 'number' &&
        'maxAmount' in product &&
        typeof product.maxAmount === 'number' &&
        'minTerm' in product &&
        typeof product.minTerm === 'number' &&
        'maxTerm' in product &&
        typeof product.maxTerm === 'number' &&
        'purposes' in product &&
        Array.isArray(product.purposes) &&
        product.purposes.every((purpose: unknown) => typeof purpose === 'string'),
    )
  ) {
    throw new Error('The server returned an unexpected loan products response.')
  }

  if (productList.length === 0) {
    throw new Error('No loan products are available.')
  }

  return productList as LoanProduct[]
}

export async function getValidationRules(): Promise<ValidationRules> {
  const response = await fetch(`${getApiBaseUrl()}/api/loans/validation-rules`)
  const payload: unknown = await response.json()

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, response.status, 'Loading validation rules'))
  }
  if (!isValidationRules(payload)) {
    throw new Error('The server returned unexpected validation rules.')
  }

  return payload
}

export async function checkLoanEligibility(
  values: LoanEligibilityFormValues,
): Promise<EligibilityResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/loans/eligibility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
  const payload: unknown = await response.json()

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, response.status, 'Eligibility check'))
  }
  if (!isEligibilityResponse(payload)) {
    throw new Error('The server returned an unexpected eligibility response.')
  }

  return payload
}

export async function calculateLoanRate(values: LoanRateRequest): Promise<LoanRateResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/loans/calculate-rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
  const payload: unknown = await response.json()

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, response.status, 'Loan rate calculation'))
  }
  if (!isLoanRateResponse(payload)) {
    throw new Error('The server returned an unexpected loan rate response.')
  }

  return payload
}
