import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
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
          className={`w-2 h-2 rounded-full flex-shrink-0 ${order[f.key] ? 'bg-green-500' : 'bg-ink-dot'}`} />
      ))}
    </div>
  )
}

export default function Orders() {
  const { orders, loading, error, updateOrder, deleteOrder } = useOrders()
  const { theme, setTheme } = useThemeContext()
  const isDesktop = useIsDesktop()
  const showToast = useToast()

  const [search, setSearch]             = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const location = useLocation()
  const didOpen  = useRef(false)

  useEffect(() => {
    if (!loading && location.state?.openOrderId && !didOpen.current) {
      const o = orders.find(x => x.id === location.state.openOrderId)
      if (o) { didOpen.current = true; openDrawer(o) }
    }
  }, [orders, loading])

  const filtered = orders.filter(o => {
    const term = search.toLowerCase()
    return !term ||
      (o.customerName || '').toLowerCase().includes(term) ||
      (o.ewtJobRef    || '').toLowerCase().includes(term) ||
      (o.jobTitle     || '').toLowerCase().includes(term) ||
      (o.addressLine1 || '').toLowerCase().includes(term)
  })

  const totalValue     = filtered.reduce((s, o) => s + (o.total || 0), 0)
  const signedOffCount = filtered.filter(o => o.checkedSignedOff).length

  const openDrawer  = order => setSelectedOrder(order)
  const closeDrawer = ()    => setSelectedOrder(null)

  const handleSave = async (data) => {
    try {
      const fresh = await updateOrder(data)
      setSelectedOrder(fresh)
      showToast('Order saved')
    } catch {
      showToast('Failed to save order', 'error')
    }
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-ink-muted">
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
        <div className="bg-surface-bar backdrop-blur-xl border-b border-edge px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-ink">Orders</h1>
            <p className="text-xs text-ink-muted">{filtered.length} orders</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
        </div>

        {/* Search */}
        <div className="bg-surface-dim backdrop-blur-md border-b border-edge-dim px-4 lg:px-6 py-3 flex-shrink-0">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search orders…"
            className="w-full px-4 py-2.5 bg-surface-input border border-edge-input rounded-full text-sm text-ink placeholder:text-ink-placeholder outline-none focus:border-green-500/55 transition-colors"
          />
        </div>

        {/* Summary */}
        <div className="px-4 lg:px-6 pt-3 pb-1 flex-shrink-0">
          <div className="bg-surface-raised border border-edge-hi rounded-2xl px-4 py-3 flex justify-around shadow-sm">
            <div className="text-center">
              <div className="text-base font-bold text-ink">{filtered.length}</div>
              <div className="text-xs text-ink-muted mt-0.5">Orders</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-ink">{fmt(totalValue)}</div>
              <div className="text-xs text-ink-muted mt-0.5">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-green-600 dark:text-green-400">{signedOffCount}</div>
              <div className="text-xs text-ink-muted mt-0.5">Signed Off</div>
            </div>
          </div>
        </div>

        {/* Orders list */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-3 pb-24 lg:pb-6">
          <div className="bg-surface rounded-2xl border border-edge-hi overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-head border-b border-edge-dim">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide">Customer</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide hidden sm:table-cell">Items</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide hidden md:table-cell">Ref</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide">Total</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-ink-muted uppercase tracking-wide hidden lg:table-cell">Progress</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => (
                  <tr key={order.id}
                    onClick={() => openDrawer(order)}
                    className={`cursor-pointer transition-colors
                      ${selectedOrder?.id === order.id
                        ? 'bg-surface-selected'
                        : i % 2 === 0
                          ? 'bg-transparent hover:bg-surface-hover'
                          : 'bg-surface-row hover:bg-surface-hover-b'
                      }`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{order.customerName || '—'}</div>
                      {order.jobTitle && <div className="text-xs text-ink-muted">{order.jobTitle}</div>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-ink-muted max-w-[180px] truncate">{itemsSummary(order.items)}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-ink-muted">{order.ewtJobRef || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">{fmt(order.total)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell"><StatusDots order={order} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-ink-muted">
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
