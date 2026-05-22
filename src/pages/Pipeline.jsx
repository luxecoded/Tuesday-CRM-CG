import { useState } from 'react'
import { useDeals } from '../hooks/useDeals'
import { useContacts } from '../hooks/useContacts'
import DealDrawer from '../components/DealDrawer'
import ThemeToggle from '../components/ThemeToggle'
import { useThemeContext } from '../context/ThemeContext'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { getUserName } from '../components/PasswordGate'

const STAGE_ORDER = [
  'Quote','Awaiting Client','Survey','Follow Up','Signed',
  'To Order','Installation TBC','Installation Booked',
  'Installed Pending Certification','Awaiting Payment','Completed','Service Call'
]

const STAGE_COLORS = {
  'Quote':                          '#a855f7',
  'Awaiting Client':                '#f59e0b',
  'Survey':                         '#38bdf8',
  'Follow Up':                      '#ec4899',
  'Signed':                         '#7c3aed',
  'To Order':                       '#f97316',
  'Installation TBC':               '#84cc16',
  'Installation Booked':            '#10b981',
  'Installed Pending Certification':'#14b8a6',
  'Awaiting Payment':               '#f59e0b',
  'Completed':                      '#059669',
  'Service Call':                   '#6b7280',
}

const COMPANY_CLASSES = {
  'Elite Windows': 'bg-emerald-400/20 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
}

function fmt(val) {
  if (!val) return '—'
  return `£${Number(val).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default function Pipeline() {
  const { deals, loading, error, updateDeal } = useDeals()
  const { contacts } = useContacts()
  const { theme, setTheme } = useThemeContext()
  const [search, setSearch]           = useState('')
  const [stageFilter, setStageFilter] = useState('All')
  const [viewMode, setViewMode]       = useState(() => localStorage.getItem('tuesday-view-mode') || 'card')
  const [groupFilter, setGroupFilter]   = useState(() => localStorage.getItem('tuesday-group-filter') || 'active')
  const [selectedDeal, setSelectedDeal] = useState(null)
  const isDesktop = useIsDesktop()
  const userName = getUserName()
  const initials = userName ? userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'

  const setView = mode => { setViewMode(mode); localStorage.setItem('tuesday-view-mode', mode) }
  const setGroup = g => { setGroupFilter(g); localStorage.setItem('tuesday-group-filter', g); setSelectedDeal(null) }

  const activeDeals = deals.filter(d => d.group === groupFilter)
  const filtered = activeDeals.filter(d => {
    const matchStage = stageFilter === 'All' || d.stage === stageFilter
    const q = search.toLowerCase()
    const matchSearch = !q || (d.deal || '').toLowerCase().includes(q) || (d.company || '').toLowerCase().includes(q)
    return matchStage && matchSearch
  })

  const totalValue = filtered.reduce((s, d) => s + (d.value || 0), 0)
  const stages = STAGE_ORDER.filter(s => filtered.some(d => d.stage === s))

  const handleSave = async (updated) => {
    await updateDeal(updated)
    setSelectedDeal(updated)
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
      <div className="text-center"><div className="text-3xl mb-2 animate-spin">⟳</div><p className="text-sm">Loading deals…</p></div>
    </div>
  )

  if (error) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-red-400"><div className="text-3xl mb-2">⚠️</div><p className="text-sm">{error}</p></div>
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
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} {groupFilter} deals</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-black/10 dark:bg-white/8 rounded-lg p-0.5">
              <button onClick={() => setGroup('active')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${groupFilter === 'active'
                    ? 'bg-white/70 dark:bg-white/15 text-green-800 dark:text-green-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300'}`}>
                Active
              </button>
              <button onClick={() => setGroup('won')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${groupFilter === 'won'
                    ? 'bg-white/70 dark:bg-white/15 text-green-800 dark:text-green-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300'}`}>
                Won
              </button>
            </div>
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <div className="flex bg-black/10 dark:bg-white/8 rounded-lg p-0.5">
              <button onClick={() => setView('card')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${viewMode === 'card'
                    ? 'bg-white/70 dark:bg-white/15 text-green-800 dark:text-green-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300'}`}>
                ⊞ Grid
              </button>
              <button onClick={() => setView('list')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${viewMode === 'list'
                    ? 'bg-white/70 dark:bg-white/15 text-green-800 dark:text-green-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300'}`}>
                ☰ List
              </button>
            </div>
          </div>
        </div>

        {/* Search + filters */}
        <div className="bg-white/20 dark:bg-white/3 backdrop-blur-md border-b border-white/20 dark:border-white/6 px-4 lg:px-6 py-3 flex-shrink-0 space-y-2">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search deals…"
            className="w-full px-4 py-2.5 bg-white/50 dark:bg-white/7 border border-white/50 dark:border-white/10 rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-500/60 dark:placeholder-gray-400 outline-none focus:border-green-500/60 dark:focus:border-green-500/50 transition-colors"
          />
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {['All', ...STAGE_ORDER].map(s => (
              <button key={s} onClick={() => setStageFilter(s)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                  ${stageFilter === s
                    ? 'bg-green-700/90 border-green-700/90 text-white'
                    : 'bg-white/30 dark:bg-white/6 border-white/40 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-green-500/60 dark:hover:border-green-500/40'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="px-4 lg:px-6 pt-3 pb-1 flex-shrink-0">
          <div className="bg-white/45 dark:bg-white/7 border border-white/35 dark:border-white/10 rounded-2xl px-4 py-3 flex justify-around shadow-sm">
            <div className="text-center">
              <div className="text-base font-bold text-gray-900 dark:text-white">{filtered.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Deals</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-gray-900 dark:text-white">{fmt(totalValue)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Pipeline</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-gray-900 dark:text-white">{stages.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Stages</div>
            </div>
          </div>
        </div>

        {/* Deals list */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-3 pb-24 lg:pb-6 space-y-5">
          {stages.map(stage => {
            const stageDeals = filtered.filter(d => d.stage === stage)
            const color = STAGE_COLORS[stage] || '#6b7280'
            return (
              <div key={stage}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{stage}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-white/30 dark:bg-white/8 px-2 py-0.5 rounded-full">{stageDeals.length}</span>
                </div>

                {/* Card view */}
                {viewMode === 'card' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {stageDeals.map(deal => (
                      <div key={deal.id} onClick={() => setSelectedDeal(deal)}
                        className={`bg-white/50 dark:bg-white/8 rounded-2xl border p-4 cursor-pointer transition-all relative overflow-hidden shadow-sm
                          ${selectedDeal?.id === deal.id
                            ? 'border-green-500/60 shadow-md shadow-green-500/10'
                            : 'border-white/40 dark:border-white/10 hover:border-green-500/50 hover:bg-white/60 dark:hover:bg-white/12'}`}>
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: color }} />
                        <div className="pl-3">
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm">{deal.deal || '—'}</span>
                            <span className={`font-bold text-sm ${deal.value ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>{fmt(deal.value)}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${COMPANY_CLASSES[deal.company] || 'bg-white/30 dark:bg-white/8 text-gray-500'}`}>
                              {deal.company || '—'}
                            </span>
                            {deal.quoteSent && <span className="text-xs text-gray-500 dark:text-gray-400">Sent {deal.quoteSent}</span>}
                            {deal.deposit && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Deposit</span>}
                          </div>
                          {deal.comments && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-1">{deal.comments}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* List view */}
                {viewMode === 'list' && (
                  <div className="bg-white/40 dark:bg-white/7 rounded-2xl border border-white/35 dark:border-white/10 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-black/5 dark:bg-white/3 border-b border-white/20 dark:border-white/8">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Deal</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Company</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Value</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stageDeals.map((deal, i) => (
                          <tr key={deal.id} onClick={() => setSelectedDeal(deal)}
                            className={`cursor-pointer transition-colors border-l-4
                              ${selectedDeal?.id === deal.id
                                ? 'bg-green-400/15 dark:bg-green-500/10'
                                : i % 2 === 0
                                  ? 'bg-transparent hover:bg-white/20 dark:hover:bg-white/5'
                                  : 'bg-white/15 dark:bg-white/3 hover:bg-white/25 dark:hover:bg-white/6'
                              }`}
                            style={{ borderLeftColor: color }}>
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{deal.deal || '—'}</td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${COMPANY_CLASSES[deal.company] || 'bg-white/30 dark:bg-white/8 text-gray-500'}`}>
                                {deal.company || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{fmt(deal.value)}</td>
                            <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">{deal.comments || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-3">{groupFilter === 'won' ? '🏆' : '🔍'}</div>
              <p className="text-sm">{groupFilter === 'won' ? 'No won deals yet' : 'No deals match your search'}</p>
            </div>
          )}
        </div>
      </div>

      {selectedDeal && isDesktop && (
        <DealDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} onSave={handleSave} isDesktop={true} contacts={contacts} />
      )}

      {selectedDeal && !isDesktop && (
        <DealDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} onSave={handleSave} isDesktop={false} contacts={contacts} />
      )}
    </div>
  )
}
