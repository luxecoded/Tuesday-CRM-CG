import { useState } from 'react'

const APP_PASSWORD = 'elite2026'
const UNLOCK_KEY = 'tuesday-crm-unlocked-v1'

export function isUnlocked() {
  return localStorage.getItem(UNLOCK_KEY) === '1'
}

export function lockApp() {
  localStorage.removeItem(UNLOCK_KEY)
  window.location.reload()
}

export default function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    if (password === APP_PASSWORD) {
      localStorage.setItem(UNLOCK_KEY, '1')
      onUnlock()
    } else {
      setError('Incorrect password — try again.')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-900 text-center mb-1">Tuesday CRM</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Enter the team password to continue</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            autoFocus
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none focus:border-indigo-400 focus:bg-white transition-colors"
            placeholder="Enter password"
          />
        </div>

        <button
          onClick={submit}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          Unlock
        </button>
      </div>
    </div>
  )
}
