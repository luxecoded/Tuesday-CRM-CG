import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { useQuotes } from '../hooks/useQuotes'
import { useJobs } from '../hooks/useJobs'
import QuoteDrawer from '../components/QuoteDrawer'
import ThemeToggle from '../components/ThemeToggle'
import { useThemeContext } from '../context/ThemeContext'
import { useIsDesktop } from '../hooks/useIsDesktop'

const STATUS_OPTIONS = ['All', 'draft', 'sent', 'accepted', 'declined']
const STATUS_LABELS  = { draft: 'Draft', sent: 'Sent', accepted: 'Accepted', declined: 'Declined' }
const STATUS_BADGE   = {
  draft:    'bg-gray-400/20 text-gray-600 dark:text-gray-300',
  sent:     'bg-amber-400/20 text-amber-700 dark:text-amber-300',
  accepted: 'bg-green-400/20 text-green-700 dark:text-green-300',
  declined: 'bg-red-400/20 text-red-700 dark:text-red-300',
}

function fmt(val) {
  if (!val) return '—'
  return `£${Number(val).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default function Quotes() {
  const { quotes, loading, error, createQuote, updateQuote, deleteQuote } = useQuotes()
  const { jobs } = useJobs()
  const { theme, setTheme } = useThemeContext()
  const isDesktop = useIsDesktop()
  const showToast = useToast()

  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedQuote, setSelectedQuote] = useState(null)
  const [isCreating, setIsCreating]     = useState(false)
  const location = useLocation()
  const didOpen  = useRef(false)

  useEffect(() => {
    if (loading || didOpen.current) return
    if (location.state?.openQuoteId) {
      const q = quotes.find(x => x.id === location.state.openQuoteId)
      if (q) { didOpen.current = true; openDrawer(q) }
    } else if (location.state?.newQuoteForJobId) {
      didOpen.current = true
      setSelectedQuote(null)
      setIsCreating(true)
    }
  }, [quotes, loading])

  const filtered = quotes.filter(q => {
    const matchStatus = statusFilter === 'All' || q.status === statusFilter
    const term = search.toLowerCase()
    const matchSearch = !term ||
      (q.customerName || '').toLowerCase().includes(term) ||
      (q.ewtQuoteRef  || '').toLowerCase().includes(term) ||
      (q.jobTitle     || '').toLowerCase().includes(term) ||
      (q.supplierName || '').toLowerCase().includes(term)
    return matchStatus && matchSearch
  })

  const totalValue    = filtered.reduce((s, q) => s + (q.ewtValue || 0), 0)
  const acceptedCount = filtered.filter(q => q.status === 'accepted').length

  const openDrawer  = quote => { setIsCreating(false); setSelectedQuote(quote) }
  const openNew     = ()    => { setSelectedQuote(null); setIsCreating(true) }
  const closeDrawer = ()    => { setSelectedQuote(null); setIsCreating(false) }

  const handleSave = async (data) => {
    try {
      if (data.id) {
        const fresh = await updateQuote(data)
        setSelectedQuote(fresh)
      } else {
        const created = await createQuote(data)
        setIsCreating(false)
        setSelectedQuote(created)
      }
      showToast(data.id ? 'Quote saved' : 'Quote created')
    } catch {
      showToast('Failed to save quote', 'error')
    }
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-ink-muted">
      <div className="text-center"><div className="text-3xl mb-2 animate-spin">⟳</div><p className="text-sm">Loading quotes…</p></div>
    </div>
  )

  if (error) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-red-400"><div className="text-3xl mb-2">⚠️</div><p className="text-sm">{error}</p></div>
    </div>
  )

  const drawerProps = {
    quote: isCreating ? (location.state?.newQuoteForJobId ? { jobId: location.state.newQuoteForJobId } : null) : selectedQuote,
    onClose: closeDrawer,
    onSave: handleSave,
    onDelete: !isCreating ? deleteQuote : undefined,
    jobs,
    isDesktop,
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <div className="bg-surface-bar backdrop-blur-xl border-b border-edge px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-ink">Quotes</h1>
            <p className="text-xs text-ink-muted">{filtered.length} quotes</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
        </div>

        {/* Search + filter */}
        <div className="bg-surface-dim backdrop-blur-md border-b border-edge-dim px-4 lg:px-6 py-3 flex-shrink-0 flex gap-2">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search quotes…"
            className="flex-1 px-4 py-2.5 bg-surface-input border border-edge-input rounded-full text-sm text-ink placeholder:text-ink-placeholder outline-none focus:border-green-500/55 transition-colors"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-surface-input border border-edge-input rounded-full text-sm text-ink outline-none focus:border-green-500/55 transition-colors cursor-pointer"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s === 'All' ? 'All Statuses' : STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {/* Summary */}
        <div className="px-4 lg:px-6 pt-3 pb-1 flex-shrink-0">
          <div className="bg-surface-raised border border-edge-hi rounded-2xl px-4 py-3 flex justify-around shadow-sm">
            <div className="text-center">
              <div className="text-base font-bold text-ink">{filtered.length}</div>
              <div className="text-xs text-ink-muted mt-0.5">Quotes</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-ink">{fmt(totalValue)}</div>
              <div className="text-xs text-ink-muted mt-0.5">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-green-600 dark:text-green-400">{acceptedCount}</div>
              <div className="text-xs text-ink-muted mt-0.5">Accepted</div>
            </div>
          </div>
        </div>

        {/* Quote list */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-3 pb-24 lg:pb-6">
          <div className="bg-surface rounded-2xl border border-edge-hi overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-head border-b border-edge-dim">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide">Customer</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide hidden sm:table-cell">Job</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide hidden md:table-cell">Ref</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide">Sale / Cost</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q, i) => (
                  <tr key={q.id}
                    onClick={() => openDrawer(q)}
                    className={`cursor-pointer transition-colors
                      ${selectedQuote?.id === q.id
                        ? 'bg-surface-selected'
                        : i % 2 === 0
                          ? 'bg-transparent hover:bg-surface-hover'
                          : 'bg-surface-row hover:bg-surface-hover-b'
                      }`}>
                    <td className="px-4 py-3 font-medium text-ink">{q.customerName || '—'}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-ink-soft text-xs">{q.jobTitle || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-ink-muted text-xs">{q.ewtQuoteRef || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-ink">{fmt(q.ewtValue)}</span>
                      {q.supplierValue > 0 && <span className="block text-xs text-ink-faint">{fmt(q.supplierValue)}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[q.status] || ''}`}>
                        {STATUS_LABELS[q.status] || q.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-ink-muted">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-sm">No quotes found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {(selectedQuote || isCreating) && <QuoteDrawer {...drawerProps} />}

      {/* FAB — New Quote */}
      <button onClick={openNew}
        className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8 z-40 group flex items-center gap-3 pointer-events-auto">
        <span className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 bg-gray-900/90 dark:bg-gray-800/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap backdrop-blur-sm">
          New Quote
        </span>
        <div className="w-14 h-14 rounded-full bg-green-700 hover:bg-green-600 active:scale-95 flex items-center justify-center shadow-lg shadow-green-700/40 transition-all duration-150 hover:scale-105">
          <span className="text-white text-3xl font-extralight leading-none mt-[-2px]">+</span>
        </div>
      </button>
    </div>
  )
}
