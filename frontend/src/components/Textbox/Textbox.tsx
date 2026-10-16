import { useId } from 'react'
import FormLabel from '@mui/material/FormLabel'
import TextField, { type TextFieldProps } from '@mui/material/TextField'

type TextboxProps = Omit<TextFieldProps, 'id' | 'label' | 'size' | 'variant'> & {
  id?: string
  label: string
  max?: number | string
  min?: number | string
  step?: number | string
}

function Textbox({ id, label, className, max, min, step, required, ...props }: TextboxProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const labelId = `${inputId}-label`

  return (
    <div className={className}>
      <FormLabel
        id={labelId}
        htmlFor={inputId}
        required={required}
        className="mb-1 block text-xs text-[var(--brand-muted)]"
        sx={{ color: 'var(--brand-muted)', fontSize: 12, lineHeight: 1.5 }}
      >
        {label}
      </FormLabel>
      <TextField
        id={inputId}
        variant="outlined"
        size="small"
        fullWidth
        slotProps={{
          htmlInput: { 'aria-labelledby': labelId, 'aria-required': required || undefined, max, min, step },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '7px',
            color: 'var(--brand-navy)',
            fontSize: 14,
            '& fieldset': { borderColor: 'var(--brand-border)' },
            '&:hover fieldset': { borderColor: 'var(--brand-navy)' },
            '&.Mui-focused fieldset': { borderColor: '#0877d1' },
          },
          '& input': { padding: '9px 12px' },
          '& input::placeholder': { color: 'var(--brand-muted)', opacity: 1 },
          '& input[type=number]': { MozAppearance: 'textfield' },
          '& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button': {
            WebkitAppearance: 'none',
            margin: 0,
          },
        }}
        {...props}
      />
    </div>
  )
}

export default Textbox
