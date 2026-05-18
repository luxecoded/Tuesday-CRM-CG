import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import PasswordGate, { isUnlocked } from './components/PasswordGate'
import Layout from './components/Layout'
import Pipeline from './pages/Pipeline'
import Calendar from './pages/Calendar'
import Contacts from './pages/Contacts'

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
            <Route path="/"         element={<Pipeline />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/contacts" element={<Contacts />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  )
}
