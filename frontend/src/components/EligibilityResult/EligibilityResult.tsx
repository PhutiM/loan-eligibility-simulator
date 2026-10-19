import Box from '@mui/material/Box'
import SvgIcon from '@mui/material/SvgIcon'
import Typography from '@mui/material/Typography'

type EligibilityResultProps = {
  isEligible: boolean
  approvalLikelihood: number
}

function EligibilityResult({
  isEligible,
  approvalLikelihood,
}: EligibilityResultProps) {
  const score = Math.max(0, Math.min(100, Math.round(approvalLikelihood)))
  const title = isEligible
    ? 'Good news, you look likely to qualify'
    : "You may not qualify yet"
  const description = isEligible
    ? 'Based on the details you shared, you meet our simulator\'s requirements.'
    : 'Based on the details you shared, you don\'t meet all of our simulator\'s requirements yet. See below for why.'

  return (
    <>
    <Box
      role="status"
      aria-label={`${title}. Estimated approval chance: ${score}%.`}
      className={`flex items-center justify-between gap-5 rounded-xl border px-5 py-4 max-sm:gap-3 max-sm:px-4 ${
        isEligible
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-red-200 bg-red-50'
      }`}
    >
      <Box className="flex min-w-0 items-start gap-4 max-sm:gap-3">
        <Box
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-white ${
            isEligible ? 'bg-emerald-600' : 'bg-[var(--brand-red)]'
          }`}
          aria-hidden="true"
        >
          <SvgIcon aria-hidden="true">
            <path
              d={
                isEligible
                  ? 'm9 16.17-3.88-3.88L3.7 13.7 9 19l11-11-1.41-1.41z'
                  : 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'
              }
            />
          </SvgIcon>
        </Box>
        <Box className="pt-1">
          <Typography
            component="h2"
            variant="h6"
            className={isEligible ? 'text-emerald-700' : 'text-red-700'}
            sx={{ fontSize: 17, fontWeight: 750 }}
          >
            {title}
          </Typography>
          <Typography
            component="p"
            variant="body2"
            className="mt-1 text-[var(--brand-muted)]"
            sx={{ fontSize: 13, lineHeight: 1.6 }}
          >
            {description}
          </Typography>
        </Box>
      </Box>

      <Box className="flex shrink-0 flex-col items-center gap-1">
        <Box
          aria-hidden="true"
          className="grid h-16 w-16 place-items-center rounded-full"
          sx={{
            background: `conic-gradient(${isEligible ? '#059669' : '#e63934'} ${score}%, #dce5e8 ${score}% 100%)`,
          }}
        >
          <Box className="grid h-[52px] w-[52px] place-items-center rounded-full bg-white">
            <Typography
              component="span"
              className="text-[var(--brand-navy)]"
              sx={{ fontSize: 13, fontWeight: 750 }}
            >
              {score}%
            </Typography>
          </Box>
        </Box>
        <Typography
          component="span"
          className={isEligible ? 'text-emerald-700' : 'text-red-700'}
          sx={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}
        >
          Approval chance
        </Typography>
      </Box>
    </Box>
    <Typography
      component="p"
      className="mt-1 text-[var(--brand-muted)]"
      sx={{ fontSize: 11, lineHeight: 1.5 }}
    >
      This percentage is an estimate from simple rules, not a guarantee. The
      final decision is made by the lender.
    </Typography>
    </>
  )
}

export default EligibilityResult
