import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import SvgIcon from '@mui/material/SvgIcon'
import Typography from '@mui/material/Typography'
import type { EligibilityResponse } from '../../api/loans'

type AffordabilityAnalysisProps = {
  analysis: EligibilityResponse['affordabilityAnalysis']
}

const currency = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function AffordabilityAnalysis({ analysis }: AffordabilityAnalysisProps) {
  const scoreColors: Record<string, string> = {
    good: 'bg-[#d1fae5] text-[#047857]',
    fair: 'bg-[#fef3c7] text-[#b45309]',
    poor: 'bg-[#fee2e2] text-[#b91c1c]',
  }
  const scoreColor =
    scoreColors[analysis.affordabilityScore.toLowerCase()] ?? 'bg-[#e2e8f0] text-[#475569]'
  const metrics = [
    ['Disposable Income', currency.format(analysis.disposableIncome)],
    ['Debt to Income Ratio', `${analysis.debtToIncomeRatio.toFixed(1)}%`],
    ['Loan to Income Ratio', `${analysis.loanToIncomeRatio.toFixed(1)}%`],
  ]

  return (
    <Card
      component="section"
      aria-labelledby="affordability-analysis-title"
      elevation={0}
      className="rounded-xl border border-[#c8e1fa] bg-white"
    >
      <CardContent className="p-5 max-sm:p-4">
        <Box className="mb-4 flex items-center gap-2.5">
          <Box className="grid h-8 w-8 place-items-center rounded-full bg-[#e9f4ff] text-[#0877d1]">
            <SvgIcon fontSize="small" aria-hidden="true">
              <path d="M3 3h2v18H3zm4 10h3v8H7zm5-5h3v13h-3zm5-5h3v18h-3z" />
            </SvgIcon>
          </Box>
          <Typography
            id="affordability-analysis-title"
            component="h2"
            variant="subtitle1"
            className="text-[var(--brand-navy)]"
            sx={{ fontSize: 15, fontWeight: 750 }}
          >
            Affordability Analysis
          </Typography>
        </Box>
        <Box className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-3 max-sm:grid-cols-1 max-sm:gap-y-2">
          {metrics.map(([label, value]) => (
            <Box key={label} className="contents">
              <Typography component="p" className="text-[var(--brand-muted)]" sx={{ fontSize: 12 }}>
                {label}
              </Typography>
              <Typography
                component="p"
                className="text-[var(--brand-navy)]"
                sx={{ fontSize: 12, fontWeight: 650 }}
              >
                {value}
              </Typography>
            </Box>
          ))}
          <Typography component="p" className="text-[var(--brand-muted)]" sx={{ fontSize: 12 }}>
            Affordability Score
          </Typography>
          <Typography
            component="p"
            className={`w-fit rounded-full px-3 py-1 capitalize ${scoreColor}`}
            sx={{ fontSize: 12, fontWeight: 700 }}
          >
            {analysis.affordabilityScore}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default AffordabilityAnalysis
