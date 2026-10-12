const products = [
  {
    id: 'personal_loan',
    name: 'Personal Loan',
    description: 'Flexible personal financing for various needs',
    minAmount: 5000,
    maxAmount: 300000,
    minTerm: 6,
    maxTerm: 60,
    interestRateRange: { min: 10.5, max: 18.5 },
    purposes: [
      'debt_consolidation',
      'home_improvement',
      'education',
      'medical',
      'other',
    ],
  },
  {
    id: 'vehicle_loan',
    name: 'Vehicle Finance',
    description: 'Financing for new and used vehicles',
    minAmount: 50000,
    maxAmount: 1500000,
    minTerm: 12,
    maxTerm: 72,
    interestRateRange: { min: 8.5, max: 15 },
    purposes: ['new_vehicle', 'used_vehicle'],
  },
]

const validationRules = {
  personalInfo: {
    age: {
      min: 18,
      max: 65,
      integer: true,
      required: true,
      errorMessage: 'Age must be between 18 and 65',
    },
    employmentStatus: {
      required: true,
      options: ['employed', 'self_employed', 'unemployed', 'retired'],
      errorMessage: 'Please select your employment status',
    },
    employmentDuration: {
      min: 3,
      integer: true,
      required: true,
      errorMessage: 'Minimum 3 months employment required',
    },
  },
  financialInfo: {
    monthlyIncome: {
      min: 5000,
      required: true,
      errorMessage: 'Minimum monthly income of R5,000 required',
    },
    monthlyExpenses: {
      min: 0,
      required: true,
      errorMessage: 'Please enter your monthly expenses',
    },
    existingDebt: {
      min: 0,
      required: true,
      errorMessage: 'Please enter your existing debt',
    },
    creditScore: {
      min: 300,
      max: 850,
      integer: true,
      required: false,
      errorMessage: 'Credit score must be between 300 and 850',
    },
  },
  loanDetails: {
    loanType: {
      required: true,
      options: products.map(({ id }) => id),
      errorMessage: 'Please select a loan product',
    },
    loanPurpose: {
      required: true,
      errorMessage: 'Please select a loan purpose',
    },
    requestedAmount: {
      min: 5000,
      max: 300000,
      required: true,
      errorMessage: 'Loan amount must be between R5,000 and R300,000',
    },
    loanTerm: {
      min: 6,
      max: 60,
      integer: true,
      required: true,
      errorMessage: 'Loan term must be between 6 and 60 months',
    },
  },
}

const roundMoney = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function validateNumber(value, field, errors, { min, max, integer = false, errorMessage }) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    errors.push({ field, message: errorMessage ?? `${field} must be a number` })
    return false
  }

  if (integer && !Number.isInteger(value)) {
    errors.push({ field, message: errorMessage ?? `${field} must be an integer` })
    return false
  }

  if (min !== undefined && value < min) {
    errors.push({ field, message: errorMessage ?? `${field} must be at least ${min}` })
    return false
  }

  if (max !== undefined && value > max) {
    errors.push({ field, message: errorMessage ?? `${field} must be at most ${max}` })
    return false
  }

  return true
}

function getRate(creditScore, product) {
  const score = creditScore ?? 300
  const rateOffset =
    score >= 750
      ? 0
      : score >= 700
        ? 1
        : score >= 650
          ? 2
          : score >= 600
            ? 4
            : score >= 500
              ? 6
              : 8
  const rate = product.interestRateRange.min + rateOffset
  return Math.min(rate, product.interestRateRange.max)
}

function calculateRepayment(loanAmount, loanTerm, interestRate) {
  const monthlyRate = interestRate / 100 / 12
  const monthlyPayment =
    monthlyRate === 0
      ? loanAmount / loanTerm
      : (loanAmount * monthlyRate) / (1 - (1 + monthlyRate) ** -loanTerm)
  const paymentSchedule = []
  let balance = loanAmount

  for (let month = 1; month <= loanTerm; month += 1) {
    const interest = roundMoney(balance * monthlyRate)
    const payment =
      month === loanTerm
        ? roundMoney(balance + interest)
        : roundMoney(monthlyPayment)
    const principal = roundMoney(payment - interest)
    balance = roundMoney(Math.max(0, balance - principal))
    paymentSchedule.push({
      month,
      payment,
      principal,
      interest,
      balance: month === loanTerm ? 0 : balance,
    })
  }

  const totalRepayment = roundMoney(
    paymentSchedule.reduce((total, installment) => total + installment.payment, 0),
  )

  return {
    monthlyPayment: roundMoney(monthlyPayment),
    totalInterest: roundMoney(totalRepayment - loanAmount),
    totalRepayment,
    paymentSchedule,
  }
}

function validateEligibilityRequest(body) {
  const errors = []
  const personalInfo = isRecord(body?.personalInfo) ? body.personalInfo : {}
  const financialInfo = isRecord(body?.financialInfo) ? body.financialInfo : {}
  const loanDetails = isRecord(body?.loanDetails) ? body.loanDetails : {}
  const loanType = loanDetails.loanType ?? 'personal_loan'
  const product = products.find(({ id }) => id === loanType)

  if (!isRecord(body?.personalInfo)) {
    errors.push({ field: 'personalInfo', message: 'personalInfo must be an object' })
  }
  if (!isRecord(body?.financialInfo)) {
    errors.push({ field: 'financialInfo', message: 'financialInfo must be an object' })
  }
  if (!isRecord(body?.loanDetails)) {
    errors.push({ field: 'loanDetails', message: 'loanDetails must be an object' })
  }

  validateNumber(personalInfo.age, 'personalInfo.age', errors, validationRules.personalInfo.age)
  if (!validationRules.personalInfo.employmentStatus.options.includes(personalInfo.employmentStatus)) {
    errors.push({
      field: 'personalInfo.employmentStatus',
      message: validationRules.personalInfo.employmentStatus.errorMessage,
    })
  }
  validateNumber(
    personalInfo.employmentDuration,
    'personalInfo.employmentDuration',
    errors,
    validationRules.personalInfo.employmentDuration,
  )
  validateNumber(
    financialInfo.monthlyIncome,
    'financialInfo.monthlyIncome',
    errors,
    validationRules.financialInfo.monthlyIncome,
  )
  validateNumber(
    financialInfo.monthlyExpenses,
    'financialInfo.monthlyExpenses',
    errors,
    validationRules.financialInfo.monthlyExpenses,
  )
  validateNumber(
    financialInfo.existingDebt,
    'financialInfo.existingDebt',
    errors,
    validationRules.financialInfo.existingDebt,
  )

  if (financialInfo.creditScore !== undefined && financialInfo.creditScore !== null) {
    validateNumber(financialInfo.creditScore, 'financialInfo.creditScore', errors, {
      ...validationRules.financialInfo.creditScore,
    })
  }

  if (!validationRules.loanDetails.loanType.options.includes(loanType)) {
    errors.push({
      field: 'loanDetails.loanType',
      message: validationRules.loanDetails.loanType.errorMessage,
    })
  }

  validateNumber(loanDetails.requestedAmount, 'loanDetails.requestedAmount', errors, {
    min: product?.minAmount ?? products[0].minAmount,
    max: product?.maxAmount ?? products[0].maxAmount,
    errorMessage: product
      ? `Loan amount must be between R${product.minAmount.toLocaleString()} and R${product.maxAmount.toLocaleString()}`
      : validationRules.loanDetails.requestedAmount.errorMessage,
  })
  validateNumber(loanDetails.loanTerm, 'loanDetails.loanTerm', errors, {
    ...validationRules.loanDetails.loanTerm,
    min: product?.minTerm ?? products[0].minTerm,
    max: product?.maxTerm ?? products[0].maxTerm,
    errorMessage: product
      ? `Loan term must be between ${product.minTerm} and ${product.maxTerm} months`
      : validationRules.loanDetails.loanTerm.errorMessage,
  })
  if (product && !product.purposes.includes(loanDetails.loanPurpose)) {
    errors.push({
      field: 'loanDetails.loanPurpose',
      message: validationRules.loanDetails.loanPurpose.errorMessage,
    })
  }

  return { errors, personalInfo, financialInfo, loanDetails, product }
}

function validateRateRequest(body) {
  const errors = []
  const requestBody = isRecord(body) ? body : {}

  if (!isRecord(body)) {
    errors.push({ field: 'body', message: 'Request body must be an object' })
  }
  validateNumber(requestBody.loanAmount, 'loanAmount', errors, { min: 1 })
  validateNumber(requestBody.loanTerm, 'loanTerm', errors, { min: 1, integer: true })
  validateNumber(requestBody.creditScore, 'creditScore', errors, {
    min: 300,
    max: 850,
    integer: true,
  })

  const product = products.find(({ id }) => id === requestBody.loanType)
  if (!product) {
    errors.push({
      field: 'loanType',
      message: 'loanType must be personal_loan or vehicle_loan',
    })
  }
  if (errors.length === 0) {
    if (requestBody.loanAmount < product.minAmount || requestBody.loanAmount > product.maxAmount) {
      errors.push({
        field: 'loanAmount',
        message: `loanAmount must be between ${product.minAmount} and ${product.maxAmount} for ${product.id}`,
      })
    }
    if (requestBody.loanTerm < product.minTerm || requestBody.loanTerm > product.maxTerm) {
      errors.push({
        field: 'loanTerm',
        message: `loanTerm must be between ${product.minTerm} and ${product.maxTerm} for ${product.id}`,
      })
    }
  }

  return { errors, requestBody, product }
}

function calculateEligibility(application) {
  const { personalInfo, financialInfo, loanDetails } = application
  const product = application.product ?? products[0]
  const creditScore = financialInfo.creditScore ?? 300
  const disposableIncome = roundMoney(financialInfo.monthlyIncome - financialInfo.monthlyExpenses)
  const debtToIncomeRatio = roundMoney(
    (financialInfo.existingDebt / financialInfo.monthlyIncome) * 100,
  )
  const maxAmount = roundMoney(
    Math.min(product.maxAmount, Math.max(0, disposableIncome * 18)),
  )
  const loanToIncomeRatio = roundMoney(
    (maxAmount / (financialInfo.monthlyIncome * 12)) * 100,
  )
  const interestRate = getRate(creditScore, product)
  const repayment = calculateRepayment(
    loanDetails.requestedAmount,
    loanDetails.loanTerm,
    interestRate,
  )
  const monthlyDebtRatio =
    ((financialInfo.existingDebt + repayment.monthlyPayment) /
      financialInfo.monthlyIncome) *
    100
  const employed = ['employed', 'self_employed'].includes(personalInfo.employmentStatus)
  const isEligible =
    employed &&
    creditScore >= 600 &&
    maxAmount >= product.minAmount &&
    loanDetails.requestedAmount <= maxAmount &&
    monthlyDebtRatio <= 55
  const riskCategory =
    creditScore >= 650 && debtToIncomeRatio <= 30
      ? 'low'
      : creditScore >= 600 && monthlyDebtRatio <= 55
        ? 'medium'
        : 'high'
  const affordabilityScore =
    debtToIncomeRatio <= 30 ? 'good' : debtToIncomeRatio <= 45 ? 'fair' : 'poor'
  const approvalLikelihood = Math.max(
    5,
    Math.min(
      95,
      Math.round(
        80 +
          (creditScore - 650) * 0.1 -
          Math.max(0, debtToIncomeRatio - 20) * 0.5 +
          (employed ? 5 : -20),
      ),
    ),
  )

  return {
    eligibilityResult: {
      isEligible,
      approvalLikelihood,
      riskCategory,
      decisionReason: isEligible
        ? 'Strong income-to-expense ratio and manageable existing debt'
        : 'The application does not meet the income, employment, credit, or affordability criteria',
    },
    recommendedLoan: {
      maxAmount,
      recommendedAmount: isEligible ? loanDetails.requestedAmount : maxAmount,
      interestRate,
      monthlyPayment: repayment.monthlyPayment,
      totalRepayment: repayment.totalRepayment,
    },
    affordabilityAnalysis: {
      disposableIncome,
      debtToIncomeRatio,
      loanToIncomeRatio,
      affordabilityScore,
    },
  }
}

export {
  calculateEligibility,
  calculateRepayment,
  getLoanProducts,
  getRate,
  getValidationRules,
  validateEligibilityRequest,
  validateRateRequest,
}

function getLoanProducts() {
  return products
}

function getValidationRules() {
  return validationRules
}
