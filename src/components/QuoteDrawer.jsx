import { useState, useEffect, useCallback } from 'react'

const RESPONSE_OPTIONS = ['Waiting', 'Go Ahead', 'No Go']

const RESPONSE_STYLES = {
  'Waiting':  'bg-amber-400/20 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  'Go Ahead': 'bg-green-400/20 text-green-700 dark:bg-green-400/15 dark:text-green-300',
  'No Go':    'bg-red-400/20 text-red-700 dark:bg-red-400/15 dark:text-red-300',
}

const inputCls = "w-full px-3 py-2.5 bg-white/50 dark:bg-white/8 border border-white/50 dark:border-white/15 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-green-500/60 dark:focus:border-green-500/50 transition-colors"

function fmt(val) {
  if (!val && val !== 0) return '—'
  return `£${Number(val).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function newOption(index) {
  return {
    id:                String(Date.now()) + index,
    label:             `Option ${index + 1}`,
    products:          '',
    ewtValue:          0,
    supplierValue:     0,
    total:             0,
    supplierName:      '',
    supplierReference: '',
  }
}

const BLANK_QUOTE = {
  dealId: '', ewtQuoteRef: '', customerName: '', address: '',
  contactNumber: '', email: '', origin: '', options: [],
  sentToSupplier: false, quoteSentToCustomer: false, response: 'Waiting',
}

export default function QuoteDrawer({ quote, onClose, onSave, onDelete, isDesktop }) {
  const isNew = !quote?.id
  const [form, setForm]         = useState(quote || BLANK_QUOTE)
  const [saving, setSaving]     = useState(false)
  const [open, setOpen]         = useState(false)
  const [expanded, setExpanded] = useState({})   // option id → bool

  useEffect(() => {
    const base = quote || BLANK_QUOTE
    setForm(base)
    // auto-expand all options when opening
    const exp = {}
    ;(base.options || []).forEach(o => { exp[o.id] = true })
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

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  /* ── Options helpers ── */
  const addOption = () => {
    const next = newOption(form.options.length)
    setForm(prev => ({ ...prev, options: [...prev.options, next] }))
    setExpanded(prev => ({ ...prev, [next.id]: true }))
  }

  const removeOption = (id) => {
    setForm(prev => ({ ...prev, options: prev.options.filter(o => o.id !== id) }))
    setExpanded(prev => { const e = { ...prev }; delete e[id]; return e })
  }

  const setOption = (id, field, value) => {
    setForm(prev => ({
      ...prev,
      options: prev.options.map(o => {
        if (o.id !== id) return o
        const updated = { ...o, [field]: value }
        updated.total = (parseFloat(updated.ewtValue) || 0) + (parseFloat(updated.supplierValue) || 0)
        return updated
      }),
    }))
  }

  const toggleExpanded = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const grandTotal = (form.options || []).reduce((s, o) => s + (o.total || 0), 0)

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
            {isNew ? 'Fill in the details below' : form.customerName}
          </p>
        </div>
        <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 flex items-center justify-center text-gray-700 dark:text-gray-300 transition-colors flex-shrink-0 mt-0.5">✕</button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Response */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Response</label>
          <div className="flex gap-2">
            {RESPONSE_OPTIONS.map(opt => (
              <button key={opt} onClick={() => set('response', opt)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all
                  ${form.response === opt
                    ? `${RESPONSE_STYLES[opt]} border-current shadow-sm`
                    : 'bg-white/20 dark:bg-white/5 border-white/30 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-white/50'
                  }`}>
                {opt}
              </button>
            ))}
          </div>
          {form.response === 'Go Ahead' && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1.5">✓ Saving will automatically create an Order record</p>
          )}
        </div>

        <div className="border-t border-white/20 dark:border-white/8" />

        {/* Customer details */}
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

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Customer Name</label>
          <input type="text" value={form.customerName} onChange={e => set('customerName', e.target.value)} placeholder="Full name" className={inputCls} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Address</label>
          <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2} placeholder="Installation address" className={inputCls + ' resize-none'} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Contact Number</label>
            <input type="text" value={form.contactNumber} onChange={e => set('contactNumber', e.target.value)} placeholder="Phone" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="Email address" className={inputCls} />
          </div>
        </div>

        <div className="border-t border-white/20 dark:border-white/8" />

        {/* ── Options ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Quote Options</h3>
              {form.options.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Grand total: <span className="font-semibold text-gray-900 dark:text-white">{fmt(grandTotal)}</span>
                </p>
              )}
            </div>
            <button onClick={addOption}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-green-700/25">
              <span className="text-base leading-none">+</span> New Option
            </button>
          </div>

          {form.options.length === 0 && (
            <div className="text-center py-6 rounded-xl border border-dashed border-white/30 dark:border-white/15 text-gray-400 dark:text-gray-500 text-xs">
              No options yet — click <strong>+ New Option</strong> to add one
            </div>
          )}

          <div className="space-y-2">
            {form.options.map((opt, idx) => (
              <div key={opt.id} className="bg-white/30 dark:bg-white/5 border border-white/40 dark:border-white/12 rounded-xl overflow-hidden">

                {/* Option header */}
                <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-white/20 dark:hover:bg-white/5 transition-colors"
                  onClick={() => toggleExpanded(opt.id)}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{opt.label || `Option ${idx + 1}`}</span>
                    {opt.total > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-white/40 dark:bg-white/8 px-2 py-0.5 rounded-full font-medium">{fmt(opt.total)}</span>
                    )}
                    {opt.products && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[120px]">{opt.products}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); removeOption(opt.id) }}
                      className="w-6 h-6 rounded-full bg-red-500/10 hover:bg-red-500/25 flex items-center justify-center text-red-500 text-xs transition-colors">
                      ✕
                    </button>
                    <span className="text-gray-400 text-xs">{expanded[opt.id] ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Option fields */}
                {expanded[opt.id] && (
                  <div className="px-4 pb-4 pt-1 space-y-3 border-t border-white/20 dark:border-white/8">

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Products</label>
                      <textarea
                        value={opt.products}
                        onChange={e => setOption(opt.id, 'products', e.target.value)}
                        rows={2}
                        placeholder="e.g. 3x uPVC casement windows, 1x composite door"
                        className={inputCls + ' resize-none'}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">EWT Value (£)</label>
                        <input type="number" value={opt.ewtValue}
                          onChange={e => setOption(opt.id, 'ewtValue', parseFloat(e.target.value) || 0)}
                          className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Supplier Value (£)</label>
                        <input type="number" value={opt.supplierValue}
                          onChange={e => setOption(opt.id, 'supplierValue', parseFloat(e.target.value) || 0)}
                          className={inputCls} />
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/30 dark:bg-white/5 border border-white/30 dark:border-white/12 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Total: <span className="text-gray-900 dark:text-white">{fmt(opt.total)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Supplier Name</label>
                        <input type="text" value={opt.supplierName}
                          onChange={e => setOption(opt.id, 'supplierName', e.target.value)}
                          placeholder="Supplier" className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Supplier Reference</label>
                        <input type="text" value={opt.supplierReference}
                          onChange={e => setOption(opt.id, 'supplierReference', e.target.value)}
                          placeholder="Ref no." className={inputCls} />
                      </div>
                    </div>

                  </div>
                )}
              </div>
            ))}
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
            <input type="checkbox" checked={form.quoteSentToCustomer} onChange={e => set('quoteSentToCustomer', e.target.checked)} className="w-4 h-4 accent-green-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Quote Sent to Customer</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
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
