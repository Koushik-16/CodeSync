import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthContextProvider } from './context/AuthContext.jsx'
import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter } from 'react-router-dom'
import darkTheme from './Theme/theme.js'
import { SocketProvider } from './context/Sockek.jsx'

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
    <AuthContextProvider>
    <SocketProvider>
    <ThemeProvider theme={darkTheme}>
        <CssBaseline />
         <App />
      </ThemeProvider>
    </SocketProvider>
    </AuthContextProvider>
    </BrowserRouter>
)
