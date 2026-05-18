import { useState } from 'react'
import { useDeals } from '../hooks/useDeals'
import DealDrawer from '../components/DealDrawer'
import ThemeToggle from '../components/ThemeToggle'
import { useThemeContext } from '../context/ThemeContext'

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
  'Signed':                         '#6366f1',
  'To Order':                       '#f97316',
  'Installation TBC':               '#84cc16',
  'Installation Booked':            '#10b981',
  'Installed Pending Certification':'#14b8a6',
  'Awaiting Payment':               '#f59e0b',
  'Completed':                      '#059669',
  'Service Call':                   '#6b7280',
}

const COMPANY_CLASSES = {
  'Isis Windows':     'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  'Paradise Windows': 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  'Elite Windows':    'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
}

function fmt(val) {
  if (!val) return '—'
  return `£${Number(val).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default function Pipeline() {
  const { deals, loading, error, updateDeal } = useDeals()
  const { theme, setTheme } = useThemeContext()
  const [search, setSearch]           = useState('')
  const [stageFilter, setStageFilter] = useState('All')
  const [viewMode, setViewMode]       = useState(() => localStorage.getItem('tuesday-view-mode') || 'card')
  const [selectedDeal, setSelectedDeal] = useState(null)
  const isDesktop = window.innerWidth >= 1024

  const setView = mode => { setViewMode(mode); localStorage.setItem('tuesday-view-mode', mode) }

  const activeDeals = deals.filter(d => d.group === 'active')
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
    <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-900">
      <div className="text-center"><div className="text-3xl mb-2 animate-spin">⟳</div><p className="text-sm">Loading deals…</p></div>
    </div>
  )

  if (error) return (
    <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center text-red-400"><div className="text-3xl mb-2">⚠️</div><p className="text-sm">{error}</p></div>
    </div>
  )

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0 transition-colors">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Pipeline</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">{filtered.length} active deals</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <ThemeToggle theme={theme} setTheme={setTheme} />

            {/* View toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
              <button onClick={() => setView('card')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${viewMode === 'card'
                    ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'}`}>
                ⊞ Cards
              </button>
              <button onClick={() => setView('list')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'}`}>
                ☰ List
              </button>
            </div>
          </div>
        </div>

        {/* Search + filters */}
        <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 flex-shrink-0 space-y-2 transition-colors">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search deals…"
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors"
          />
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {['All', ...STAGE_ORDER].map(s => (
              <button key={s} onClick={() => setStageFilter(s)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                  ${stageFilter === s
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-600'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="px-4 lg:px-6 pt-3 pb-1 flex-shrink-0 bg-gray-100 dark:bg-gray-900 transition-colors">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 flex justify-around transition-colors">
            <div className="text-center">
              <div className="text-base font-bold text-gray-900 dark:text-white">{filtered.length}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Deals</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-gray-900 dark:text-white">{fmt(totalValue)}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Pipeline</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-gray-900 dark:text-white">{stages.length}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Stages</div>
            </div>
          </div>
        </div>

        {/* Deals list */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-3 pb-24 lg:pb-6 space-y-5 bg-gray-100 dark:bg-gray-900 transition-colors">
          {stages.map(stage => {
            const stageDeals = filtered.filter(d => d.stage === stage)
            const color = STAGE_COLORS[stage] || '#6b7280'
            return (
              <div key={stage}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{stage}</span>
                  <span className="text-xs text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{stageDeals.length}</span>
                </div>

                {/* Card view */}
                {viewMode === 'card' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {stageDeals.map(deal => (
                      <div key={deal.id} onClick={() => setSelectedDeal(deal)}
                        className={`bg-white dark:bg-gray-800 rounded-xl border p-4 cursor-pointer transition-all relative overflow-hidden
                          ${selectedDeal?.id === deal.id
                            ? 'border-indigo-400 shadow-md shadow-indigo-100 dark:shadow-indigo-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm'}`}>
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: color }} />
                        <div className="pl-3">
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm">{deal.deal || '—'}</span>
                            <span className={`font-bold text-sm ${deal.value ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>{fmt(deal.value)}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${COMPANY_CLASSES[deal.company] || 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                              {deal.company || '—'}
                            </span>
                            {deal.quoteSent && <span className="text-xs text-gray-400 dark:text-gray-500">Sent {deal.quoteSent}</span>}
                            {deal.deposit && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Deposit</span>}
                          </div>
                          {deal.comments && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 line-clamp-1">{deal.comments}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* List view */}
                {viewMode === 'list' && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Deal</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide hidden sm:table-cell">Company</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Value</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide hidden md:table-cell">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stageDeals.map((deal, i) => (
                          <tr key={deal.id} onClick={() => setSelectedDeal(deal)}
                            className={`cursor-pointer transition-colors border-l-4
                              ${selectedDeal?.id === deal.id
                                ? 'bg-indigo-50 dark:bg-indigo-900/20'
                                : i % 2 === 0
                                  ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                  : 'bg-gray-50/50 dark:bg-gray-700/20 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                              }`}
                            style={{ borderLeftColor: color }}>
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{deal.deal || '—'}</td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${COMPANY_CLASSES[deal.company] || 'bg-gray-50 dark:bg-gray-700 text-gray-500'}`}>
                                {deal.company || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{fmt(deal.value)}</td>
                            <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-400 dark:text-gray-500 max-w-xs truncate">{deal.comments || '—'}</td>
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
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm">No deals match your search</p>
            </div>
          )}
        </div>
      </div>

      {/* Desktop deal panel */}
      {selectedDeal && isDesktop && (
        <DealDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} onSave={handleSave} isDesktop={true} />
      )}

      {/* Mobile deal drawer */}
      {selectedDeal && !isDesktop && (
        <DealDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} onSave={handleSave} isDesktop={false} />
      )}
    </div>
  )
}
