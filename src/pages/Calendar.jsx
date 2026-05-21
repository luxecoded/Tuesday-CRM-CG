import { useState, useMemo } from 'react'
import { useDeals } from '../hooks/useDeals'
import { useEvents } from '../hooks/useEvents'
import EventDrawer from '../components/EventDrawer'
import EventDetailPanel from '../components/EventDetailPanel'
import ThemeToggle from '../components/ThemeToggle'
import { useThemeContext } from '../context/ThemeContext'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { getUserName } from '../components/PasswordGate'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_NAMES   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function dateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getCalendarDays(year, month) {
  const firstDay    = new Date(year, month, 1)
  const lastDay     = new Date(year, month + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7
  const days = []
  for (let i = startOffset - 1; i >= 0; i--) days.push(new Date(year, month, -i))
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
  let next = 1
  const rows = Math.ceil((startOffset + lastDay.getDate()) / 7)
  while (days.length < rows * 7) days.push(new Date(year, month + 1, next++))
  return days
}

function getWeekStart(date) {
  const d      = new Date(date)
  const offset = (d.getDay() + 6) % 7
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset)
}

function getDayRange(anchor, count) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(anchor)
    d.setDate(d.getDate() + i)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  })
}

function formatRange(days) {
  const first = days[0], last = days[days.length - 1]
  if (first.getMonth() === last.getMonth())
    return `${first.getDate()}–${last.getDate()} ${MONTH_SHORT[first.getMonth()]} ${first.getFullYear()}`
  if (first.getFullYear() === last.getFullYear())
    return `${first.getDate()} ${MONTH_SHORT[first.getMonth()]} – ${last.getDate()} ${MONTH_SHORT[last.getMonth()]} ${first.getFullYear()}`
  return `${first.getDate()} ${MONTH_SHORT[first.getMonth()]} ${first.getFullYear()} – ${last.getDate()} ${MONTH_SHORT[last.getMonth()]} ${last.getFullYear()}`
}

export default function Calendar() {
  const { deals }  = useDeals()
  const { events, addEvent, updateEvent, deleteEvent } = useEvents()
  const { theme, setTheme } = useThemeContext()

  const today    = new Date()
  const todayKey = dateKey(today)

  const userName = getUserName()
  const initials = userName ? userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'

  const [view, setView]              = useState('month')
  const [current, setCurrent]        = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedEvent, setSelected]    = useState(null)

  const year  = current.getFullYear()
  const month = current.getMonth()

  const calDays   = useMemo(() => view === 'month' ? getCalendarDays(year, month) : [],         [year, month, view])
  const multiDays = useMemo(() => view === 'week'  ? getDayRange(getWeekStart(current), 7)
                              : view === '3day'  ? getDayRange(current, 3)
                              : [],                                                            [current, view])

  const navLabel = view === 'month'
    ? `${MONTH_NAMES[month]} ${year}`
    : formatRange(multiDays)

  const switchView = (v) => {
    if (v === view) return
    if (v === 'month')  setCurrent(new Date(current.getFullYear(), current.getMonth(), 1))
    if (v === 'week')   setCurrent(getWeekStart(current))
    setView(v)
  }

  const prevPeriod = () => {
    if (view === 'month') return setCurrent(new Date(year, month - 1, 1))
    const delta = view === 'week' ? 7 : 3
    setCurrent(d => { const n = new Date(d); n.setDate(n.getDate() - delta); return n })
  }
  const nextPeriod = () => {
    if (view === 'month') return setCurrent(new Date(year, month + 1, 1))
    const delta = view === 'week' ? 7 : 3
    setCurrent(d => { const n = new Date(d); n.setDate(n.getDate() + delta); return n })
  }
  const goToday = () => {
    if (view === 'month') setCurrent(new Date(today.getFullYear(), today.getMonth(), 1))
    else if (view === 'week') setCurrent(getWeekStart(today))
    else setCurrent(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
  }

  const itemMap = useMemo(() => {
    const map = {}
    const add = (key, item) => { if (!map[key]) map[key] = []; map[key].push(item) }
    for (const deal of deals) {
      if (deal.quoteSent)    add(deal.quoteSent,    { type: 'quote',   label: deal.deal || deal.company, color: '#f59e0b', id: `q-${deal.id}`, deal })
      if (deal.surveyDate)   add(deal.surveyDate,   { type: 'survey',  label: deal.deal || deal.company, color: '#a855f7', id: `s-${deal.id}`, deal })
      if (deal.installStart) add(deal.installStart, { type: 'install', label: deal.deal || deal.company, color: '#10b981', id: `i-${deal.id}`, deal })
    }
    for (const ev of events) {
      if (ev.date) add(ev.date, { type: 'event', label: ev.title, color: ev.color, id: `e-${ev.id}`, event: ev })
    }
    return map
  }, [deals, events])

  const isDesktop = useIsDesktop()

  const handleDayClick  = (key) => { setSelectedItem(null); setSelected({ title: '', date: key, endDate: '', color: '#6366f1', notes: '' }) }
  const handleItemClick = (e, item) => { e.stopPropagation(); setSelected(null); setSelectedItem(item) }
  const handleEditFromPanel = () => { if (selectedItem?.event) { setSelected(selectedItem.event); setSelectedItem(null) } }
  const handleSave = async (data) => {
    if (data.id) await updateEvent(data); else await addEvent(data)
  }
  const handleDelete = async (id) => {
    await deleteEvent(id)
  }

  const itemChip = (item) => (
    <div key={item.id}
      onClick={e => handleItemClick(e, item)}
      title={item.label}
      className={`px-1.5 py-0.5 rounded text-xs font-medium truncate leading-tight
        ${item.type === 'event' ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
      style={{ background: item.color + '22', color: item.color, borderLeft: `2px solid ${item.color}` }}>
      {item.label}
    </div>
  )

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <div className="bg-white/35 dark:bg-white/5 backdrop-blur-xl border-b border-white/25 dark:border-white/8 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center flex-shrink-0 shadow-sm shadow-green-700/25">
              <span className="text-white font-bold text-xs">{initials}</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none">Hello,</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white leading-snug mt-0.5">{userName || 'there'}</p>
            </div>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Calendar</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{navLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
        </div>

        {/* Nav bar */}
        <div className="bg-white/20 dark:bg-white/3 backdrop-blur-md border-b border-white/20 dark:border-white/6 px-4 lg:px-6 py-2 flex items-center gap-2 flex-shrink-0">
          <button onClick={prevPeriod} className="w-8 h-8 rounded-full bg-white/30 dark:bg-white/8 hover:bg-white/50 dark:hover:bg-white/15 flex items-center justify-center text-gray-600 dark:text-gray-300 text-lg leading-none transition-colors">‹</button>
          <button onClick={goToday}    className="px-3 py-1.5 text-xs font-medium bg-white/30 dark:bg-white/8 hover:bg-white/50 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 rounded-full transition-colors">Today</button>
          <button onClick={nextPeriod} className="w-8 h-8 rounded-full bg-white/30 dark:bg-white/8 hover:bg-white/50 dark:hover:bg-white/15 flex items-center justify-center text-gray-600 dark:text-gray-300 text-lg leading-none transition-colors">›</button>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 ml-1 hidden sm:inline">{navLabel}</span>

          <div className="ml-auto flex bg-black/10 dark:bg-white/8 rounded-full p-0.5">
            {[['month','Month'],['week','Week'],['3day','3 Day']].map(([v, label]) => (
              <button key={v} onClick={() => switchView(v)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                  ${view === v ? 'bg-white/70 dark:bg-white/15 text-green-800 dark:text-green-400 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── MONTH VIEW ── */}
        {view === 'month' && (
          <div className="flex-1 flex flex-col overflow-hidden pb-24 lg:pb-0">
            <div className="grid grid-cols-7 border-b border-white/20 dark:border-white/6 flex-shrink-0">
              {DAY_NAMES.map(d => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{d}</div>
              ))}
            </div>
            <div className="flex-1 grid grid-cols-7" style={{ gridTemplateRows: `repeat(${calDays.length / 7}, 1fr)` }}>
              {calDays.map((date, idx) => {
                const key            = dateKey(date)
                const isCurrentMonth = date.getMonth() === month
                const isToday        = key === todayKey
                const items          = itemMap[key] || []
                const shown          = items.slice(0, 3)
                const overflow       = items.length - shown.length
                return (
                  <div key={idx} onClick={() => handleDayClick(key)}
                    className={`border-b border-r border-white/20 dark:border-white/6 p-1.5 cursor-pointer transition-colors overflow-hidden
                      ${isCurrentMonth ? 'bg-white/30 dark:bg-white/4' : 'bg-black/5 dark:bg-white/2'}
                      hover:bg-green-400/15 dark:hover:bg-green-500/10`}>
                    <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1
                      ${isToday ? 'bg-green-700 text-white' : isCurrentMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {shown.map(item => (
                        <div key={item.id} onClick={e => handleItemClick(e, item)} title={item.label}
                          className={`px-1 py-0.5 rounded text-xs font-medium truncate leading-tight
                            ${item.type === 'event' ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                          style={{ background: item.color + '22', color: item.color, borderLeft: `2px solid ${item.color}` }}>
                          <span className="hidden sm:inline">{item.label}</span>
                          <span className="sm:hidden" style={{ color: item.color }}>●</span>
                        </div>
                      ))}
                      {overflow > 0 && <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">+{overflow} more</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── WEEK / 3-DAY VIEW ── */}
        {(view === 'week' || view === '3day') && (
          <div className="flex-1 flex flex-col overflow-hidden pb-24 lg:pb-0">
            <div className="grid flex-shrink-0 border-b border-white/20 dark:border-white/6" style={{ gridTemplateColumns: `repeat(${multiDays.length}, 1fr)` }}>
              {multiDays.map((date, i) => {
                const isToday = dateKey(date) === todayKey
                return (
                  <div key={i} className={`py-3 text-center border-r border-white/20 dark:border-white/6 last:border-r-0
                    ${isToday ? 'bg-green-400/15 dark:bg-green-500/10' : ''}`}>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {DAY_NAMES[(date.getDay() + 6) % 7]}
                    </div>
                    <div className={`text-xl font-bold mt-0.5 w-10 h-10 mx-auto flex items-center justify-center rounded-full
                      ${isToday ? 'bg-green-700 text-white' : 'text-gray-800 dark:text-gray-100'}`}>
                      {date.getDate()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {MONTH_SHORT[date.getMonth()]}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex-1 flex overflow-hidden">
              {multiDays.map((date, i) => {
                const key   = dateKey(date)
                const items = itemMap[key] || []
                return (
                  <div key={i}
                    onClick={() => handleDayClick(key)}
                    className="flex-1 border-r border-white/20 dark:border-white/6 last:border-r-0 p-2 overflow-y-auto cursor-pointer hover:bg-green-400/10 dark:hover:bg-green-500/8 transition-colors">
                    <div className="space-y-1.5">
                      {items.map(item => itemChip(item))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {selectedItem !== null && (
        <EventDetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} onEdit={handleEditFromPanel} isDesktop={isDesktop} />
      )}

      {selectedEvent !== null && (
        <EventDrawer event={selectedEvent} onClose={() => setSelected(null)} onSave={handleSave} onDelete={selectedEvent.id ? handleDelete : null} isDesktop={isDesktop} />
      )}

      <button
        onClick={() => { setSelectedItem(null); setSelected({ title: '', date: todayKey, endDate: '', color: '#6366f1', notes: '' }) }}
        className="fixed bottom-20 right-5 lg:bottom-8 lg:right-8 w-14 h-14 rounded-full bg-green-700 hover:bg-green-800 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-green-700/30 transition-all z-30">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}
