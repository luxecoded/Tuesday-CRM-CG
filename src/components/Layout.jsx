import { NavLink } from 'react-router-dom'
import { lockApp, getUserName } from './PasswordGate'

function HomeIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
    </svg>
  )
}

function CalendarIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function ContactsIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function QuotesIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
    </svg>
  )
}

function OrdersIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" strokeLinecap="round" />
      <line x1="10" y1="14" x2="14" y2="14" strokeLinecap="round" />
    </svg>
  )
}

const navItems = [
  { to: '/',         Icon: HomeIcon,     label: 'Dashboard' },
  { to: '/quotes',   Icon: QuotesIcon,   label: 'Quotes' },
  { to: '/orders',   Icon: OrdersIcon,   label: 'Orders' },
  { to: '/calendar', Icon: CalendarIcon, label: 'Calendar' },
  { to: '/contacts', Icon: ContactsIcon, label: 'Contacts' },
]


export default function Layout({ children }) {
  const userName = getUserName()

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex flex-col w-56 bg-white/40 dark:bg-white/5 backdrop-blur-2xl border-r border-white/25 dark:border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 px-5 border-b border-white/20 dark:border-white/8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-white text-sm">Elite Windows</div>
              {userName && <div className="text-xs text-gray-500 dark:text-gray-400">{userName}</div>}
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, Icon, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border
                ${isActive
                  ? 'bg-green-600/15 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-transparent'
                  : 'text-gray-600 dark:text-gray-300 border-transparent hover:border-green-600/50 dark:hover:border-green-500/50 hover:text-green-800 dark:hover:text-green-400'
                }`
              }
            >
              {Icon ? <Icon className="w-4 h-4" /> : <span className="text-base">{icon}</span>}
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/20 dark:border-white/8">
          <button
            onClick={lockApp}
            className="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-left"
          >
            🔒 Lock app
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {children}
      </div>

      {/* Floating bottom nav — mobile + tablet */}
      <nav className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center
        bg-white/65 dark:bg-white/10 backdrop-blur-2xl
        rounded-full shadow-2xl shadow-black/10 dark:shadow-black/40
        border border-white/60 dark:border-white/20
        px-2 py-1.5 gap-0.5 z-40">
        {navItems.map(({ to, Icon, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-5 py-2 rounded-full text-xs font-medium transition-all duration-200
              ${isActive
                ? 'bg-green-600/15 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/40 dark:hover:bg-white/8'
              }`
            }
          >
            {Icon ? <Icon className="w-5 h-5" /> : <span className="text-xl leading-none">{icon}</span>}
            <span className="text-[10px] font-semibold">{label}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  )
}
