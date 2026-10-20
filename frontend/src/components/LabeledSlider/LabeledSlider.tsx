import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import FormLabel from '@mui/material/FormLabel'
import Slider from '@mui/material/Slider'
import Typography from '@mui/material/Typography'
import { useId } from 'react'

type LabeledSliderProps = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  required?: boolean
  errorMessage?: string
  formatValue?: (value: number) => string
  onChange: (value: number) => void
  className?: string
}

function LabeledSlider({
  label,
  value,
  min,
  max,
  step = 1,
  required = false,
  errorMessage,
  formatValue = String,
  onChange,
  className,
}: LabeledSliderProps) {
  const id = useId()
  const helperId = `${id}-helper`

  return (
    <FormControl error={Boolean(errorMessage)} className={className}>
      <Box className="flex items-center justify-between gap-2">
        <FormLabel component="span" sx={{ color: 'var(--brand-muted)', fontSize: 12 }}>
          {label}
          {required && <span aria-hidden="true" className="MuiFormLabel-asterisk"> *</span>}
        </FormLabel>
        <Typography
          component="span"
          className="text-[var(--brand-navy)]"
          sx={{ fontSize: 13, fontWeight: 700 }}
        >
          {formatValue(value)}
        </Typography>
      </Box>
      <Slider
        aria-label={label}
        slotProps={{ input: { 'aria-describedby': errorMessage ? helperId : undefined } }}
        value={value}
        min={min}
        max={max}
        step={step}
        valueLabelDisplay="auto"
        getAriaValueText={(current) => `${label} ${formatValue(current)}`}
        onChange={(_, next) => {
          if (typeof next === 'number') onChange(next)
        }}
        sx={{
          mt: 1,
          color: '#1976d2',
          '& .MuiSlider-thumb': {
            width: 18,
            height: 18,
            border: '2px solid white',
            boxShadow: '0 0 0 2px #1976d2',
          },
          '& .MuiSlider-rail': { opacity: 1, bgcolor: '#a8d3ff' },
          '& .MuiSlider-track': { border: 0 },
        }}
      />
      <Box className="flex justify-between text-[#617782]">
        <Typography component="span" sx={{ fontSize: 10 }}>
          {formatValue(min)}
        </Typography>
        <Typography component="span" sx={{ fontSize: 10 }}>
          {formatValue(max)}
        </Typography>
      </Box>
      {errorMessage && (
        <FormHelperText id={helperId} className="mx-0">
          {errorMessage}
        </FormHelperText>
      )}
    </FormControl>
  )
}

export default LabeledSlider
