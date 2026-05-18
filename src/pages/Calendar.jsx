import { useState, useMemo } from 'react'
import { useDeals } from '../hooks/useDeals'
import { useEvents } from '../hooks/useEvents'
import EventDrawer from '../components/EventDrawer'
import ThemeToggle from '../components/ThemeToggle'
import { useThemeContext } from '../context/ThemeContext'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function dateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7

  const days = []
  for (let i = startOffset - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i))
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  const rows = Math.ceil((startOffset + lastDay.getDate()) / 7)
  let next = 1
  while (days.length < rows * 7) {
    days.push(new Date(year, month + 1, next++))
  }
  return days
}

export default function Calendar() {
  const { deals } = useDeals()
  const { events, addEvent, updateEvent, deleteEvent } = useEvents()
  const { theme, setTheme } = useThemeContext()

  const today    = new Date()
  const todayKey = dateKey(today)

  const [current, setCurrent]       = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedEvent, setSelected] = useState(null)

  const year  = current.getFullYear()
  const month = current.getMonth()

  const calDays = useMemo(() => getCalendarDays(year, month), [year, month])

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1))
  const goToday   = () => setCurrent(new Date(today.getFullYear(), today.getMonth(), 1))

  const itemMap = useMemo(() => {
    const map = {}
    const add = (key, item) => {
      if (!map[key]) map[key] = []
      map[key].push(item)
    }
    for (const deal of deals) {
      if (deal.quoteSent)   add(deal.quoteSent,   { type: 'quote',   label: deal.deal || deal.company, color: '#f59e0b', id: `q-${deal.id}` })
      if (deal.surveyDate)  add(deal.surveyDate,  { type: 'survey',  label: deal.deal || deal.company, color: '#a855f7', id: `s-${deal.id}` })
      if (deal.installStart) add(deal.installStart, { type: 'install', label: deal.deal || deal.company, color: '#10b981', id: `i-${deal.id}` })
    }
    for (const ev of events) {
      if (ev.date) add(ev.date, { type: 'event', label: ev.title, color: ev.color, id: `e-${ev.id}`, event: ev })
    }
    return map
  }, [deals, events])

  const isDesktop = window.innerWidth >= 1024

  const handleDayClick = (key) => {
    setSelected({ title: '', date: key, endDate: '', color: '#6366f1', notes: '' })
  }

  const handleItemClick = (e, item) => {
    e.stopPropagation()
    if (item.event) setSelected(item.event)
  }

  const handleSave = async (data) => {
    if (data.id) await updateEvent(data)
    else await addEvent(data)
    setSelected(null)
  }

  const handleDelete = async (id) => {
    await deleteEvent(id)
    setSelected(null)
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0 transition-colors">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Calendar</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">{MONTH_NAMES[month]} {year}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <button
              onClick={() => setSelected({ title: '', date: todayKey, endDate: '', color: '#6366f1', notes: '' })}
              className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
              + Event
            </button>
          </div>
        </div>

        {/* Month nav + legend */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-2 flex items-center gap-2 flex-shrink-0 transition-colors">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 text-lg leading-none transition-colors">‹</button>
          <button onClick={goToday}   className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-colors">Today</button>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 text-lg leading-none transition-colors">›</button>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 ml-1">{MONTH_NAMES[month]} {year}</span>
          <div className="ml-auto hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ background: '#f59e0b' }} /> Quote
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ background: '#a855f7' }} /> Survey
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ background: '#10b981' }} /> Install
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <span className="w-2.5 h-2.5 rounded-full inline-block bg-indigo-500 flex-shrink-0" /> Event
            </span>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 transition-colors pb-24 lg:pb-0">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
            {DAY_NAMES.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {calDays.map((date, idx) => {
              const key            = dateKey(date)
              const isCurrentMonth = date.getMonth() === month
              const isToday        = key === todayKey
              const items          = itemMap[key] || []
              const shown          = items.slice(0, 3)
              const overflow       = items.length - shown.length

              return (
                <div key={idx}
                  onClick={() => handleDayClick(key)}
                  className={`min-h-[80px] border-b border-r border-gray-200 dark:border-gray-700/50 p-1.5 cursor-pointer transition-colors
                    ${isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/60 dark:bg-gray-900/60'}
                    hover:bg-indigo-50 dark:hover:bg-indigo-900/20`}>

                  <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 flex-shrink-0
                    ${isToday
                      ? 'bg-indigo-500 text-white'
                      : isCurrentMonth
                        ? 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-300 dark:text-gray-600'}`}>
                    {date.getDate()}
                  </div>

                  <div className="space-y-0.5">
                    {shown.map(item => (
                      <div key={item.id}
                        onClick={e => handleItemClick(e, item)}
                        title={item.label}
                        className={`px-1 py-0.5 rounded text-xs font-medium truncate leading-tight
                          ${item.type === 'event' ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                        style={{ background: item.color + '22', color: item.color, borderLeft: `2px solid ${item.color}` }}>
                        <span className="hidden sm:inline">{item.label}</span>
                        <span className="sm:hidden" style={{ color: item.color }}>●</span>
                      </div>
                    ))}
                    {overflow > 0 && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 pl-1">+{overflow} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {selectedEvent !== null && (
        <EventDrawer
          event={selectedEvent}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          onDelete={selectedEvent.id ? handleDelete : null}
          isDesktop={isDesktop}
        />
      )}
    </div>
  )
}
