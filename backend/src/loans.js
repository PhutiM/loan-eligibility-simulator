import { Router } from 'express'
import {
  calculateEligibility,
  calculateRepayment,
  getLoanProducts,
  getRate,
  getValidationRules,
  validateEligibilityRequest,
  validateRateRequest,
} from './loanHelpers.js'

export const loansRouter = Router()

loansRouter.get('/products', (_request, response) => {
  response.json({ products: getLoanProducts() })
})

loansRouter.get('/validation-rules', (_request, response) => {
  response.json(getValidationRules())
})

loansRouter.post('/calculate-rate', (request, response) => {
  const { errors, requestBody, product } = validateRateRequest(request.body)
  if (errors.length > 0) {
    return response.status(400).json({ error: 'Validation failed', details: errors })
  }

  const interestRate = getRate(requestBody.creditScore, product)
  return response.json({
    interestRate,
    ...calculateRepayment(requestBody.loanAmount, requestBody.loanTerm, interestRate),
  })
})

loansRouter.post('/eligibility', (request, response) => {
  const application = validateEligibilityRequest(request.body)
  if (application.errors.length > 0) {
    return response
      .status(400)
      .json({ error: 'Validation failed', details: application.errors })
  }

  return response.json(calculateEligibility(application))
})
