import { useState } from 'react'

const APP_PASSWORD = 'elite2026'
const UNLOCK_KEY   = 'tuesday-crm-unlocked-v1'
export const USER_NAME_KEY = 'tuesday-crm-user-name'

export function isUnlocked() {
  return localStorage.getItem(UNLOCK_KEY) === '1'
}

export function getUserName() {
  return localStorage.getItem(USER_NAME_KEY) || ''
}

export function lockApp() {
  localStorage.removeItem(UNLOCK_KEY)
  localStorage.removeItem(USER_NAME_KEY)
  window.location.reload()
}

export default function PasswordGate({ onUnlock }) {
  const [name, setName]         = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')

  const submit = () => {
    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (password === APP_PASSWORD) {
      localStorage.setItem(UNLOCK_KEY, '1')
      localStorage.setItem(USER_NAME_KEY, name.trim())
      onUnlock()
    } else {
      setError('Incorrect password — try again.')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-gate-bg flex items-center justify-center p-4 transition-colors">
      <div className="bg-gate-card rounded-2xl shadow-sm border border-gate-border p-8 w-full max-w-sm transition-colors">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-700 flex items-center justify-center">
            <span className="text-white font-bold text-lg">E</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-ink text-center mb-1">Elite Windows</h1>
        <p className="text-sm text-ink-muted text-center mb-6">Enter your name and the team password to continue</p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            autoFocus
            className="w-full px-4 py-3 bg-gate-input border border-gate-border rounded-xl text-ink text-sm outline-none focus:border-green-600 transition-colors placeholder:text-ink-placeholder"
            placeholder="e.g. Hannah"
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            className="w-full px-4 py-3 bg-gate-input border border-gate-border rounded-xl text-ink text-sm outline-none focus:border-green-600 transition-colors placeholder:text-ink-placeholder"
            placeholder="Enter password"
          />
        </div>

        <button
          onClick={submit}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          Unlock
        </button>
      </div>
    </div>
  )
}
