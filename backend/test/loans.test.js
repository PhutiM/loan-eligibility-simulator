import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import app from '../src/index.js'

let server
let baseUrl

before(async () => {
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://localhost:${server.address().port}`
})

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
})

test('GET /api/loans/products returns supported loan products', async () => {
  const response = await fetch(`${baseUrl}/api/loans/products`)
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.deepEqual(
    body.products.map(({ id }) => id),
    ['personal_loan', 'vehicle_loan'],
  )
  assert.equal(body.products[0].maxAmount, 300000)
})

test('GET /api/loans/validation-rules returns form constraints', async () => {
  const response = await fetch(`${baseUrl}/api/loans/validation-rules`)
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.personalInfo.age.min, 18)
  assert.equal(body.financialInfo.existingDebt.min, 0)
  assert.equal(body.loanDetails.loanPurpose.required, true)
  assert.equal(body.loanDetails.loanTerm.max, 60)
})

test('GET /api/openapi.yaml serves the OpenAPI document', async () => {
  const response = await fetch(`${baseUrl}/api/openapi.yaml`)
  const body = await response.text()

  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /yaml/)
  assert.match(body, /\/api\/loans\/eligibility:/)
  assert.match(body, /\/api\/loans\/calculate-rate:/)
})

test('GET /api/docs serves Swagger UI', async () => {
  const response = await fetch(`${baseUrl}/api/docs/`)
  const body = await response.text()

  assert.equal(response.status, 200)
  assert.match(body, /Swagger UI/)
})

test('POST /api/loans/calculate-rate calculates an amortizing payment schedule', async () => {
  const response = await fetch(`${baseUrl}/api/loans/calculate-rate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      loanAmount: 150000,
      loanTerm: 24,
      creditScore: 650,
      loanType: 'personal_loan',
    }),
  })
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.interestRate, 12.5)
  assert.equal(body.paymentSchedule.length, 24)
  assert.equal(body.paymentSchedule[0].month, 1)
  assert.equal(body.paymentSchedule.at(-1).balance, 0)
  assert.equal(
    body.totalRepayment,
    Math.round(
      body.paymentSchedule.reduce((total, payment) => total + payment.payment, 0) * 100,
    ) / 100,
  )
  assert.equal(
    body.totalInterest,
    Math.round((body.totalRepayment - 150000) * 100) / 100,
  )
})

test('POST /api/loans/calculate-rate rejects amounts outside product limits', async () => {
  const response = await fetch(`${baseUrl}/api/loans/calculate-rate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      loanAmount: 10000,
      loanTerm: 24,
      creditScore: 650,
      loanType: 'vehicle_loan',
    }),
  })
  const body = await response.json()

  assert.equal(response.status, 400)
  assert.equal(body.error, 'Validation failed')
  assert.equal(body.details[0].field, 'loanAmount')
})

test('POST /api/loans/eligibility evaluates a valid application', async () => {
  const response = await fetch(`${baseUrl}/api/loans/eligibility`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
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
    }),
  })
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.eligibilityResult.isEligible, true)
  assert.equal(body.eligibilityResult.riskCategory, 'low')
  assert.equal(body.eligibilityResult.approvalLikelihood, 85)
  assert.equal(body.recommendedLoan.maxAmount, 180000)
  assert.equal(body.affordabilityAnalysis.disposableIncome, 10000)
  assert.equal(body.affordabilityAnalysis.debtToIncomeRatio, 20)
})

test('POST /api/loans/eligibility uses the selected vehicle product limits and purposes', async () => {
  const response = await fetch(`${baseUrl}/api/loans/eligibility`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      personalInfo: {
        age: 35,
        employmentStatus: 'employed',
        employmentDuration: 24,
      },
      financialInfo: {
        monthlyIncome: 50000,
        monthlyExpenses: 20000,
        existingDebt: 0,
        creditScore: 700,
      },
      loanDetails: {
        loanType: 'vehicle_loan',
        requestedAmount: 200000,
        loanTerm: 36,
        loanPurpose: 'new_vehicle',
      },
    }),
  })
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.eligibilityResult.isEligible, true)
  assert.equal(body.recommendedLoan.recommendedAmount, 200000)
  assert.ok(body.recommendedLoan.interestRate >= 8.5)
  assert.ok(body.recommendedLoan.interestRate <= 15)
})

test('POST /api/loans/eligibility returns field errors for invalid input', async () => {
  const response = await fetch(`${baseUrl}/api/loans/eligibility`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ personalInfo: { age: 17 } }),
  })
  const body = await response.json()

  assert.equal(response.status, 400)
  assert.equal(body.error, 'Validation failed')
  assert.ok(body.details.some(({ field }) => field === 'personalInfo.age'))
  assert.ok(body.details.some(({ field }) => field === 'financialInfo.monthlyIncome'))
})
