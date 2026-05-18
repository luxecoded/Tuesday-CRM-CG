import { useState, useEffect } from 'react'

const STORAGE_KEY = 'tuesday-theme'

// 'light' | 'dark' | 'auto'
export function useTheme() {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'auto'
  )

  useEffect(() => {
    const apply = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const isDark = theme === 'dark' || (theme === 'auto' && prefersDark)
      document.documentElement.classList.toggle('dark', isDark)
    }

    apply()

    // When in auto mode, react to system changes in real time
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])

  const applyTheme = (value) => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = value === 'dark' || (value === 'auto' && prefersDark)
    document.documentElement.classList.toggle('dark', isDark)
  }

  const setTheme = (value) => {
    localStorage.setItem(STORAGE_KEY, value)
    applyTheme(value)
    setThemeState(value)
  }

  return { theme, setTheme }
}
