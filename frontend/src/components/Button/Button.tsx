import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button'

type ButtonProps = Omit<MuiButtonProps, 'variant'> & {
  variant?: 'primary' | 'secondary'
}

function Button({
  children,
  className = '',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <MuiButton
      className={className}
      variant={variant === 'primary' ? 'contained' : 'outlined'}
      disableElevation
      sx={
        variant === 'primary'
          ? {
              bgcolor: 'var(--brand-red)',
              '&:hover': { bgcolor: '#c92d29' },
            }
          : {
              borderColor: 'var(--brand-navy)',
              color: 'var(--brand-navy)',
              '&:hover': {
                borderColor: 'var(--brand-navy)',
                bgcolor: 'var(--brand-tint)',
              },
            }
      }
      {...props}
    >
      {children}
    </MuiButton>
  )
}

export default Button
