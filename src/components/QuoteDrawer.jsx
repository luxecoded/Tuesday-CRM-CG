import { useState, useEffect, useCallback } from 'react'
import CommentsSection from './CommentsSection'

const STATUS_OPTIONS = ['draft', 'sent', 'accepted', 'declined']
const STATUS_LABELS  = { draft: 'Draft', sent: 'Sent', accepted: 'Accepted', declined: 'Declined' }
const STATUS_STYLES  = {
  draft:    'bg-gray-400/20 text-gray-600 dark:bg-gray-400/15 dark:text-gray-300',
  sent:     'bg-amber-400/20 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  accepted: 'bg-green-400/20 text-green-700 dark:bg-green-400/15 dark:text-green-300',
  declined: 'bg-red-400/20 text-red-700 dark:bg-red-400/15 dark:text-red-300',
}

const inputCls = "w-full px-3 py-2.5 bg-white/50 dark:bg-white/8 border border-white/50 dark:border-white/15 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-green-500/60 dark:focus:border-green-500/50 transition-colors"

function fmt(val) {
  if (!val && val !== 0) return '—'
  return `£${Number(val).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function newItem() {
  return {
    id:           'new-' + Date.now(),
    productName:  '',
    quantity:     1,
    width:        '',
    height:       '',
    frameColour:  '',
    glassType:    '',
    supplierCost: 0,
    salePrice:    0,
  }
}

const BLANK = {
  jobId: '', ewtQuoteRef: '', origin: '', supplierName: '', supplierReference: '',
  status: 'draft', sentToSupplier: false, sentToCustomer: false, items: [],
}

export default function QuoteDrawer({ quote, onClose, onSave, onDelete, isDesktop, jobs = [] }) {
  const isNew = !quote?.id
  const [form, setForm]         = useState(quote || BLANK)
  const [saving, setSaving]     = useState(false)
  const [open, setOpen]         = useState(false)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    const base = quote || BLANK
    setForm(base)
    const exp = {}
    ;(base.items || []).forEach(i => { exp[i.id] = true })
    setExpanded(exp)
  }, [quote])

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    setTimeout(onClose, 300)
  }, [onClose])

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  const addItem = () => {
    const item = newItem()
    setForm(prev => ({ ...prev, items: [...prev.items, item] }))
    setExpanded(prev => ({ ...prev, [item.id]: true }))
  }

  const removeItem = (id) => {
    setForm(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }))
  }

  const setItem = (id, field, val) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, [field]: val } : i),
    }))
  }

  const toggleExpanded = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const ewtTotal      = (form.items || []).reduce((s, i) => s + (i.salePrice    || 0) * (i.quantity || 1), 0)
  const supplierTotal = (form.items || []).reduce((s, i) => s + (i.supplierCost || 0) * (i.quantity || 1), 0)
  const grandTotal    = ewtTotal + supplierTotal

  const linkedJob = jobs.find(j => j.id === form.jobId)

  const handleSave = async () => {
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!onDelete || !form.id) return
    if (!window.confirm('Delete this quote?')) return
    setSaving(true)
    try { await onDelete(form.id); onClose() } finally { setSaving(false) }
  }

  const content = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-white/25 dark:border-white/10 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isNew ? 'New Quote' : (form.ewtQuoteRef || form.customerName || 'Quote')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {linkedJob ? linkedJob.title || linkedJob.customerName : form.customerName || ''}
          </p>
        </div>
        <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 flex items-center justify-center text-gray-700 dark:text-gray-300 transition-colors flex-shrink-0 mt-0.5">✕</button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Status</label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => set('status', s)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all
                  ${form.status === s
                    ? `${STATUS_STYLES[s]} border-current shadow-sm`
                    : 'bg-white/20 dark:bg-white/5 border-white/30 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-white/50'
                  }`}>
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          {form.status === 'accepted' && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1.5">✓ Saving will automatically create an Order record</p>
          )}
        </div>

        <div className="border-t border-white/20 dark:border-white/8" />

        {/* Job link */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Linked Job</label>
          <select value={form.jobId || ''} onChange={e => set('jobId', e.target.value)} className={inputCls}>
            <option value="">— None —</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.title || 'Untitled'}{j.customerName ? ` — ${j.customerName}` : ''}
              </option>
            ))}
          </select>
          {linkedJob?.addressLine1 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">{linkedJob.addressLine1}{linkedJob.addressCity ? `, ${linkedJob.addressCity}` : ''}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">EWT Quote Ref</label>
            <input type="text" value={form.ewtQuoteRef} onChange={e => set('ewtQuoteRef', e.target.value)} placeholder="e.g. EWT-001" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Origin</label>
            <input type="text" value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="e.g. Referral" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Supplier Name</label>
            <input type="text" value={form.supplierName} onChange={e => set('supplierName', e.target.value)} placeholder="Supplier" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Supplier Ref</label>
            <input type="text" value={form.supplierReference} onChange={e => set('supplierReference', e.target.value)} placeholder="Ref no." className={inputCls} />
          </div>
        </div>

        <div className="border-t border-white/20 dark:border-white/8" />

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Line Items</h3>
              {form.items.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Total: <span className="font-semibold text-gray-900 dark:text-white">{fmt(grandTotal)}</span>
                  {supplierTotal > 0 && <span className="ml-2 text-gray-400">(Supplier: {fmt(supplierTotal)})</span>}
                </p>
              )}
            </div>
            <button onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-green-700/25">
              <span className="text-base leading-none">+</span> Add Item
            </button>
          </div>

          {form.items.length === 0 && (
            <div className="text-center py-6 rounded-xl border border-dashed border-white/30 dark:border-white/15 text-gray-400 dark:text-gray-500 text-xs">
              No items yet — click <strong>+ Add Item</strong>
            </div>
          )}

          <div className="space-y-2">
            {form.items.map((item, idx) => {
              const lineTotal = ((item.salePrice || 0) + (item.supplierCost || 0)) * (item.quantity || 1)
              return (
                <div key={item.id} className="bg-white/30 dark:bg-white/5 border border-white/40 dark:border-white/12 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-white/20 dark:hover:bg-white/5 transition-colors"
                    onClick={() => toggleExpanded(item.id)}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{item.productName || `Item ${idx + 1}`}</span>
                      {item.quantity > 1 && <span className="text-xs text-gray-400 flex-shrink-0">×{item.quantity}</span>}
                      {lineTotal > 0 && <span className="text-xs text-gray-500 dark:text-gray-400 bg-white/40 dark:bg-white/8 px-2 py-0.5 rounded-full font-medium flex-shrink-0">{fmt(lineTotal)}</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); removeItem(item.id) }}
                        className="w-6 h-6 rounded-full bg-red-500/10 hover:bg-red-500/25 flex items-center justify-center text-red-500 text-xs transition-colors">✕</button>
                      <span className="text-gray-400 text-xs">{expanded[item.id] ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {expanded[item.id] && (
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-white/20 dark:border-white/8">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Product Name</label>
                        <input type="text" value={item.productName}
                          onChange={e => setItem(item.id, 'productName', e.target.value)}
                          placeholder="e.g. uPVC casement window" className={inputCls} />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Qty</label>
                          <input type="number" min="1" value={item.quantity}
                            onChange={e => setItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">W (mm)</label>
                          <input type="number" value={item.width}
                            onChange={e => setItem(item.id, 'width', e.target.value)}
                            placeholder="—" className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">H (mm)</label>
                          <input type="number" value={item.height}
                            onChange={e => setItem(item.id, 'height', e.target.value)}
                            placeholder="—" className={inputCls} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Frame Colour</label>
                          <input type="text" value={item.frameColour}
                            onChange={e => setItem(item.id, 'frameColour', e.target.value)}
                            placeholder="e.g. White" className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Glass Type</label>
                          <input type="text" value={item.glassType}
                            onChange={e => setItem(item.id, 'glassType', e.target.value)}
                            placeholder="e.g. Double" className={inputCls} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Sale Price (£)</label>
                          <input type="number" value={item.salePrice}
                            onChange={e => setItem(item.id, 'salePrice', parseFloat(e.target.value) || 0)}
                            className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Supplier Cost (£)</label>
                          <input type="number" value={item.supplierCost}
                            onChange={e => setItem(item.id, 'supplierCost', parseFloat(e.target.value) || 0)}
                            className={inputCls} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-t border-white/20 dark:border-white/8" />

        {/* Status checkboxes */}
        <div className="space-y-2.5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.sentToSupplier} onChange={e => set('sentToSupplier', e.target.checked)} className="w-4 h-4 accent-green-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Sent to Supplier</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.sentToCustomer} onChange={e => set('sentToCustomer', e.target.checked)} className="w-4 h-4 accent-green-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Sent to Customer</span>
          </label>
        </div>

        <div className="border-t border-white/20 dark:border-white/8" />

        <CommentsSection parentType="quote" parentId={form.id} />

        <div className="border-t border-white/20 dark:border-white/8" />

        {/* Actions */}
        <div className="flex gap-2 pb-1">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md shadow-green-700/20">
            {saving ? 'Saving…' : isNew ? 'Create Quote' : 'Save Changes'}
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
      <div className={`flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-out ${open ? 'w-[28rem]' : 'w-0'}`}>
        <div className="w-[28rem] h-full border-l border-white/25 dark:border-white/10 bg-white/55 dark:bg-white/10 backdrop-blur-2xl flex flex-col">
          {content}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose} />
      <div className={`fixed bottom-0 left-0 right-0 bg-white/70 dark:bg-gray-900/95 backdrop-blur-2xl rounded-t-2xl z-50 flex flex-col max-h-[90vh] transition-all duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="w-9 h-1 bg-white/50 dark:bg-white/20 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
        {content}
      </div>
    </>
  )
}
