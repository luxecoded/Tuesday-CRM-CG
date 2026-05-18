import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PasswordGate, { isUnlocked } from './components/PasswordGate'
import Layout from './components/Layout'
import Pipeline from './pages/Pipeline'
import Calendar from './pages/Calendar'
import Contacts from './pages/Contacts'
import { useTheme } from './hooks/useTheme'

export default function App() {
  const [unlocked, setUnlocked] = useState(isUnlocked())
  const { theme, setTheme } = useTheme()

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />
  }

  return (
    <BrowserRouter>
      <Layout theme={theme} setTheme={setTheme}>
        <Routes>
          <Route path="/"         element={<Pipeline />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/contacts" element={<Contacts />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
