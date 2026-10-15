import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  Controller,
  useForm,
  type FieldErrors,
  type FieldPath,
  type SubmitHandler,
} from 'react-hook-form'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import FormLabel from '@mui/material/FormLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Slider from '@mui/material/Slider'
import SvgIcon from '@mui/material/SvgIcon'
import Typography from '@mui/material/Typography'
import ApplicationStepper from '../../../components/ApplicationStepper/ApplicationStepper'
import Button from '../../../components/Button/Button'
import Dropdown from '../../../components/Dropdown/Dropdown'
import Textbox from '../../../components/Textbox/Textbox'
import type { LoanProduct, ValidationRules } from '../../../api/loans'

export type LoanEligibilityFormValues = {
  personalInfo: {
    age: number
    employmentStatus: string
    employmentDuration: number
  }
  financialInfo: {
    monthlyIncome: number
    monthlyExpenses: number
    existingDebt: number
    creditScore?: number
  }
  loanDetails: {
    loanType: string
    requestedAmount?: number
    loanTerm?: number
    loanPurpose: string
  }
}

const stepFields: FieldPath<LoanEligibilityFormValues>[][] = [
  [
    'personalInfo.age',
    'personalInfo.employmentStatus',
    'personalInfo.employmentDuration',
  ],
  [
    'financialInfo.monthlyIncome',
    'financialInfo.monthlyExpenses',
    'financialInfo.existingDebt',
    'financialInfo.creditScore',
  ],
  [
    'loanDetails.loanType',
    'loanDetails.loanPurpose',
    'loanDetails.requestedAmount',
    'loanDetails.loanTerm',
  ],
]

const stepTitles = ['Personal Details', 'Financial Information', 'Loan Details']

type LoanEligibilityFormProps = {
  onSubmit: (values: LoanEligibilityFormValues) => void | Promise<void>
  onValuesChange?: () => void
  products: LoanProduct[]
  validationRules: ValidationRules
  isLoadingProducts?: boolean
  isSubmitting?: boolean
}

function SectionIcon({ kind }: { kind: 'person' | 'finance' | 'loan' }) {
  const paths = {
    person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z',
    finance:
      'M20 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Zm0 12H4V9h16v9ZM7 4h12v2H7zM15 13h4v2h-4z',
    loan: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 3.5L16.5 8H14V5.5ZM6 20V4h6v6h6v10H6Zm2-8h8v2H8zm0 4h8v2H8z',
  }

  return (
    <Box className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--brand-tint)] text-[var(--brand-navy)]">
      <SvgIcon fontSize="small" aria-hidden="true">
        <path d={paths[kind]} />
      </SvgIcon>
    </Box>
  )
}

function FormSection({
  title,
  icon,
  children,
}: {
  title: string
  icon: 'person' | 'finance' | 'loan'
  children: ReactNode
}) {
  return (
    <Box component="section">
      <Box className="mb-5 flex items-center gap-3">
        <SectionIcon kind={icon} />
        <Typography
          component="h2"
          variant="subtitle1"
          className="text-[var(--brand-navy)]"
          sx={{ fontSize: 15, fontWeight: 750 }}
        >
          {title}
        </Typography>
      </Box>
      {children}
    </Box>
  )
}

function LoanEligibilityForm({
  onSubmit,
  onValuesChange,
  products,
  validationRules,
  isLoadingProducts = false,
  isSubmitting = false,
}: LoanEligibilityFormProps) {
  const {
    register,
    control,
    handleSubmit,
    trigger,
    clearErrors,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoanEligibilityFormValues>({
    defaultValues: {
      personalInfo: {
        age: undefined,
        employmentStatus: '',
        employmentDuration: undefined,
      },
      financialInfo: {
        monthlyIncome: undefined,
        monthlyExpenses: undefined,
        existingDebt: undefined,
        creditScore: undefined,
      },
      loanDetails: {
        loanType: '',
        requestedAmount: undefined,
        loanTerm: undefined,
        loanPurpose: '',
      },
    },
  })

  const [activeStep, setActiveStep] = useState(0)
  const [isCreditScoreKnown, setIsCreditScoreKnown] = useState(false)
  const selectedLoanType = watch('loanDetails.loanType')
  const selectedProduct = products.find(({ id }) => id === selectedLoanType)
  const creditScoreMin = validationRules.financialInfo.creditScore.min ?? 300
  const creditScoreMax = validationRules.financialInfo.creditScore.max ?? 850
  const amountErrorMessage = selectedProduct
    ? `Loan amount must be between R${selectedProduct.minAmount.toLocaleString()} and R${selectedProduct.maxAmount.toLocaleString()}`
    : validationRules.loanDetails.requestedAmount.errorMessage
  const termErrorMessage = selectedProduct
    ? `Loan term must be between ${selectedProduct.minTerm} and ${selectedProduct.maxTerm} months`
    : validationRules.loanDetails.loanTerm.errorMessage
  const employmentOptions =
    validationRules.personalInfo.employmentStatus.options?.map((status) => ({
      value: status,
      label: status
        .split('_')
        .map((word, index) =>
          index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word,
        )
        .join(status.includes('_') ? '-' : ' '),
    })) ?? []
  const termOptions = selectedProduct
    ? Array.from(
        new Set([
          ...Array.from(
            { length: Math.floor((selectedProduct.maxTerm - selectedProduct.minTerm) / 6) + 1 },
            (_, index) => selectedProduct.minTerm + index * 6,
          ),
          selectedProduct.maxTerm,
        ]),
      ).map((months) => ({ value: String(months), label: `${months} months` }))
    : []
  const purposeOptions = selectedProduct
    ? selectedProduct.purposes.map((purpose) => ({
        value: purpose,
        label: purpose
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
      }))
    : []

  const submitForm: SubmitHandler<LoanEligibilityFormValues> = (values) => onSubmit(values)
  const handleInvalidSubmit = (invalidFields: FieldErrors<LoanEligibilityFormValues>) => {
    if (invalidFields.personalInfo) {
      setActiveStep(0)
    } else if (invalidFields.financialInfo) {
      setActiveStep(1)
    } else if (invalidFields.loanDetails) {
      setActiveStep(2)
    }
  }
  const goToNextStep = async () => {
    if (await trigger(stepFields[activeStep])) {
      setActiveStep((currentStep) => Math.min(currentStep + 1, stepTitles.length - 1))
    }
  }

  return (
    <Box
      component="form"
      aria-label="Loan eligibility application"
      noValidate
      className="grid content-start gap-3"
      onSubmit={handleSubmit(submitForm, handleInvalidSubmit)}
      onChange={onValuesChange}
    >
      <Box className="rounded-xl border border-[var(--brand-border)] bg-white p-5 max-sm:p-4">
        <ApplicationStepper steps={stepTitles} activeStep={activeStep}>
          <Box className="grid content-start gap-5">
            <Typography
              component="p"
              className="text-[var(--brand-muted)]"
              sx={{ fontSize: 12, lineHeight: 1.5 }}
            >
              {activeStep === 0 &&
                'Tell us a little about yourself and your current employment. You can go back to edit any answers.'}
              {activeStep === 1 &&
                'Enter monthly amounts in rand. Your credit score is optional.'}
              {activeStep === 2 &&
                'Choose a loan product to see its available amount and repayment term ranges.'}
            </Typography>

      {activeStep === 0 && <FormSection title="Personal Information" icon="person">
        <Box className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
          <Textbox
            label="Age"
            required={validationRules.personalInfo.age.required}
            type="number"
            placeholder="Enter Age"
            min={validationRules.personalInfo.age.min}
            max={validationRules.personalInfo.age.max}
            error={Boolean(errors.personalInfo?.age)}
            helperText={errors.personalInfo?.age?.message}
            {...register('personalInfo.age', {
              valueAsNumber: true,
              required: validationRules.personalInfo.age.required
                ? validationRules.personalInfo.age.errorMessage
                : false,
              validate: (value) =>
                (validationRules.personalInfo.age.min === undefined ||
                  value >= validationRules.personalInfo.age.min) &&
                (validationRules.personalInfo.age.max === undefined ||
                  value <= validationRules.personalInfo.age.max) &&
                (!validationRules.personalInfo.age.integer || Number.isInteger(value)) ||
                validationRules.personalInfo.age.errorMessage,
            })}
          />
          <Controller
            name="personalInfo.employmentStatus"
            control={control}
            rules={{
              required: validationRules.personalInfo.employmentStatus.required
                ? validationRules.personalInfo.employmentStatus.errorMessage
                : false,
              validate: (value) =>
                !validationRules.personalInfo.employmentStatus.options ||
                validationRules.personalInfo.employmentStatus.options.includes(value) ||
                validationRules.personalInfo.employmentStatus.errorMessage,
            }}
            render={({ field }) => (
              <Dropdown
                {...field}
                label="Employment Status"
            required={validationRules.personalInfo.employmentStatus.required}
                options={employmentOptions}
                error={Boolean(errors.personalInfo?.employmentStatus)}
                helperText={errors.personalInfo?.employmentStatus?.message}
              />
            )}
          />
          <Textbox
            label="Employment Duration (months)"
            required={validationRules.personalInfo.employmentDuration.required}
            type="number"
            placeholder="Enter Employment Duration"
            min={validationRules.personalInfo.employmentDuration.min}
            error={Boolean(errors.personalInfo?.employmentDuration)}
            helperText={errors.personalInfo?.employmentDuration?.message}
            {...register('personalInfo.employmentDuration', {
              valueAsNumber: true,
              required: validationRules.personalInfo.employmentDuration.required
                ? validationRules.personalInfo.employmentDuration.errorMessage
                : false,
              validate: (value) =>
                (validationRules.personalInfo.employmentDuration.min === undefined ||
                  value >= validationRules.personalInfo.employmentDuration.min) &&
                (!validationRules.personalInfo.employmentDuration.integer ||
                  Number.isInteger(value)) ||
                validationRules.personalInfo.employmentDuration.errorMessage,
            })}
          />
        </Box>
      </FormSection>}

      {activeStep === 1 && <FormSection title="Financial Information" icon="finance">
        <Box className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <Textbox
            label="Monthly Income (ZAR)"
            required={validationRules.financialInfo.monthlyIncome.required}
            type="number"
            placeholder="Enter Monthly Income"
            min={validationRules.financialInfo.monthlyIncome.min}
            error={Boolean(errors.financialInfo?.monthlyIncome)}
            helperText={errors.financialInfo?.monthlyIncome?.message}
            {...register('financialInfo.monthlyIncome', {
              valueAsNumber: true,
              required: validationRules.financialInfo.monthlyIncome.required
                ? validationRules.financialInfo.monthlyIncome.errorMessage
                : false,
              validate: (value) =>
                validationRules.financialInfo.monthlyIncome.min === undefined ||
                value >= validationRules.financialInfo.monthlyIncome.min ||
                validationRules.financialInfo.monthlyIncome.errorMessage,
            })}
          />
          <Textbox
            label="Monthly Expenses (ZAR)"
            required={validationRules.financialInfo.monthlyExpenses.required}
            type="number"
            placeholder="Enter Monthly Expenses"
            min={validationRules.financialInfo.monthlyExpenses.min}
            error={Boolean(errors.financialInfo?.monthlyExpenses)}
            helperText={errors.financialInfo?.monthlyExpenses?.message}
            {...register('financialInfo.monthlyExpenses', {
              valueAsNumber: true,
              required: validationRules.financialInfo.monthlyExpenses.required
                ? validationRules.financialInfo.monthlyExpenses.errorMessage
                : false,
              validate: (value) =>
                validationRules.financialInfo.monthlyExpenses.min === undefined ||
                value >= validationRules.financialInfo.monthlyExpenses.min ||
                validationRules.financialInfo.monthlyExpenses.errorMessage,
            })}
          />
          <Textbox
            label="Existing Debt (ZAR)"
            required={validationRules.financialInfo.existingDebt.required}
            type="number"
            placeholder="Enter Existing Debt"
            min={validationRules.financialInfo.existingDebt.min}
            error={Boolean(errors.financialInfo?.existingDebt)}
            helperText={errors.financialInfo?.existingDebt?.message}
            {...register('financialInfo.existingDebt', {
              valueAsNumber: true,
              required: validationRules.financialInfo.existingDebt.required
                ? validationRules.financialInfo.existingDebt.errorMessage
                : false,
              validate: (value) =>
                validationRules.financialInfo.existingDebt.min === undefined ||
                value >= validationRules.financialInfo.existingDebt.min ||
                validationRules.financialInfo.existingDebt.errorMessage,
            })}
          />
          <Controller
            name="financialInfo.creditScore"
            control={control}
            rules={{
              validate: (value) =>
                value === undefined ||
                ((validationRules.financialInfo.creditScore.min === undefined ||
                  value >= validationRules.financialInfo.creditScore.min) &&
                  (validationRules.financialInfo.creditScore.max === undefined ||
                    value <= validationRules.financialInfo.creditScore.max) &&
                  (!validationRules.financialInfo.creditScore.integer ||
                    Number.isInteger(value))) ||
                validationRules.financialInfo.creditScore.errorMessage,
            }}
            render={({ field }) => (
              <FormControl
                error={Boolean(errors.financialInfo?.creditScore)}
                className="col-span-2 max-sm:col-span-1"
              >
                <Box className="flex items-center justify-between gap-2">
                  <FormLabel
                    id="credit-score-label"
                    component="span"
                    sx={{ color: 'var(--brand-muted)', fontSize: 12 }}
                  >
                    Credit score (optional)
                  </FormLabel>
                  <Typography
                    component="span"
                    className="text-[var(--brand-navy)]"
                    sx={{ fontSize: 13, fontWeight: 700 }}
                  >
                    {field.value ?? 'Not provided'}
                  </Typography>
                </Box>
                <Slider
                  aria-label="Credit score"
                  aria-describedby={
                    errors.financialInfo?.creditScore ? 'credit-score-helper' : undefined
                  }
                  value={field.value ?? creditScoreMin}
                  min={creditScoreMin}
                  max={creditScoreMax}
                  step={1}
                  disabled={!isCreditScoreKnown}
                  valueLabelDisplay={isCreditScoreKnown ? 'auto' : 'off'}
                  getAriaValueText={(value) => `Credit score ${value}`}
                  onChange={(_, value) => {
                    if (typeof value === 'number') {
                      field.onChange(value)
                      onValuesChange?.()
                    }
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
                    '&.Mui-disabled': {
                      color: '#a8d3ff',
                      '& .MuiSlider-rail': { bgcolor: '#dceeff' },
                    },
                  }}
                />
                <Box className="flex justify-between text-[#617782]">
                  <Typography component="span" sx={{ fontSize: 10 }}>
                    {creditScoreMin}
                  </Typography>
                  <Typography component="span" sx={{ fontSize: 10 }}>
                    {creditScoreMax}
                  </Typography>
                </Box>
                <FormControlLabel
                  className="m-0"
                  control={
                    <Checkbox
                      checked={isCreditScoreKnown}
                      onChange={(event) => {
                        const known = event.target.checked
                        setIsCreditScoreKnown(known)
                        field.onChange(known ? (field.value ?? creditScoreMin) : undefined)
                      }}
                      size="small"
                      sx={{
                        color: 'var(--brand-navy)',
                        '&.Mui-checked': { color: 'var(--brand-navy)' },
                      }}
                    />
                  }
                  label={
                    <Typography
                      component="span"
                      className="text-[var(--brand-muted)]"
                      sx={{ fontSize: 12 }}
                    >
                      I know my credit score
                    </Typography>
                  }
                  sx={{ alignSelf: 'flex-start' }}
                />
                {errors.financialInfo?.creditScore && (
                  <FormHelperText id="credit-score-helper" className="mx-0">
                    {errors.financialInfo.creditScore.message}
                  </FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Box>
      </FormSection>}

      {activeStep === 2 && <FormSection title="Loan Details" icon="loan">
        <Box className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <Controller
            name="loanDetails.loanType"
            control={control}
            rules={{
              required: validationRules.loanDetails.loanType.required
                ? validationRules.loanDetails.loanType.errorMessage
                : false,
              validate: (value) =>
                !validationRules.loanDetails.loanType.options ||
                validationRules.loanDetails.loanType.options.includes(value) ||
                validationRules.loanDetails.loanType.errorMessage,
            }}
            render={({ field }) => (
              <FormControl
                component="fieldset"
                fullWidth
                error={Boolean(errors.loanDetails?.loanType)}
                className="col-span-2 max-sm:col-span-1"
              >
                <FormLabel
                  id="loan-product-label"
                  component="legend"
                  className="mb-1 block text-xs text-[var(--brand-muted)]"
                  sx={{ color: 'var(--brand-muted)', fontSize: 12, lineHeight: 1.5 }}
                >
                  Loan Product
                  {validationRules.loanDetails.loanType.required && (
                    <span aria-hidden="true"> *</span>
                  )}
                </FormLabel>
                <RadioGroup
                  aria-labelledby="loan-product-label"
                  aria-describedby={errors.loanDetails?.loanType ? 'loan-product-error' : undefined}
                  aria-invalid={Boolean(errors.loanDetails?.loanType)}
                  aria-required={validationRules.loanDetails.loanType.required}
                  name={field.name}
                  value={field.value}
                  onChange={(_, value) => {
                    field.onChange(value)
                    setValue('loanDetails.loanPurpose', '')
                    setValue('loanDetails.requestedAmount', undefined)
                    setValue('loanDetails.loanTerm', undefined)
                    clearErrors([
                      'loanDetails.loanPurpose',
                      'loanDetails.requestedAmount',
                      'loanDetails.loanTerm',
                    ])
                  }}
                  onBlur={field.onBlur}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'minmax(0, 1fr)',
                      sm: 'repeat(2, minmax(0, 1fr))',
                    },
                    gap: 1,
                  }}
                >
                  {products.map(({ id, name, description }, index) => {
                    const selected = field.value === id
                    return (
                      <FormControlLabel
                        key={id}
                        value={id}
                        control={
                          <Radio
                            disabled={isLoadingProducts}
                            ref={index === 0 ? field.ref : undefined}
                            slotProps={{
                              input: {
                                'aria-label': name,
                                'aria-describedby': description
                                  ? `loan-product-description-${id}`
                                  : undefined,
                              },
                            }}
                            sx={{ '&.Mui-checked': { color: 'var(--brand-navy)' } }}
                          />
                        }
                        disabled={isLoadingProducts}
                        label={
                          <Box className="min-w-0">
                            <Typography
                              id={`loan-product-description-${id}`}
                              component="span"
                              className="block text-[var(--brand-navy)]"
                              sx={{ fontSize: 13, fontWeight: 650 }}
                            >
                              {name}
                            </Typography>
                            {description && (
                              <Typography
                                component="span"
                                className="mt-1 block whitespace-normal text-[var(--brand-muted)]"
                                sx={{ fontSize: 11, lineHeight: 1.4 }}
                              >
                                {description}
                              </Typography>
                            )}
                          </Box>
                        }
                        sx={{
                          m: 0,
                          width: '100%',
                          minWidth: 0,
                          boxSizing: 'border-box',
                          px: 1.5,
                          py: 1,
                          alignItems: 'flex-start',
                          border: '1px solid',
                          borderColor: selected ? 'var(--brand-navy)' : 'var(--brand-border)',
                          borderRadius: '8px',
                          bgcolor: selected ? 'var(--brand-tint)' : 'white',
                          color: 'var(--brand-navy)',
                          '&:has(.Mui-focusVisible)': {
                            outline: '2px solid #0877d1',
                            outlineOffset: '2px',
                          },
                          '& .MuiRadio-root': { mt: -0.5 },
                        }}
                      />
                    )
                  })}
                </RadioGroup>
                {(errors.loanDetails?.loanType || isLoadingProducts || products.length === 0) && (
                  <FormHelperText
                    id={errors.loanDetails?.loanType ? 'loan-product-error' : undefined}
                    role={isLoadingProducts ? 'status' : undefined}
                  >
                    {errors.loanDetails?.loanType?.message ??
                      (isLoadingProducts
                        ? 'Loading loan products…'
                        : products.length === 0
                          ? 'No loan products are currently available.'
                          : '')}
                  </FormHelperText>
                )}
              </FormControl>
            )}
          />
          <Controller
            name="loanDetails.loanPurpose"
            control={control}
            rules={{
              required: validationRules.loanDetails.loanPurpose.required
                ? validationRules.loanDetails.loanPurpose.errorMessage
                : false,
              validate: (value) =>
                !value ||
                !selectedProduct ||
                selectedProduct.purposes.includes(value) ||
                validationRules.loanDetails.loanPurpose.errorMessage,
            }}
            render={({ field }) => (
              <Dropdown
                className="col-span-2 max-sm:col-span-1"
                label="Loan Purpose"
            required={validationRules.loanDetails.loanPurpose.required}
                options={purposeOptions}
                {...field}
                disabled={!selectedProduct}
                placeholder={selectedProduct ? 'Select a loan purpose' : 'Select a loan product first'}
                error={Boolean(errors.loanDetails?.loanPurpose)}
                helperText={errors.loanDetails?.loanPurpose?.message}
              />
            )}
          />
          <Textbox
            className="col-span-1"
            label="Requested Loan Amount (ZAR)"
            required={validationRules.loanDetails.requestedAmount.required}
            type="number"
            placeholder="Enter Requested Loan Amount"
            disabled={!selectedProduct}
            min={selectedProduct?.minAmount}
            max={selectedProduct?.maxAmount}
            error={Boolean(errors.loanDetails?.requestedAmount)}
            helperText={
              errors.loanDetails?.requestedAmount?.message ??
              (selectedProduct
                ? `Available range: R${selectedProduct.minAmount.toLocaleString()}–R${selectedProduct.maxAmount.toLocaleString()}`
                : undefined)
            }
            {...register('loanDetails.requestedAmount', {
              valueAsNumber: true,
              required: validationRules.loanDetails.requestedAmount.required
                ? amountErrorMessage
                : false,
              validate: (value) =>
                !selectedProduct ||
                (value !== undefined &&
                  value >= selectedProduct.minAmount &&
                  value <= selectedProduct.maxAmount) ||
                amountErrorMessage,
            })}
          />
          <Controller
            name="loanDetails.loanTerm"
            control={control}
            rules={{
              required: validationRules.loanDetails.loanTerm.required
                ? termErrorMessage
                : false,
              validate: (value) =>
                !selectedProduct ||
                (value !== undefined &&
                  value >= selectedProduct.minTerm &&
                  value <= selectedProduct.maxTerm &&
                  (!validationRules.loanDetails.loanTerm.integer || Number.isInteger(value))) ||
                termErrorMessage,
            }}
            render={({ field }) => (
              <Dropdown
                label="Loan Term"
            required={validationRules.loanDetails.loanTerm.required}
                options={termOptions}
                disabled={!selectedProduct}
                value={field.value === undefined ? '' : String(field.value)}
                onChange={(event) =>
                  field.onChange(event.target.value === '' ? undefined : Number(event.target.value))
                }
                onBlur={field.onBlur}
                name={field.name}
                inputRef={field.ref}
                error={Boolean(errors.loanDetails?.loanTerm)}
                helperText={errors.loanDetails?.loanTerm?.message}
              />
            )}
          />
        </Box>
      </FormSection>}

      <Box className="flex items-center justify-between gap-3">
        {activeStep > 0 ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setActiveStep((currentStep) => currentStep - 1)}
            disabled={isSubmitting}
            sx={{ textTransform: 'none' }}
          >
            Back
          </Button>
        ) : (
          <Box />
        )}
        {activeStep < stepTitles.length - 1 ? (
          <Button
            type="button"
            onClick={goToNextStep}
            sx={{
              minWidth: 140,
              bgcolor: 'var(--brand-navy)',
              '&:hover': { bgcolor: 'var(--brand-navy-dark, #073b5c)' },
              textTransform: 'none',
            }}
          >
            Continue
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isSubmitting}
            sx={{
              minWidth: 180,
              bgcolor: 'var(--brand-navy)',
              '&:hover': { bgcolor: 'var(--brand-navy-dark, #073b5c)' },
              '&.Mui-disabled': { bgcolor: '#9bbbd4', color: '#fff' },
              textTransform: 'none',
            }}
            startIcon={
              <SvgIcon aria-hidden="true">
                <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 16H5V5h14v14ZM7 7h4v4H7zm0 6h4v4H7zm6-6h4v2h-4zm0 4h4v2h-4zm0 2h4v5h-4z" />
              </SvgIcon>
            }
          >
            {isSubmitting ? 'Checking Eligibility…' : 'Check Eligibility'}
          </Button>
        )}
      </Box>
          </Box>
        </ApplicationStepper>
      </Box>
    </Box>
  )
}

export default LoanEligibilityForm
