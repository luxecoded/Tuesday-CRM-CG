import { useState } from 'react'
import { useOrders } from '../hooks/useOrders'
import OrderDrawer from '../components/OrderDrawer'
import ThemeToggle from '../components/ThemeToggle'
import { useThemeContext } from '../context/ThemeContext'
import { useIsDesktop } from '../hooks/useIsDesktop'

function fmt(val) {
  if (!val && val !== 0) return '—'
  return `£${Number(val).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function productSummary(order) {
  const parts = []
  if (order.windowsCount > 0) parts.push(`${order.windowsCount}× ${order.windowsType || 'Window'}`)
  if (order.doorsCount   > 0) parts.push(`${order.doorsCount}× ${order.doorsType || 'Door'}`)
  return parts.join(', ') || '—'
}

function StatusDots({ order }) {
  const flags = [
    { key: 'surveyBooked',      label: 'Survey' },
    { key: 'contactedCustomer', label: 'Contacted' },
    { key: 'surveyToSupplier',  label: 'To Supplier' },
    { key: 'customerNotified',  label: 'Notified' },
    { key: 'checkedSignedOff',  label: 'Signed Off' },
  ]
  return (
    <div className="flex gap-1">
      {flags.map(f => (
        <span key={f.key} title={f.label}
          className={`w-2 h-2 rounded-full flex-shrink-0 ${order[f.key] ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
      ))}
    </div>
  )
}

export default function Orders() {
  const { orders, loading, error, createOrder, updateOrder, deleteOrder } = useOrders()
  const { theme, setTheme } = useThemeContext()
  const isDesktop = useIsDesktop()

  const [search, setSearch]           = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isCreating, setIsCreating]   = useState(false)

  const filtered = orders.filter(o => {
    const term = search.toLowerCase()
    return !term ||
      (o.customerName   || '').toLowerCase().includes(term) ||
      (o.ewtJobRef      || '').toLowerCase().includes(term) ||
      (o.ewtQuoteRef    || '').toLowerCase().includes(term) ||
      (o.supplierName   || '').toLowerCase().includes(term) ||
      (o.installAddress || '').toLowerCase().includes(term)
  })

  const totalValue    = filtered.reduce((s, o) => s + (o.total || 0), 0)
  const signedOffCount = filtered.filter(o => o.checkedSignedOff).length

  const openDrawer  = order => { setIsCreating(false); setSelectedOrder(order) }
  const openNew     = ()    => { setSelectedOrder(null); setIsCreating(true) }
  const closeDrawer = ()   => { setSelectedOrder(null); setIsCreating(false) }

  const handleSave = async (data) => {
    if (data.id) {
      await updateOrder(data)
      setSelectedOrder(data)
    } else {
      const created = await createOrder(data)
      setIsCreating(false)
      setSelectedOrder(created)
    }
  }

  const handleDelete = async (id) => {
    await deleteOrder(id)
    closeDrawer()
  }

  const drawerOrder = isCreating ? null : selectedOrder
  const drawerOpen  = isCreating || !!selectedOrder

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
      <div className="text-center"><div className="text-3xl mb-2 animate-spin">⟳</div><p className="text-sm">Loading orders…</p></div>
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
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Orders</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>

        {/* Search */}
        <div className="bg-white/20 dark:bg-white/3 backdrop-blur-md border-b border-white/20 dark:border-white/6 px-4 lg:px-6 py-3 flex-shrink-0">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search orders…"
            className="w-full px-4 py-2.5 bg-white/50 dark:bg-white/7 border border-white/50 dark:border-white/10 rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-500/60 dark:placeholder-gray-400 outline-none focus:border-green-500/60 dark:focus:border-green-500/50 transition-colors"
          />
        </div>

        {/* Summary */}
        <div className="px-4 lg:px-6 pt-3 pb-1 flex-shrink-0">
          <div className="bg-white/45 dark:bg-white/7 border border-white/35 dark:border-white/10 rounded-2xl px-4 py-3 flex justify-around shadow-sm">
            <div className="text-center">
              <div className="text-base font-bold text-gray-900 dark:text-white">{filtered.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Orders</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-gray-900 dark:text-white">{fmt(totalValue)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-green-700 dark:text-green-400">{signedOffCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Signed Off</div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-3 pb-24 lg:pb-6">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-sm">{search ? 'No orders match your search' : 'No orders yet — hit + to add one'}</p>
            </div>
          ) : (
            <div className="bg-white/40 dark:bg-white/7 rounded-2xl border border-white/35 dark:border-white/10 overflow-hidden">

              {/* Table header — desktop */}
              <div className="hidden lg:grid grid-cols-[1.5fr_2fr_2.5fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2.5 bg-black/5 dark:bg-white/3 border-b border-white/20 dark:border-white/8">
                {['Job Ref', 'Customer', 'Products', 'EWT', 'Supplier', 'Total', 'Status'].map(h => (
                  <span key={h} className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</span>
                ))}
              </div>

              {/* Rows */}
              {filtered.map((order, i) => (
                <div key={order.id} onClick={() => openDrawer(order)}
                  className={`grid grid-cols-1 lg:grid-cols-[1.5fr_2fr_2.5fr_1fr_1fr_1fr_auto] gap-1 lg:gap-4 px-4 py-3.5 cursor-pointer transition-colors border-l-4
                    ${selectedOrder?.id === order.id
                      ? 'bg-green-400/15 dark:bg-green-500/10 border-l-green-500'
                      : i % 2 === 0
                        ? 'bg-transparent hover:bg-white/20 dark:hover:bg-white/5 border-l-transparent'
                        : 'bg-white/15 dark:bg-white/3 hover:bg-white/25 dark:hover:bg-white/6 border-l-transparent'
                    }`}>

                  {/* Mobile */}
                  <div className="lg:hidden flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{order.customerName || '—'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {order.ewtJobRef || 'No ref'}{order.windowsCount + order.doorsCount > 0 ? ` · ${productSummary(order)}` : ''}
                      </p>
                      <div className="mt-1.5"><StatusDots order={order} /></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white ml-3">{fmt(order.total)}</span>
                  </div>

                  {/* Desktop */}
                  <span className="hidden lg:block text-sm font-medium text-gray-900 dark:text-white truncate">{order.ewtJobRef || '—'}</span>
                  <span className="hidden lg:block text-sm text-gray-700 dark:text-gray-300 truncate">{order.customerName || '—'}</span>
                  <span className="hidden lg:block text-xs text-gray-500 dark:text-gray-400 truncate">{productSummary(order)}</span>
                  <span className="hidden lg:block text-sm font-medium text-gray-900 dark:text-white">{fmt(order.installationCharge)}</span>
                  <span className="hidden lg:block text-sm text-gray-700 dark:text-gray-300">{fmt(order.supplierCharge)}</span>
                  <span className="hidden lg:block text-sm font-semibold text-gray-900 dark:text-white">{fmt(order.total)}</span>
                  <div className="hidden lg:flex items-center"><StatusDots order={order} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && isDesktop && (
        <OrderDrawer order={drawerOrder} onClose={closeDrawer} onSave={handleSave} onDelete={handleDelete} isDesktop={true} />
      )}
      {drawerOpen && !isDesktop && (
        <OrderDrawer order={drawerOrder} onClose={closeDrawer} onSave={handleSave} onDelete={handleDelete} isDesktop={false} />
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
