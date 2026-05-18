import { useRef } from 'react'

export default function ThemeToggle({ theme, setTheme }) {
  const timerRef = useRef(null)

  // Single click = set light/dark. Double click = auto mode.
  const handleClick = (value) => {
    if (timerRef.current) {
      // Second click arrived before timeout — it's a double click
      clearTimeout(timerRef.current)
      timerRef.current = null
      setTheme('auto')
    } else {
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        setTheme(value)
      }, 250)
    }
  }

  const isAuto  = theme === 'auto'
  const isLight = theme === 'light'
  const isDark  = theme === 'dark'

  // When in auto mode, detect which icon should look "active"
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const autoActive = isAuto ? (systemDark ? 'dark' : 'light') : null

  const sunActive  = isLight || autoActive === 'light'
  const moonActive = isDark  || autoActive === 'dark'

  const slideRight = moonActive

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full p-0.5 gap-0.5 relative">
      {/* Sliding thumb */}
      <div
        className="absolute top-0.5 left-0.5 w-8 h-8 rounded-full bg-white dark:bg-gray-600 shadow-sm transition-transform duration-200 ease-in-out pointer-events-none"
        style={{ transform: `translateX(${slideRight ? 34 : 0}px)` }}
      />

      {/* Sun */}
      <button
        onClick={() => handleClick('light')}
        title="Light (double-click for Auto)"
        className={`relative z-10 w-8 h-8 flex items-center justify-center rounded-full text-base transition-colors duration-200
          ${sunActive ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
      >
        ☀️
        {isAuto && autoActive === 'light' && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-indigo-400 rounded-full border border-white dark:border-gray-700" />
        )}
      </button>

      {/* Moon */}
      <button
        onClick={() => handleClick('dark')}
        title="Dark (double-click for Auto)"
        className={`relative z-10 w-8 h-8 flex items-center justify-center rounded-full text-base transition-colors duration-200
          ${moonActive ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
      >
        🌙
        {isAuto && autoActive === 'dark' && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-indigo-400 rounded-full border border-white dark:border-gray-700" />
        )}
      </button>
    </div>
  )
}
