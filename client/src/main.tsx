import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { suppressAuthErrors } from './utils/consoleUtils'

// Suppress expected auth errors in development
suppressAuthErrors();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
