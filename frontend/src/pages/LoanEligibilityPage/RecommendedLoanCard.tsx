import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import SvgIcon from '@mui/material/SvgIcon'
import Typography from '@mui/material/Typography'
import type { LoanRateResponse } from '../../api/loans'
import Metric from '../../components/Metric/Metric'

type RecommendedLoanCardProps = {
  className?: string
  recommendedAmount: number
  maxAmount: number
  loanTerm: number
  calculation: LoanRateResponse
}

const zarAmount = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})
const zarCurrency = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function RecommendedLoanCard({
  className,
  recommendedAmount,
  maxAmount,
  loanTerm,
  calculation,
}: RecommendedLoanCardProps) {
  return (
    <Card
      elevation={0}
      className={`h-full rounded-xl border border-[#c8e1fa] bg-white ${className ?? ''}`}
    >
      <CardContent className="flex h-full flex-col p-5 max-sm:p-4">
        <Box className="mb-4 flex items-center gap-2.5">
          <Box className="grid h-8 w-8 place-items-center rounded-full bg-[#e9f4ff] text-[#0877d1]">
            <SvgIcon fontSize="small" aria-hidden="true">
              <path d="M12 2 3 7v2h18V7l-9-5Zm-7 9h2v7H5zm6 0h2v7h-2zm6 0h2v7h-2zM3 20h18v2H3z" />
            </SvgIcon>
          </Box>
          <Typography
            component="h2"
            variant="subtitle1"
            className="text-[var(--brand-navy)]"
            sx={{ fontSize: 15, fontWeight: 750 }}
          >
            Loan Details
          </Typography>
        </Box>

        <Box className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <Box className="border-r border-[#dce9f6] pr-4 max-sm:border-r-0 max-sm:border-b max-sm:pb-3">
            <Typography component="p" className="text-[var(--brand-muted)]" sx={{ fontSize: 12 }}>
              Requested Amount
            </Typography>
            <Typography
              component="p"
              className="mt-1 text-[var(--brand-navy)]"
              sx={{ fontSize: 30, fontWeight: 800, lineHeight: 1.2 }}
            >
              R {zarAmount.format(recommendedAmount)}
            </Typography>
            <Typography component="p" className="mt-1 text-[var(--brand-muted)]" sx={{ fontSize: 12 }}>
              (within your eligible range)
            </Typography>
          </Box>
          <Box className="grid content-center gap-3">
            <Box>
              <Typography component="p" className="text-[var(--brand-muted)]" sx={{ fontSize: 12 }}>
                Maximum Amount
              </Typography>
              <Typography component="p" className="mt-1 text-[var(--brand-navy)]" sx={{ fontSize: 19, fontWeight: 750 }}>
                R {zarAmount.format(maxAmount)}
              </Typography>
            </Box>
            <Box>
              <Typography component="p" className="text-[var(--brand-muted)]" sx={{ fontSize: 12 }}>
                Interest Rate
              </Typography>
              <Typography component="p" className="mt-1 text-[var(--brand-navy)]" sx={{ fontSize: 19, fontWeight: 750 }}>
                {calculation.interestRate}% p.a.
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box className="mt-4 grid grid-cols-3 gap-2 max-sm:grid-cols-1">
          <Metric
            label="Monthly Payment"
            value={`R ${zarCurrency.format(calculation.monthlyPayment)}`}
            icon="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15v1h-2v-1.1a4.2 4.2 0 0 1-3-1.6l1.5-1.2c.6.7 1.3 1.1 2.2 1.1.8 0 1.3-.4 1.3-.9 0-.6-.6-.8-1.8-1.1-1.6-.4-2.9-1-2.9-2.8 0-1.3 1-2.4 2.7-2.7V8h2v.9a4.2 4.2 0 0 1 2.5 1.2l-1.3 1.4c-.6-.5-1.2-.8-1.9-.8-.7 0-1.1.3-1.1.8 0 .5.5.8 1.7 1.1 1.7.4 3 .9 3 2.8 0 1.5-1.1 2.5-2.9 2.8Z"
          />
          <Metric
            label="Total Repayment"
            value={`R ${zarCurrency.format(calculation.totalRepayment)}`}
            icon="M4 4h16v16H4zM7 7v2h10V7zm0 4v2h10v-2zm0 4v2h6v-2z"
          />
          <Metric
            label="Loan Term"
            value={`${loanTerm} months`}
            icon="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V9h14zm-9-9H7v3h3z"
          />
        </Box>
      </CardContent>
    </Card>
  )
}

export default RecommendedLoanCard
