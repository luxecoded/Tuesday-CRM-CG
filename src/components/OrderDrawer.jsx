import { useState, useEffect, useCallback } from 'react'

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

const BLANK_ORDER = {
  dealId: '', ewtJobRef: '', ewtQuoteRef: '', supplierQuoteRef: '',
  customerName: '', installAddress: '', correspondentAddress: '',
  contactNumber: '', emailAddress: '',
  windowsCount: 0, windowsType: '', doorsCount: 0, doorsType: '',
  surveyBooked: false, surveyDate: '', contactedCustomer: false,
  surveyToSupplier: false, supplierName: '', supplierReference: '',
  checkedSignedOff: false, deliveryDateRequested: '', installDate: '',
  customerNotified: false, installationCharge: 0, supplierCharge: 0,
}

export default function OrderDrawer({ order, onClose, onSave, onDelete, isDesktop }) {
  const isNew = !order?.id
  const [form, setForm]     = useState(order || BLANK_ORDER)
  const [saving, setSaving] = useState(false)
  const [open, setOpen]     = useState(false)

  useEffect(() => { setForm(order || BLANK_ORDER) }, [order])

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    setTimeout(onClose, 300)
  }, [onClose])

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const liveTotal = (form.installationCharge || 0) + (form.supplierCharge || 0)
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
            {isNew ? 'New Order' : (form.ewtJobRef || form.customerName || 'Order')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isNew ? 'Fill in the details below' : form.customerName}
          </p>
        </div>
        <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 flex items-center justify-center text-gray-700 dark:text-gray-300 transition-colors flex-shrink-0 mt-0.5">✕</button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* References */}
        <SectionTitle>References</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">EWT Job Ref</label>
            <input type="text" value={form.ewtJobRef} onChange={e => set('ewtJobRef', e.target.value)} placeholder="e.g. JOB-001" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">EWT Quote Ref</label>
            <input type="text" value={form.ewtQuoteRef} onChange={e => set('ewtQuoteRef', e.target.value)} placeholder="e.g. EWT-001" className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Supplier Quote Ref</label>
          <input type="text" value={form.supplierQuoteRef} onChange={e => set('supplierQuoteRef', e.target.value)} placeholder="Supplier's reference" className={inputCls} />
        </div>

        {/* Customer */}
        <SectionTitle>Customer</SectionTitle>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Customer Name</label>
          <input type="text" value={form.customerName} onChange={e => set('customerName', e.target.value)} placeholder="Full name" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Contact Number</label>
            <input type="text" value={form.contactNumber} onChange={e => set('contactNumber', e.target.value)} placeholder="Phone" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Email Address</label>
            <input type="email" value={form.emailAddress} onChange={e => set('emailAddress', e.target.value)} placeholder="Email" className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Install Address</label>
          <textarea value={form.installAddress} onChange={e => set('installAddress', e.target.value)} rows={2} placeholder="Installation address" className={inputCls + ' resize-none'} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Correspondent Address</label>
          <textarea value={form.correspondentAddress} onChange={e => set('correspondentAddress', e.target.value)} rows={2} placeholder="If different from install address" className={inputCls + ' resize-none'} />
        </div>

        {/* Products */}
        <SectionTitle>Products</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">No. of Windows</label>
            <input type="number" min="0" value={form.windowsCount} onChange={e => set('windowsCount', parseInt(e.target.value) || 0)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Window Type</label>
            <input type="text" value={form.windowsType} onChange={e => set('windowsType', e.target.value)} placeholder="e.g. uPVC Casement" className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">No. of Doors</label>
            <input type="number" min="0" value={form.doorsCount} onChange={e => set('doorsCount', parseInt(e.target.value) || 0)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Door Type</label>
            <input type="text" value={form.doorsType} onChange={e => set('doorsType', e.target.value)} placeholder="e.g. Composite" className={inputCls} />
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/30 dark:bg-white/5 border border-white/30 dark:border-white/12 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300">
          Total units: <span className="text-gray-900 dark:text-white">{(form.windowsCount || 0) + (form.doorsCount || 0)}</span>
        </div>

        {/* Supplier */}
        <SectionTitle>Supplier</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Supplier Name</label>
            <input type="text" value={form.supplierName} onChange={e => set('supplierName', e.target.value)} placeholder="Supplier" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Supplier Reference</label>
            <input type="text" value={form.supplierReference} onChange={e => set('supplierReference', e.target.value)} placeholder="Ref no." className={inputCls} />
          </div>
        </div>

        {/* Scheduling */}
        <SectionTitle>Scheduling</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Survey Date</label>
            <input type="date" value={form.surveyDate} onChange={e => set('surveyDate', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Delivery Date Requested</label>
            <input type="date" value={form.deliveryDateRequested} onChange={e => set('deliveryDateRequested', e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Install Date</label>
          <input type="date" value={form.installDate} onChange={e => set('installDate', e.target.value)} className={inputCls} />
        </div>

        {/* Status flags */}
        <SectionTitle>Status</SectionTitle>
        <div className="space-y-3">
          <StatusBadge label="Survey Booked"        checked={form.surveyBooked}        onChange={v => set('surveyBooked', v)} />
          <StatusBadge label="Contacted Customer"   checked={form.contactedCustomer}   onChange={v => set('contactedCustomer', v)} />
          <StatusBadge label="Survey Sent to Supplier" checked={form.surveyToSupplier} onChange={v => set('surveyToSupplier', v)} />
          <StatusBadge label="Customer Notified"    checked={form.customerNotified}    onChange={v => set('customerNotified', v)} />
          <StatusBadge label="Checked & Signed Off" checked={form.checkedSignedOff}   onChange={v => set('checkedSignedOff', v)} />
        </div>

        {/* Financials */}
        <SectionTitle>Financials</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Installation Charge (£)</label>
            <input type="number" value={form.installationCharge} onChange={e => set('installationCharge', parseFloat(e.target.value) || 0)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Supplier Charge (£)</label>
            <input type="number" value={form.supplierCharge} onChange={e => set('supplierCharge', parseFloat(e.target.value) || 0)} className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[['Total', liveTotal], ['VAT (20%)', liveVat], ['Nett', liveNett]].map(([label, val]) => (
            <div key={label} className="bg-white/30 dark:bg-white/5 border border-white/30 dark:border-white/12 rounded-lg px-3 py-2 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">{fmt(val)}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md shadow-green-700/20">
            {saving ? 'Saving…' : isNew ? 'Create Order' : 'Save Changes'}
          </button>
          {!isNew && (
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
