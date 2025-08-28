import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRouter from './AppRouter.tsx'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { lightTheme } from './theme.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <AppRouter />
    </ThemeProvider>
  </StrictMode>,
)
