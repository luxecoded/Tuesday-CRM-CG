import { NavLink } from 'react-router-dom'
import { lockApp } from './PasswordGate'

const navItems = [
  { to: '/',          icon: '📋', label: 'Pipeline'  },
  { to: '/calendar',  icon: '📅', label: 'Calendar'  },
  { to: '/contacts',  icon: '👥', label: 'Contacts'  },
]

export default function Layout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="h-15 flex items-center gap-3 px-5 border-b border-gray-200">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">Tuesday</div>
            <div className="text-xs text-gray-400">CRM</div>
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
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={lockApp}
            className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors text-left"
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-40 pb-safe">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors
              ${isActive ? 'text-indigo-500' : 'text-gray-400'}`
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
