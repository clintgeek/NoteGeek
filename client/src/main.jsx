import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Import Mantine core styles
import '@mantine/core/styles.css';

// Import custom SASS styles
import './styles/main.scss';

import './index.css'
import App from './App.jsx'
import { MantineProvider } from '@mantine/core';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="auto">
      <App />
    </MantineProvider>
  </StrictMode>,
)
