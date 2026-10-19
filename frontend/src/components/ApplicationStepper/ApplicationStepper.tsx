import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

type ApplicationStepperProps = {
  steps: string[]
  activeStep: number
  onStepSelect?: (index: number) => void
  children: ReactNode
}

function ApplicationStepper({ steps, activeStep, onStepSelect, children }: ApplicationStepperProps) {
  return (
    <Box component="nav" aria-label="Application progress">
      <Box component="ol" className="m-0 flex list-none flex-col p-0">
        {steps.map((step, index) => {
          const isCompleted = index < activeStep
          const isActive = index === activeStep
          const status = isCompleted
            ? 'Completed'
            : isActive
              ? 'In Progress'
              : 'Pending'

          return (
            <Box
              component="li"
              key={step}
              aria-current={isActive ? 'step' : undefined}
              className={`relative flex gap-4 ${index < steps.length - 1 ? 'pb-5' : ''}`}
            >
              <Box className="relative flex w-9 shrink-0 justify-center">
                {index < steps.length - 1 && (
                  <Box
                    aria-hidden="true"
                    className={`absolute left-1/2 top-9 bottom-0 z-0 w-0.5 -translate-x-1/2 ${
                      isCompleted
                        ? 'bg-emerald-600'
                        : isActive
                          ? 'bg-[linear-gradient(to_bottom,#1976d2_50%,#a8d3ff_50%)]'
                          : 'bg-[#a8d3ff]'
                    }`}
                  />
                )}
                <Box
                  component={isCompleted && onStepSelect ? 'button' : 'div'}
                  type={isCompleted && onStepSelect ? 'button' : undefined}
                  onClick={isCompleted && onStepSelect ? () => onStepSelect(index) : undefined}
                  aria-label={
                    isCompleted && onStepSelect ? `Go back to ${step}` : undefined
                  }
                  aria-hidden={isCompleted && onStepSelect ? undefined : 'true'}
                  className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                    isCompleted && onStepSelect ? 'cursor-pointer border-0 hover:bg-emerald-700' : ''
                  } ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isActive
                        ? 'border-2 border-[#1976d2] bg-white p-1'
                        : 'bg-[#a8d3ff]'
                  }`}
                >
                  {isCompleted ? (
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                      <path d="m9 16.17-3.88-3.88L3.7 13.7 9 19l11-11-1.41-1.41z" />
                    </svg>
                  ) : isActive ? (
                    <Box className="h-full w-full rounded-full bg-[#1976d2]" />
                  ) : null}
                </Box>
              </Box>
              <Box className="min-w-0 flex-1 pt-0.5">
                <Typography
                  component="p"
                  className="mb-1 uppercase tracking-wider text-[var(--brand-muted)]"
                  sx={{ fontSize: 10, fontWeight: 650 }}
                >
                  Step {index + 1}
                </Typography>
                <Typography
                  component="p"
                  className="text-[var(--brand-navy)]"
                  sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.25 }}
                >
                  {step}
                </Typography>
                <Typography
                  component="p"
                  className={
                    isCompleted
                      ? 'text-emerald-700'
                      : isActive
                        ? 'text-[#1976d2]'
                        : 'text-[var(--brand-muted)]'
                  }
                  sx={{ fontSize: 12, fontWeight: 650 }}
                >
                  {status}
                </Typography>
                {isActive && <Box className="pt-4">{children}</Box>}
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default ApplicationStepper
