import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { STATUS_ORDER, STATUS_LABELS, STATUS_COLORS } from '../hooks/useJobs'
import CommentsSection from './CommentsSection'

const STATUS_BADGE = {
  enquiry:   'bg-purple-400/20 text-purple-700 dark:text-purple-300',
  quoted:    'bg-amber-400/20 text-amber-700 dark:text-amber-300',
  accepted:  'bg-emerald-400/20 text-emerald-700 dark:text-emerald-300',
  surveyed:  'bg-sky-400/20 text-sky-700 dark:text-sky-300',
  installed: 'bg-teal-400/20 text-teal-700 dark:text-teal-300',
  complete:  'bg-green-400/20 text-green-700 dark:text-green-300',
  lost:      'bg-gray-400/20 text-gray-600 dark:text-gray-300',
}

const QUOTE_STATUS_BADGE = {
  draft:    'bg-gray-400/20 text-gray-500 dark:text-gray-400',
  sent:     'bg-amber-400/20 text-amber-700 dark:text-amber-300',
  accepted: 'bg-green-400/20 text-green-700 dark:text-green-400',
  declined: 'bg-red-400/20 text-red-600 dark:text-red-400',
}

const QUOTE_STATUS_LABEL = { draft: 'Draft', sent: 'Sent', accepted: 'Accepted', declined: 'Declined' }

const inputCls = "w-full px-3 py-2.5 bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-lg text-sm text-ink outline-none focus:border-green-500/60 focus:ring-1 focus:ring-green-500/20 transition-colors"

const BLANK = { title: '', status: 'enquiry', customerId: '', customerName: '', addressId: '', addressLine1: '', quoteVisit: '' }
const BLANK_CUSTOMER = { fullName: '', phone: '', email: '' }

function fmtGBP(val) {
  if (!val && val !== 0) return ''
  return `£${Number(val).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default function JobDrawer({ job, onClose, onSave, onDelete, isDesktop, customers = [] }) {
  const isNew    = !job?.id
  const navigate = useNavigate()
  const [form, setForm]       = useState(job || BLANK)
  const [saving, setSaving]   = useState(false)
  const [open, setOpen]       = useState(false)
  const [addressText, setAddressText] = useState(job?.addressLine1 || '')
  const [newCust, setNewCust] = useState(null)
  const [newCustError, setNewCustError] = useState('')
  const [custEdit, setCustEdit] = useState(null)
  const origCust = useRef(null)
  const [linkedQuotes, setLinkedQuotes] = useState([])
  const [linkedOrders, setLinkedOrders] = useState([])

  useEffect(() => {
    const base = job || BLANK
    setForm(base)
    setAddressText(base.addressLine1 || '')
  }, [job])

  useEffect(() => {
    if (!form.id) { setLinkedQuotes([]); setLinkedOrders([]); return }
    Promise.all([
      supabase.from('quotes').select('id, ewt_quote_ref, status, ewt_value').eq('job_id', form.id).order('created_at'),
      supabase.from('orders').select('id, ewt_job_ref, total').eq('job_id', form.id).order('created_at'),
    ]).then(([q, o]) => {
      setLinkedQuotes(q.data || [])
      setLinkedOrders(o.data || [])
    })
  }, [form.id])

  useEffect(() => {
    if (form.customerId && newCust === null) {
      const c = customers.find(x => x.id === form.customerId)
      if (c) {
        const details = { fullName: c.fullName || '', phone: c.phone || '', email: c.email || '', notes: c.notes || '' }
        setCustEdit(details)
        origCust.current = details
      }
    } else if (!form.customerId) {
      setCustEdit(null)
      origCust.current = null
    }
  }, [form.customerId])

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    setTimeout(onClose, 300)
  }, [onClose])

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  const handleSave = async () => {
    setSaving(true)
    try {
      let customerId   = form.customerId
      let customerName = form.customerName
      let addressId    = form.addressId

      if (newCust !== null) {
        if (!newCust.fullName.trim()) {
          setNewCustError('Full name is required')
          setSaving(false)
          return
        }
        setNewCustError('')
        const { data: created } = await supabase
          .from('customers')
          .insert({ full_name: newCust.fullName.trim(), phone: newCust.phone.trim() || null, email: newCust.email.trim() || null })
          .select()
          .single()
        customerId   = created.id
        customerName = created.full_name
      }

      if (customerId && addressText.trim()) {
        if (addressText.trim() !== form.addressLine1 || !addressId) {
          const { data: existing } = await supabase
            .from('addresses')
            .select('id')
            .eq('customer_id', customerId)
            .ilike('line1', addressText.trim())
            .maybeSingle()

          if (existing) {
            addressId = existing.id
          } else {
            const { data: created } = await supabase
              .from('addresses')
              .insert({ customer_id: customerId, line1: addressText.trim() })
              .select()
              .single()
            addressId = created?.id || addressId
          }
        }
      }

      if (customerId && custEdit && origCust.current) {
        const changed =
          custEdit.fullName !== origCust.current.fullName ||
          custEdit.phone    !== origCust.current.phone    ||
          custEdit.email    !== origCust.current.email    ||
          custEdit.notes    !== origCust.current.notes
        if (changed) {
          await supabase.from('customers').update({
            full_name: custEdit.fullName || null,
            phone:     custEdit.phone    || null,
            email:     custEdit.email    || null,
            notes:     custEdit.notes    || null,
          }).eq('id', customerId)
          customerName = custEdit.fullName || customerName
        }
      }

      await onSave({ ...form, customerId, customerName, addressId, addressLine1: addressText.trim() })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete || !form.id) return
    if (!window.confirm('Delete this job?')) return
    setSaving(true)
    try { await onDelete(form.id); onClose() } finally { setSaving(false) }
  }

  const color = STATUS_COLORS[form.status] || '#6b7280'

  const content = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-edge flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <div>
            <h2 className="text-lg font-bold text-ink leading-tight">
              {isNew ? 'New Job' : (form.title || 'Untitled Job')}
            </h2>
            {form.customerName && (
              <p className="text-sm text-ink-muted">{form.customerName}</p>
            )}
          </div>
        </div>
        <button onClick={handleClose} className="w-8 h-8 rounded-full bg-surface-close hover:bg-surface-close-hover flex items-center justify-center text-ink-soft transition-colors flex-shrink-0 mt-0.5">✕</button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Status badge */}
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[form.status] || ''}`}>
          {STATUS_LABELS[form.status] || form.status}
        </span>

        <div>
          <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
            {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">Job Title</label>
          <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Front of house windows" className={inputCls} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide">Customer</label>
            <button
              type="button"
              onClick={() => { setNewCust(prev => prev === null ? BLANK_CUSTOMER : null); setNewCustError('') }}
              className="text-xs font-semibold text-green-700 dark:text-green-400 hover:underline"
            >
              {newCust !== null ? '← Select existing' : '+ New customer'}
            </button>
          </div>

          {newCust === null && custEdit !== null && (
            <div className="mt-2 space-y-2 p-3 rounded-lg bg-white/60 dark:bg-white/8 border border-gray-200 dark:border-white/15">
              <div>
                <label className="block text-[10px] font-semibold text-ink-faint uppercase tracking-wide mb-1">Full Name</label>
                <input
                  type="text"
                  value={custEdit.fullName}
                  onChange={e => setCustEdit(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Full name"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-ink-faint uppercase tracking-wide mb-1">Phone</label>
                  <input
                    type="tel"
                    value={custEdit.phone}
                    onChange={e => setCustEdit(p => ({ ...p, phone: e.target.value }))}
                    placeholder="07700 000000"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-ink-faint uppercase tracking-wide mb-1">Email</label>
                  <input
                    type="email"
                    value={custEdit.email}
                    onChange={e => setCustEdit(p => ({ ...p, email: e.target.value }))}
                    placeholder="name@example.com"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-ink-faint uppercase tracking-wide mb-1">Notes</label>
                <textarea
                  value={custEdit.notes}
                  onChange={e => setCustEdit(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Customer notes…"
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          )}

          {newCust !== null ? (
            <div className="space-y-2 p-3 rounded-lg bg-white/60 dark:bg-white/8 border border-gray-200 dark:border-white/15">
              <div>
                <input
                  type="text"
                  placeholder="Full name *"
                  value={newCust.fullName}
                  onChange={e => { setNewCust(p => ({ ...p, fullName: e.target.value })); setNewCustError('') }}
                  className={`${inputCls} ${newCustError ? 'border-red-400/60' : ''}`}
                  autoFocus
                />
                {newCustError && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{newCustError}</p>}
              </div>
              <input
                type="tel"
                placeholder="Phone"
                value={newCust.phone}
                onChange={e => setNewCust(p => ({ ...p, phone: e.target.value }))}
                className={inputCls}
              />
              <input
                type="email"
                placeholder="Email"
                value={newCust.email}
                onChange={e => setNewCust(p => ({ ...p, email: e.target.value }))}
                className={inputCls}
              />
            </div>
          ) : (
            <select
              value={form.customerId || ''}
              onChange={e => {
                const id = e.target.value
                const c  = customers.find(x => x.id === id)
                set('customerId', id)
                set('customerName', c ? c.fullName : '')
              }}
              className={inputCls}
            >
              <option value="">— None —</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.fullName}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">Address</label>
          <input
            type="text"
            value={addressText}
            onChange={e => setAddressText(e.target.value)}
            placeholder="Installation address"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">Quote Visit</label>
          <input type="date" value={form.quoteVisit || ''} onChange={e => set('quoteVisit', e.target.value)} className={inputCls} />
        </div>

        {!isNew && (
          <>
            <div className="border-t border-edge-dim" />

            {/* Linked quotes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-ink-muted uppercase tracking-wide">Quotes</span>
                <button
                  type="button"
                  onClick={() => navigate('/quotes', { state: { newQuoteForJobId: form.id } })}
                  className="text-xs font-semibold text-green-700 dark:text-green-400 hover:underline"
                >
                  + New Quote
                </button>
              </div>
              {linkedQuotes.length === 0 ? (
                <p className="text-xs text-ink-faint italic">No quotes yet</p>
              ) : (
                <div className="space-y-1.5">
                  {linkedQuotes.map(q => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => navigate('/quotes', { state: { openQuoteId: q.id } })}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-surface-chip hover:bg-surface-chip-hover border border-edge-chip transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${QUOTE_STATUS_BADGE[q.status] || ''}`}>
                          {QUOTE_STATUS_LABEL[q.status] || q.status}
                        </span>
                        <span className="text-xs text-ink-soft truncate">{q.ewt_quote_ref || 'No ref'}</span>
                      </div>
                      <span className="text-xs font-semibold text-ink-soft flex-shrink-0 ml-2">{fmtGBP(q.ewt_value)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Linked orders */}
            {linkedOrders.length > 0 && (
              <div>
                <span className="text-xs font-bold text-ink-muted uppercase tracking-wide block mb-2">Orders</span>
                <div className="space-y-1.5">
                  {linkedOrders.map(o => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => navigate('/orders', { state: { openOrderId: o.id } })}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-surface-chip hover:bg-surface-chip-hover border border-edge-chip transition-colors text-left"
                    >
                      <span className="text-xs text-ink-soft truncate">{o.ewt_job_ref || 'No ref'}</span>
                      <span className="text-xs font-semibold text-ink-soft flex-shrink-0 ml-2">{fmtGBP(o.total)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="border-t border-edge-dim" />

        <CommentsSection parentType="job" parentId={form.id} />

        <div className="border-t border-edge-dim" />

        {/* Actions */}
        <div className="flex gap-2 pb-1">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md shadow-green-700/20">
            {saving ? 'Saving…' : isNew ? 'Create Job' : 'Save Changes'}
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
        <div className="w-96 h-full border-l border-edge bg-surface-drawer backdrop-blur-2xl flex flex-col">
          {content}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose} />
      <div className={`fixed bottom-0 left-0 right-0 bg-surface-drawer-mob backdrop-blur-2xl rounded-t-2xl z-50 flex flex-col max-h-[88vh] transition-all duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="w-9 h-1 bg-drag-handle rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
        {content}
      </div>
    </>
  )
}
