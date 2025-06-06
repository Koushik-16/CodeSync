import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthContextProvider } from './context/AuthContext.jsx'
import { BrowserRouter } from 'react-router-dom'
import { SocketProvider } from './context/Sockek.jsx'

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
    <AuthContextProvider>
    <SocketProvider>
    <App />
    </SocketProvider>
    </AuthContextProvider>
    </BrowserRouter>
)
