import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import PasswordGate, { isUnlocked } from './components/PasswordGate'
import Layout from './components/Layout'
import Pipeline from './pages/Pipeline'
import Quotes   from './pages/Quotes'
import Orders   from './pages/Orders'

export default function App() {
  const [unlocked, setUnlocked] = useState(isUnlocked())

  if (!unlocked) {
    return (
      <ThemeProvider>
        <PasswordGate onUnlock={() => setUnlocked(true)} />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <ToastProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/"       element={<Pipeline />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/orders" element={<Orders />} />
          </Routes>
        </Layout>
      </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  )
}
