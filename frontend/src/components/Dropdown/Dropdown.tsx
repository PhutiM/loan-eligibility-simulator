import { useId } from 'react'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import FormLabel from '@mui/material/FormLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectProps } from '@mui/material/Select'

export type DropdownOption = {
  label: string
  value: string
}

type DropdownProps = Omit<SelectProps<string>, 'children' | 'label' | 'labelId' | 'size'> & {
  id?: string
  label: string
  options: DropdownOption[]
  placeholder?: string
  error?: boolean
  helperText?: string
}

function Dropdown({
  id,
  label,
  options,
  placeholder = 'Select an option',
  className,
  error = false,
  helperText,
  required,
  ...props
}: DropdownProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const labelId = `${selectId}-label`

  return (
    <FormControl className={className} fullWidth size="small" error={error} required={required}>
      <FormLabel
        id={labelId}
        htmlFor={selectId}
        className="mb-1 block text-xs text-[var(--brand-muted)]"
        sx={{ color: 'var(--brand-muted)', fontSize: 12, lineHeight: 1.5 }}
      >
        {label}
      </FormLabel>
      <Select
        id={selectId}
        labelId={labelId}
        aria-labelledby={labelId}
        error={error}
        defaultValue=""
        displayEmpty
        renderValue={(selected) => {
          if (selected === '') {
            return <span className="text-[var(--brand-muted)]">{placeholder}</span>
          }

          return options.find((option) => option.value === selected)?.label ?? selected
        }}
        sx={{
          borderRadius: '7px',
          color: 'var(--brand-navy)',
          fontSize: 14,
          '& .MuiSelect-select': { padding: '9px 12px' },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--brand-border)' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--brand-navy)' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0877d1' },
        }}
        {...props}
      >
        <MenuItem value="">
          <em>{placeholder}</em>
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  )
}

export default Dropdown
