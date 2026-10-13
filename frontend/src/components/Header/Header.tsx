import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import eligibilityCheck from '../../assets/eligibility-check.svg'

function Header() {
  return (
    <AppBar
      component="header"
      position="static"
      elevation={0}
      sx={{
        color: 'var(--brand-navy)',
        bgcolor: 'rgba(255, 255, 255, 0.92)',
        border: '1px solid var(--brand-border)',
        borderRadius: '12px',
        boxShadow: '0 5px 18px rgb(0 72 109 / 7%)',
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: { xs: 58, sm: 68 },
          gap: { xs: '10px', sm: '18px' },
          px: { xs: 1.5, sm: '22px' },
        }}
      >
        <Box className="flex min-w-0 flex-1 items-center gap-[18px] max-sm:gap-[10px]">
          <Link
            href="#home"
            aria-label="Loan Eligibility home"
            underline="none"
            className="inline-flex shrink-0 items-center gap-2.5 text-[var(--brand-navy)] max-sm:gap-[7px]"
          >
            <Box
              component="img"
              src={eligibilityCheck}
              alt=""
              className="h-[30px] w-[30px] text-[var(--brand-red)] max-sm:h-[26px] max-sm:w-[26px]"
            />
            <Typography
              component="span"
              variant="h6"
              className="max-sm:text-[15px]"
              sx={{
                color: 'var(--brand-navy)',
                fontSize: { xs: 15, sm: 19 },
                fontWeight: 750,
                letterSpacing: '-0.035em',
                whiteSpace: 'nowrap',
              }}
            >
              Loan Eligibility Simulator
            </Typography>
          </Link>
          <Box
            className="h-6 w-px shrink-0 bg-[var(--brand-border)] max-sm:hidden"
            aria-hidden="true"
          />
          <Typography
            component="p"
            variant="body2"
            className="text-xs text-[var(--brand-muted)] max-sm:hidden"
          >
            Know your options. Plan your tomorrow.
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
