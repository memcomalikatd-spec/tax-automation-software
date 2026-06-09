import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AdminLogin from './AdminLogin.jsx'
import Dashboard from './Dashboard.jsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { Agentation } from 'agentation'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdminLogin />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
    {import.meta.env.DEV && <Agentation />}
  </React.StrictMode>
)