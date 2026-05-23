import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium pointer-events-auto
              backdrop-blur-xl border animate-in
              ${t.type === 'error'
                ? 'bg-red-500/90 border-red-400/50 text-white'
                : 'bg-gray-900/90 border-white/10 text-white dark:bg-white/90 dark:border-white/20 dark:text-gray-900'
              }`}
          >
            <span className="text-base leading-none">{t.type === 'error' ? '✕' : '✓'}</span>
            {message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
