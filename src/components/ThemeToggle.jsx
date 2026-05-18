const OPTIONS = [
  { value: 'light', icon: '☀️', label: 'Light' },
  { value: 'auto',  icon: '💻', label: 'Auto'  },
  { value: 'dark',  icon: '🌙', label: 'Dark'  },
]

export default function ThemeToggle({ theme, setTheme }) {
  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 gap-0.5">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          title={opt.label}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all
            ${theme === opt.value
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
        >
          <span className="text-sm leading-none">{opt.icon}</span>
          {/* Label hidden on small screens to save topbar space */}
          <span className="hidden md:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
