import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import loanStartIllustration from '../../assets/loan-start-illustration.svg'

type FinancialSummaryProps = {
  children?: ReactNode
  title?: string
  description?: string
}

function Summary({
  children,
  title = 'Ready to get started?',
  description = 'Complete the form to see your personalised financial summary, including your estimated loan amount and monthly repayments.',
}: FinancialSummaryProps) {
  return (
    <Box className="flex h-full flex-col justify-center px-6 py-6 max-sm:px-4">
      <Box className="flex items-center justify-center gap-3">
        <Typography
          component="h2"
          variant="h6"
          className="text-[var(--brand-navy)]"
          sx={{ fontSize: 17, fontWeight: 750 }}
        >
          {title}
        </Typography>
      </Box>

      {children ?? (
        <Box className="flex flex-col items-center gap-3 pt-4 text-center">
          <Box
            component="img"
            src={loanStartIllustration}
            alt=""
            className="h-32 w-48 object-contain"
          />
          <Typography
            component="p"
            variant="body2"
            className="max-w-xs text-[var(--brand-muted)]"
            sx={{ fontSize: 13, lineHeight: 1.65, textAlign: 'center' }}
          >
            {description}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default Summary
