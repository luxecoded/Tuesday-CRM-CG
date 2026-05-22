import { useState } from 'react'
import { useQuotes } from '../hooks/useQuotes'
import QuoteDrawer from '../components/QuoteDrawer'
import ThemeToggle from '../components/ThemeToggle'
import { useThemeContext } from '../context/ThemeContext'
import { useIsDesktop } from '../hooks/useIsDesktop'

const RESPONSE_OPTIONS = ['All', 'Waiting', 'Go Ahead', 'No Go']

const RESPONSE_BADGE = {
  'Waiting':  'bg-amber-400/20 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  'Go Ahead': 'bg-green-400/20 text-green-700 dark:bg-green-400/15 dark:text-green-300',
  'No Go':    'bg-red-400/20 text-red-700 dark:bg-red-400/15 dark:text-red-300',
}

function fmt(val) {
  if (!val) return '—'
  return `£${Number(val).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default function Quotes() {
  const { quotes, loading, error, createQuote, updateQuote, deleteQuote } = useQuotes()
  const { theme, setTheme } = useThemeContext()
  const isDesktop = useIsDesktop()

  const [search, setSearch]             = useState('')
  const [responseFilter, setResponseFilter] = useState('All')
  const [selectedQuote, setSelectedQuote]   = useState(null)
  const [isCreating, setIsCreating]         = useState(false)

  const filtered = quotes.filter(q => {
    const matchResponse = responseFilter === 'All' || q.response === responseFilter
    const term = search.toLowerCase()
    const matchSearch = !term ||
      (q.customerName || '').toLowerCase().includes(term) ||
      (q.ewtQuoteRef  || '').toLowerCase().includes(term) ||
      (q.products     || '').toLowerCase().includes(term) ||
      (q.supplierName || '').toLowerCase().includes(term)
    return matchResponse && matchSearch
  })

  const optionsTotal = q => (q.options || []).reduce((s, o) => s + (o.total || 0), 0)
  const totalValue = filtered.reduce((s, q) => s + optionsTotal(q), 0)
  const goAheadCount = filtered.filter(q => q.response === 'Go Ahead').length

  const openDrawer = quote => { setIsCreating(false); setSelectedQuote(quote) }
  const openNew    = ()    => { setSelectedQuote(null); setIsCreating(true) }
  const closeDrawer = ()  => { setSelectedQuote(null); setIsCreating(false) }

  const handleSave = async (data) => {
    if (data.id) {
      await updateQuote(data)
      setSelectedQuote(data)
    } else {
      const created = await createQuote(data)
      setIsCreating(false)
      setSelectedQuote(created)
    }
  }

  const handleDelete = async (id) => {
    await deleteQuote(id)
    closeDrawer()
  }

  const drawerQuote  = isCreating ? null : selectedQuote
  const drawerOpen   = isCreating || !!selectedQuote

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
      <div className="text-center"><div className="text-3xl mb-2 animate-spin">⟳</div><p className="text-sm">Loading quotes…</p></div>
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
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Quotes</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} quote{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
        </div>

        {/* Search + filters */}
        <div className="bg-white/20 dark:bg-white/3 backdrop-blur-md border-b border-white/20 dark:border-white/6 px-4 lg:px-6 py-3 flex-shrink-0 space-y-2">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search quotes…"
            className="w-full px-4 py-2.5 bg-white/50 dark:bg-white/7 border border-white/50 dark:border-white/10 rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-500/60 dark:placeholder-gray-400 outline-none focus:border-green-500/60 dark:focus:border-green-500/50 transition-colors"
          />
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {RESPONSE_OPTIONS.map(opt => (
              <button key={opt} onClick={() => setResponseFilter(opt)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                  ${responseFilter === opt
                    ? 'bg-green-700/90 border-green-700/90 text-white'
                    : 'bg-white/30 dark:bg-white/6 border-white/40 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-green-500/60 dark:hover:border-green-500/40'}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="px-4 lg:px-6 pt-3 pb-1 flex-shrink-0">
          <div className="bg-white/45 dark:bg-white/7 border border-white/35 dark:border-white/10 rounded-2xl px-4 py-3 flex justify-around shadow-sm">
            <div className="text-center">
              <div className="text-base font-bold text-gray-900 dark:text-white">{filtered.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Quotes</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-gray-900 dark:text-white">{fmt(totalValue)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-green-700 dark:text-green-400">{goAheadCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Go Ahead</div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-3 pb-24 lg:pb-6">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm">No quotes yet — hit <strong>+ New Quote</strong> to add one</p>
            </div>
          ) : (
            <div className="bg-white/40 dark:bg-white/7 rounded-2xl border border-white/35 dark:border-white/10 overflow-hidden">
              {/* Table header */}
              <div className="hidden lg:grid grid-cols-[1.5fr_2fr_2fr_1fr_1fr_auto] gap-4 px-4 py-2.5 bg-black/5 dark:bg-white/3 border-b border-white/20 dark:border-white/8">
                {['Quote Ref', 'Customer', 'Address', 'Options', 'Total', 'Response'].map(h => (
                  <span key={h} className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</span>
                ))}
              </div>

              {/* Rows */}
              {filtered.map((quote, i) => {
                const qTotal = optionsTotal(quote)
                return (
                  <div key={quote.id} onClick={() => openDrawer(quote)}
                    className={`grid grid-cols-1 lg:grid-cols-[1.5fr_2fr_2fr_1fr_1fr_auto] gap-1 lg:gap-4 px-4 py-3.5 cursor-pointer transition-colors border-l-4
                      ${selectedQuote?.id === quote.id
                        ? 'bg-green-400/15 dark:bg-green-500/10 border-l-green-500'
                        : i % 2 === 0
                          ? 'bg-transparent hover:bg-white/20 dark:hover:bg-white/5 border-l-transparent'
                          : 'bg-white/15 dark:bg-white/3 hover:bg-white/25 dark:hover:bg-white/6 border-l-transparent'
                      }`}>

                    {/* Mobile: stacked layout */}
                    <div className="lg:hidden flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{quote.customerName || '—'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {quote.ewtQuoteRef || 'No ref'}
                          {quote.options?.length > 0 ? ` · ${quote.options.length} option${quote.options.length !== 1 ? 's' : ''}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${RESPONSE_BADGE[quote.response] || ''}`}>{quote.response}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{fmt(qTotal)}</span>
                      </div>
                    </div>

                    {/* Desktop: columns */}
                    <span className="hidden lg:block text-sm font-medium text-gray-900 dark:text-white truncate">{quote.ewtQuoteRef || '—'}</span>
                    <span className="hidden lg:block text-sm text-gray-700 dark:text-gray-300 truncate">{quote.customerName || '—'}</span>
                    <span className="hidden lg:block text-xs text-gray-500 dark:text-gray-400 truncate">{quote.address || '—'}</span>
                    <span className="hidden lg:block text-xs text-gray-500 dark:text-gray-400">
                      {quote.options?.length > 0
                        ? `${quote.options.length} option${quote.options.length !== 1 ? 's' : ''}`
                        : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </span>
                    <span className="hidden lg:block text-sm font-semibold text-gray-900 dark:text-white">{fmt(qTotal)}</span>
                    <span className={`hidden lg:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${RESPONSE_BADGE[quote.response] || ''}`}>{quote.response}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && isDesktop && (
        <QuoteDrawer quote={drawerQuote} onClose={closeDrawer} onSave={handleSave} onDelete={handleDelete} isDesktop={true} />
      )}
      {drawerOpen && !isDesktop && (
        <QuoteDrawer quote={drawerQuote} onClose={closeDrawer} onSave={handleSave} onDelete={handleDelete} isDesktop={false} />
      )}

      {/* Floating action button */}
      <button onClick={openNew}
        className="fixed bottom-20 right-5 lg:bottom-8 lg:right-8 w-14 h-14 rounded-full bg-green-700 hover:bg-green-800 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-green-700/30 transition-all z-30">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}
