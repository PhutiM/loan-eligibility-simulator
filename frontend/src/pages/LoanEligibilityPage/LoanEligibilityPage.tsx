import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Button from '../../components/Button/Button'
import EligibilityResult from '../../components/EligibilityResult/EligibilityResult'
import RecommendedLoanCard from './RecommendedLoanCard'
import {
  calculateLoanRate,
  checkLoanEligibility,
  getLoanProducts,
  getValidationRules,
  type LoanProduct,
  type EligibilityResponse,
  type LoanRateResponse,
  type ValidationRules,
} from '../../api/loans'
import LoanEligibilityForm, {
  type LoanEligibilityFormValues,
} from './LoanEligibilityForm/LoanEligibilityForm'
import Summary from '../../components/Summary/Summary'

function LoanEligibilityPage() {
  const [result, setResult] = useState<EligibilityResponse>()
  const [rateCalculation, setRateCalculation] = useState<LoanRateResponse>()
  const [calculatedLoanTerm, setCalculatedLoanTerm] = useState<number>()
  const [apiError, setApiError] = useState('')
  const [rateCalculationError, setRateCalculationError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [products, setProducts] = useState<LoanProduct[]>([])
  const [validationRules, setValidationRules] = useState<ValidationRules>()
  const [loanProductsError, setLoanProductsError] = useState('')
  const [validationRulesError, setValidationRulesError] = useState('')
  const [isLoadingLoanPurposes, setIsLoadingLoanPurposes] = useState(true)
  const [isLoadingValidationRules, setIsLoadingValidationRules] = useState(true)

  useEffect(() => {
    let isMounted = true
    Promise.allSettled([getLoanProducts(), getValidationRules()])
      .then(([productsResult, rulesResult]) => {
        if (!isMounted) return
        if (productsResult.status === 'fulfilled') {
          setProducts(productsResult.value)
        } else {
          setLoanProductsError(
            productsResult.reason instanceof Error
              ? productsResult.reason.message
              : 'Unable to load loan products. Please try again.',
          )
        }
        if (rulesResult.status === 'fulfilled') {
          setValidationRules(rulesResult.value)
        } else {
          setValidationRulesError(
            rulesResult.reason instanceof Error
              ? rulesResult.reason.message
              : 'Unable to load validation rules. Please try again.',
          )
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingLoanPurposes(false)
          setIsLoadingValidationRules(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const checkEligibility = async (values: LoanEligibilityFormValues) => {
    setIsSubmitting(true)
    setApiError('')
    setRateCalculationError('')
    setRateCalculation(undefined)
    setCalculatedLoanTerm(undefined)
    try {
      const eligibility = await checkLoanEligibility(values)
      setResult(eligibility)
      if (eligibility.eligibilityResult.isEligible) {
        try {
          const { loanType, loanTerm } = values.loanDetails
          if (loanTerm === undefined) {
            throw new Error('Select a loan term before calculating repayments.')
          }
          const calculation = await calculateLoanRate({
            loanAmount: eligibility.recommendedLoan.recommendedAmount,
            loanTerm,
            creditScore: values.financialInfo.creditScore ?? 300,
            loanType,
          })
          setRateCalculation(calculation)
          setCalculatedLoanTerm(loanTerm)
        } catch (error) {
          setRateCalculationError(
            error instanceof Error
              ? error.message
              : 'Unable to calculate loan repayments. Please try again.',
          )
        }
      }
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : 'Unable to check eligibility. Please try again.',
      )
      setResult(undefined)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetCalculator = () => {
    setResult(undefined)
    setRateCalculation(undefined)
    setCalculatedLoanTerm(undefined)
    setApiError('')
    setRateCalculationError('')
    setFormKey((currentKey) => currentKey + 1)
  }

  return (
    <Box
      className="grid grid-cols-2 gap-3 pt-3 max-md:grid-cols-1"
    >
      <Card
        elevation={0}
        className="col-span-2 self-start rounded-xl border border-[var(--brand-border)] bg-white/95 max-md:col-span-1"
      >
        <CardContent className="p-6 max-sm:p-5">
          <Typography
            component="h1"
            variant="h4"
            className="mb-2 text-[var(--brand-navy)]"
            sx={{
              fontSize: { xs: 24, sm: 28 },
              fontWeight: 750,
              letterSpacing: '-0.035em',
              lineHeight: 1.2,
            }}
          >
            Loan Eligibility Simulator
          </Typography>
          <Typography
            component="p"
            variant="body1"
            className="max-w-xl text-[var(--brand-muted)]"
            sx={{ fontSize: 14, lineHeight: 1.65 }}
          >
            Enter your details to see your estimated eligibility, recommended
            loan amount and monthly repayments.
          </Typography>
        </CardContent>
      </Card>

      <Box className="grid gap-3">
        {validationRules ? (
          <LoanEligibilityForm
            key={formKey}
            onSubmit={checkEligibility}
            products={products}
            validationRules={validationRules}
            isLoadingProducts={isLoadingLoanPurposes}
            isSubmitting={isSubmitting}
          />
        ) : (
          <Alert severity={validationRulesError ? 'error' : 'info'}>
            {validationRulesError || (isLoadingValidationRules ? 'Loading validation rules…' : '')}
          </Alert>
        )}
        {apiError && <Alert severity="error">{apiError}</Alert>}
        {loanProductsError && <Alert severity="error">{loanProductsError}</Alert>}
      </Box>

      <Box className="flex h-full flex-col gap-3">
        <Card
          elevation={0}
          className="rounded-xl border border-[#c8e1fa] bg-[#eff7ff]"
        >
          <CardContent className="flex gap-3 p-5 max-sm:p-4">
            <Box
              aria-hidden="true"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#0877d1] text-sm font-bold text-white"
            >
              i
            </Box>
            <Box>
              <Typography
                component="h2"
                variant="subtitle1"
                className="text-[#0877d1]"
                sx={{ fontSize: 14, fontWeight: 750 }}
              >
                Important Information
              </Typography>
              <Typography
                component="p"
                variant="body2"
                className="mt-2 text-[var(--brand-muted)]"
                sx={{ fontSize: 12, lineHeight: 1.65 }}
              >
                This is a simplified estimate, not a loan offer or credit
                decision. Actual eligibility depends on credit history, verified
                income, lender affordability rules, fees and other criteria.
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {result ? (
          <Box className="flex flex-1 flex-col gap-3">
            <EligibilityResult
              isEligible={result.eligibilityResult.isEligible}
              approvalLikelihood={result.eligibilityResult.approvalLikelihood}
            />
            {rateCalculation && (
              <RecommendedLoanCard
                className="flex-1"
                recommendedAmount={result.recommendedLoan.recommendedAmount}
                maxAmount={result.recommendedLoan.maxAmount}
                loanTerm={calculatedLoanTerm ?? 0}
                calculation={rateCalculation}
              />
            )}
            {rateCalculationError && <Alert severity="error">{rateCalculationError}</Alert>}
            <Box>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={resetCalculator}
                style={{ textTransform: 'none' }}
              >
                Reset Calculator
              </Button>
            </Box>
          </Box>
        ) : (
          <Card
            elevation={0}
            className="h-full flex-1 overflow-hidden rounded-xl border border-[var(--brand-border)] bg-white/95"
          >
            <CardContent className="flex h-full flex-col p-0">
              <Summary description="Complete the form to see your personalised financial summary, including your estimated loan amount and monthly repayments." />
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  )
}

export default LoanEligibilityPage
