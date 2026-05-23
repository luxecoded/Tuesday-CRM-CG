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

function itemsSummary(items) {
  if (!items || items.length === 0) return '—'
  return items.map(i => `${i.quantity > 1 ? `${i.quantity}× ` : ''}${i.productName}`).join(', ')
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
  const { orders, loading, error, updateOrder, deleteOrder } = useOrders()
  const { theme, setTheme } = useThemeContext()
  const isDesktop = useIsDesktop()

  const [search, setSearch]           = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)

  const filtered = orders.filter(o => {
    const term = search.toLowerCase()
    return !term ||
      (o.customerName    || '').toLowerCase().includes(term) ||
      (o.ewtJobRef       || '').toLowerCase().includes(term) ||
      (o.jobTitle        || '').toLowerCase().includes(term) ||
      (o.addressLine1    || '').toLowerCase().includes(term)
  })

  const totalValue     = filtered.reduce((s, o) => s + (o.total || 0), 0)
  const signedOffCount = filtered.filter(o => o.checkedSignedOff).length

  const openDrawer  = order => setSelectedOrder(order)
  const closeDrawer = ()    => setSelectedOrder(null)

  const handleSave = async (data) => {
    await updateOrder(data)
    setSelectedOrder(data)
  }

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
            <p className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} orders</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
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
              <div className="text-base font-bold text-green-600 dark:text-green-400">{signedOffCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Signed Off</div>
            </div>
          </div>
        </div>

        {/* Orders list */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-3 pb-24 lg:pb-6">
          <div className="bg-white/40 dark:bg-white/7 rounded-2xl border border-white/35 dark:border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-black/5 dark:bg-white/3 border-b border-white/20 dark:border-white/8">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Items</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Ref</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Progress</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => (
                  <tr key={order.id}
                    onClick={() => openDrawer(order)}
                    className={`cursor-pointer transition-colors
                      ${selectedOrder?.id === order.id
                        ? 'bg-green-400/15 dark:bg-green-500/10'
                        : i % 2 === 0
                          ? 'bg-transparent hover:bg-white/20 dark:hover:bg-white/5'
                          : 'bg-white/15 dark:bg-white/3 hover:bg-white/25 dark:hover:bg-white/6'
                      }`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{order.customerName || '—'}</div>
                      {order.jobTitle && <div className="text-xs text-gray-500 dark:text-gray-400">{order.jobTitle}</div>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-500 dark:text-gray-400 max-w-[180px] truncate">{itemsSummary(order.items)}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500 dark:text-gray-400">{order.ewtJobRef || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{fmt(order.total)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell"><StatusDots order={order} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="text-3xl mb-2">📦</div>
                <p className="text-sm">No orders found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={closeDrawer}
          onSave={handleSave}
          onDelete={deleteOrder}
          isDesktop={isDesktop}
        />
      )}
    </div>
  )
}
