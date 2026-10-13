import Box from '@mui/material/Box'
import type { ReactNode } from 'react'

type BodyProps = {
  children?: ReactNode
  className?: string
}

function Body({ children, className = '' }: BodyProps) {
  return (
    <Box component="main" className={`min-w-0 flex-1 ${className}`.trim()}>
      {children}
    </Box>
  )
}

export default Body
