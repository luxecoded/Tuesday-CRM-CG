import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
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
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/"       element={<Pipeline />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/orders" element={<Orders />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  )
}
