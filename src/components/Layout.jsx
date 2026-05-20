import { NavLink } from 'react-router-dom'
import { lockApp, getUserName } from './PasswordGate'

const navItems = [
  { to: '/',         icon: '📋', label: 'Pipeline' },
  { to: '/calendar', icon: '📅', label: 'Calendar' },
  { to: '/contacts', icon: '👥', label: 'Contacts' },
]

export default function Layout({ children }) {
  const userName = getUserName()

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden transition-colors">

      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex flex-col w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 transition-colors">
        <div className="h-15 flex items-center gap-3 px-5 border-b border-gray-200 dark:border-gray-700 py-4">
          <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <div>
            <div className="font-bold text-gray-900 dark:text-white text-sm">Elite Windows</div>
            {userName && <div className="text-xs text-gray-400 dark:text-gray-500">{userName}</div>}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-green-50 dark:bg-green-500/10 text-green-800 dark:text-green-600'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={lockApp}
            className="w-full text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-left"
          >
            🔒 Lock app
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>

      {/* Bottom nav — mobile + tablet */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex z-40 transition-colors">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors
              ${isActive
                ? 'text-green-500 dark:text-green-600'
                : 'text-gray-400 dark:text-gray-500'
              }`
            }
          >
            <span className="text-xl">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

    </div>
  )
}
