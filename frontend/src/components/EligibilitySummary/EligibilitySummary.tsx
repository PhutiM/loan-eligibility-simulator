import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import SvgIcon from '@mui/material/SvgIcon'
import Typography from '@mui/material/Typography'

type EligibilitySummaryProps = {
  riskCategory: string
  decisionReason: string
}

function EligibilitySummary({ riskCategory, decisionReason }: EligibilitySummaryProps) {
  const riskColors: Record<string, string> = {
    low: 'bg-[#d1fae5] text-[#047857]',
    medium: 'bg-[#fef3c7] text-[#b45309]',
    high: 'bg-[#fee2e2] text-[#b91c1c]',
  }
  const riskColor = riskColors[riskCategory.toLowerCase()] ?? 'bg-[#e2e8f0] text-[#475569]'

  return (
    <Card
      component="section"
      aria-labelledby="eligibility-summary-title"
      elevation={0}
      className="rounded-xl border border-[#c8e1fa] bg-white"
    >
      <CardContent className="p-5 max-sm:p-4">
        <Box className="mb-4 flex items-center gap-2.5">
          <Box className="grid h-8 w-8 place-items-center rounded-full bg-[#e9f4ff] text-[#0877d1]">
            <SvgIcon fontSize="small" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 2.5L17.5 8H14V4.5ZM6 20V4h6v6h6v10H6Zm2-8h8v2H8zm0 4h8v2H8z" />
            </SvgIcon>
          </Box>
          <Typography
            id="eligibility-summary-title"
            component="h2"
            variant="subtitle1"
            className="text-[var(--brand-navy)]"
            sx={{ fontSize: 15, fontWeight: 750 }}
          >
            Eligibility Summary
          </Typography>
        </Box>
        <Box className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] items-center gap-x-4 gap-y-3 max-sm:grid-cols-1 max-sm:gap-y-2">
          <Typography component="p" className="text-[var(--brand-muted)]" sx={{ fontSize: 12 }}>
            Risk Category
          </Typography>
          <Typography
            component="p"
            className={`w-fit rounded-full px-3 py-1 capitalize ${riskColor}`}
            sx={{ fontSize: 12, fontWeight: 700 }}
          >
            {riskCategory}
          </Typography>
          <Typography component="p" className="text-[var(--brand-muted)]" sx={{ fontSize: 12 }}>
            Decision Reason
          </Typography>
          <Typography
            component="p"
            className="text-[var(--brand-navy)]"
            sx={{ fontSize: 12, lineHeight: 1.5 }}
          >
            {decisionReason}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default EligibilitySummary
