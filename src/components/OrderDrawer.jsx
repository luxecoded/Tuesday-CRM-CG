import { useState, useEffect, useCallback } from 'react'
import CommentsSection from './CommentsSection'

const inputCls = "w-full px-3 py-2.5 bg-white/50 dark:bg-white/8 border border-white/50 dark:border-white/15 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-green-500/60 dark:focus:border-green-500/50 transition-colors"

function fmt(val) {
  if (!val && val !== 0) return '—'
  return `£${Number(val).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{children}</span>
      <div className="flex-1 h-px bg-white/20 dark:bg-white/8" />
    </div>
  )
}

function StatusBadge({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-green-500 flex-shrink-0" />
      <span className={`text-sm font-medium transition-colors ${checked ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
        {checked ? '✓ ' : ''}{label}
      </span>
    </label>
  )
}

const BLANK = {
  jobId: '', quoteId: '', ewtJobRef: '', supplierQuoteRef: '', surveyor: '',
  surveyBooked: false, surveyDate: '', contactedCustomer: false,
  surveyToSupplier: false, checkedSignedOff: false,
  deliveryDateRequested: '', installStart: '', installEnd: '',
  customerNotified: false, depositReceived: false,
  materialsCost: 0, installationCharge: 0, supplierCharge: 0,
}

export default function OrderDrawer({ order, onClose, onSave, onDelete, isDesktop }) {
  const isNew = !order?.id
  const [form, setForm]     = useState(order || BLANK)
  const [saving, setSaving] = useState(false)
  const [open, setOpen]     = useState(false)

  useEffect(() => { setForm(order || BLANK) }, [order])

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    setTimeout(onClose, 300)
  }, [onClose])

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  const liveTotal = (form.materialsCost || 0) + (form.installationCharge || 0) + (form.supplierCharge || 0)
  const liveVat   = Math.round(liveTotal * 0.2 * 100) / 100
  const liveNett  = Math.round(liveTotal * 0.8 * 100) / 100

  const handleSave = async () => {
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!onDelete || !form.id) return
    if (!window.confirm('Delete this order?')) return
    setSaving(true)
    try { await onDelete(form.id); onClose() } finally { setSaving(false) }
  }

  const content = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-white/25 dark:border-white/10 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isNew ? 'New Order' : (form.ewtJobRef || form.jobTitle || form.customerName || 'Order')}
          </h2>
          {(form.customerName || form.jobTitle) && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {form.customerName}{form.jobTitle ? ` — ${form.jobTitle}` : ''}
            </p>
          )}
        </div>
        <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 flex items-center justify-center text-gray-700 dark:text-gray-300 transition-colors flex-shrink-0 mt-0.5">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Customer & address (read-only from job) */}
        {(form.customerName || form.addressLine1) && (
          <div className="bg-white/30 dark:bg-white/5 border border-white/30 dark:border-white/12 rounded-xl px-4 py-3 space-y-1">
            {form.customerName && <p className="text-sm font-semibold text-gray-900 dark:text-white">{form.customerName}</p>}
            {form.addressLine1 && <p className="text-xs text-gray-500 dark:text-gray-400">{form.addressLine1}{form.addressCity ? `, ${form.addressCity}` : ''}{form.addressPostcode ? ` ${form.addressPostcode}` : ''}</p>}
          </div>
        )}

        {/* Order items (read-only summary) */}
        {form.items && form.items.length > 0 && (
          <div>
            <SectionTitle>Ordered Items</SectionTitle>
            <div className="mt-2 space-y-1">
              {form.items.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm px-1">
                  <span className="text-gray-700 dark:text-gray-300">{item.quantity > 1 ? `${item.quantity}× ` : ''}{item.productName}</span>
                  {(item.salePrice > 0 || item.supplierCost > 0) && (
                    <span className="text-gray-500 dark:text-gray-400 text-xs">{fmt((item.salePrice + item.supplierCost) * item.quantity)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <SectionTitle>References</SectionTitle>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">EWT Job Ref</label>
            <input type="text" value={form.ewtJobRef} onChange={e => set('ewtJobRef', e.target.value)} placeholder="e.g. EWT-JOB-001" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Supplier Quote Ref</label>
            <input type="text" value={form.supplierQuoteRef} onChange={e => set('supplierQuoteRef', e.target.value)} placeholder="Ref" className={inputCls} />
          </div>
        </div>

        <SectionTitle>Survey</SectionTitle>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Surveyor</label>
            <input type="text" value={form.surveyor} onChange={e => set('surveyor', e.target.value)} placeholder="Name" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Survey Date</label>
            <input type="date" value={form.surveyDate || ''} onChange={e => set('surveyDate', e.target.value)} className={inputCls} />
          </div>
        </div>

        <SectionTitle>Installation</SectionTitle>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Install Start</label>
            <input type="date" value={form.installStart || ''} onChange={e => set('installStart', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Install End</label>
            <input type="date" value={form.installEnd || ''} onChange={e => set('installEnd', e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Delivery Date Requested</label>
          <input type="date" value={form.deliveryDateRequested || ''} onChange={e => set('deliveryDateRequested', e.target.value)} className={inputCls} />
        </div>

        <SectionTitle>Progress</SectionTitle>

        <div className="space-y-2.5">
          <StatusBadge label="Survey Booked"       checked={form.surveyBooked}       onChange={v => set('surveyBooked', v)} />
          <StatusBadge label="Contacted Customer"  checked={form.contactedCustomer}  onChange={v => set('contactedCustomer', v)} />
          <StatusBadge label="Survey to Supplier"  checked={form.surveyToSupplier}   onChange={v => set('surveyToSupplier', v)} />
          <StatusBadge label="Checked & Signed Off" checked={form.checkedSignedOff}   onChange={v => set('checkedSignedOff', v)} />
          <StatusBadge label="Customer Notified"   checked={form.customerNotified}   onChange={v => set('customerNotified', v)} />
          <StatusBadge label="Deposit Received"    checked={form.depositReceived}    onChange={v => set('depositReceived', v)} />
        </div>

        <SectionTitle>Financials</SectionTitle>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Materials (£)</label>
              <input type="number" value={form.materialsCost} onChange={e => set('materialsCost', parseFloat(e.target.value) || 0)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Installation (£)</label>
              <input type="number" value={form.installationCharge} onChange={e => set('installationCharge', parseFloat(e.target.value) || 0)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Supplier (£)</label>
              <input type="number" value={form.supplierCharge} onChange={e => set('supplierCharge', parseFloat(e.target.value) || 0)} className={inputCls} />
            </div>
          </div>

          <div className="bg-white/40 dark:bg-white/7 border border-white/35 dark:border-white/10 rounded-xl px-4 py-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Total</div>
              <div className="font-bold text-gray-900 dark:text-white text-sm">{fmt(liveTotal)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">VAT (20%)</div>
              <div className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{fmt(liveVat)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Nett</div>
              <div className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{fmt(liveNett)}</div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 dark:border-white/8" />

        <CommentsSection parentType="order" parentId={form.id} />

        <div className="border-t border-white/20 dark:border-white/8" />

        {/* Actions */}
        <div className="flex gap-2 pb-1">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md shadow-green-700/20">
            {saving ? 'Saving…' : isNew ? 'Create Order' : 'Save Changes'}
          </button>
          {!isNew && onDelete && (
            <button onClick={handleDelete} disabled={saving}
              className="px-4 py-3 rounded-xl text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-colors">
              Delete
            </button>
          )}
        </div>
      </div>
    </>
  )

  if (isDesktop) {
    return (
      <div className={`flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-out ${open ? 'w-96' : 'w-0'}`}>
        <div className="w-96 h-full border-l border-white/25 dark:border-white/10 bg-white/55 dark:bg-white/10 backdrop-blur-2xl flex flex-col">
          {content}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose} />
      <div className={`fixed bottom-0 left-0 right-0 bg-white/70 dark:bg-gray-900/95 backdrop-blur-2xl rounded-t-2xl z-50 flex flex-col max-h-[88vh] transition-all duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="w-9 h-1 bg-white/50 dark:bg-white/20 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
        {content}
      </div>
    </>
  )
}
