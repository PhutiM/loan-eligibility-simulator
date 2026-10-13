import Box from '@mui/material/Box'
import Header from './components/Header/Header'
import Body from './components/Body/Body'
import LoanEligibilityPage from './pages/LoanEligibilityPage/LoanEligibilityPage'

function App() {
  return (
    <Box
      id="home"
      className="mx-auto min-h-screen w-[calc(100%-3rem)] max-w-[1500px] py-7 max-sm:w-[calc(100%-1.5rem)] max-sm:py-3"
    >
      <Header />
      <Body className="pt-3">
        <LoanEligibilityPage />
      </Body>
    </Box>
  )
}

export default App
