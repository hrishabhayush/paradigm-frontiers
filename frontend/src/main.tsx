import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './ui/App'
import { Providers } from './lib/providers'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>
)


