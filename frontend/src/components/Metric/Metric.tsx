import Box from '@mui/material/Box'
import SvgIcon from '@mui/material/SvgIcon'
import Typography from '@mui/material/Typography'

type MetricProps = {
  label: string
  value: string
  icon: string
}

function Metric({ label, value, icon }: MetricProps) {
  return (
    <Box className="flex min-w-0 items-start gap-2.5 rounded-lg bg-[#f0f7ff] px-3 py-3">
      <SvgIcon className="mt-0.5 shrink-0 text-[#0877d1]" fontSize="small" aria-hidden="true">
        <path d={icon} />
      </SvgIcon>
      <Box className="min-w-0">
        <Typography component="p" className="text-[var(--brand-muted)]" sx={{ fontSize: 12 }}>
          {label}
        </Typography>
        <Typography
          component="p"
          className="mt-1 text-[var(--brand-navy)]"
          sx={{ fontSize: 16, fontWeight: 750, overflowWrap: 'anywhere' }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  )
}

export default Metric
