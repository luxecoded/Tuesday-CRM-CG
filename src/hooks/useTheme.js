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
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])

  const setTheme = (value) => {
    localStorage.setItem(STORAGE_KEY, value)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = value === 'dark' || (value === 'auto' && prefersDark)
    document.documentElement.classList.toggle('dark', isDark)
    setThemeState(value)
  }

  return { theme, setTheme }
}
