import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { STATUS_ORDER, STATUS_LABELS, STATUS_COLORS } from '../hooks/useJobs'
import CommentsSection from './CommentsSection'

const STATUS_BADGE = {
  enquiry:   'bg-purple-400/20 text-purple-700 dark:bg-purple-400/15 dark:text-purple-300',
  quoted:    'bg-amber-400/20 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  accepted:  'bg-emerald-400/20 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
  surveyed:  'bg-sky-400/20 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300',
  installed: 'bg-teal-400/20 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300',
  complete:  'bg-green-400/20 text-green-700 dark:bg-green-400/15 dark:text-green-300',
  lost:      'bg-gray-400/20 text-gray-600 dark:bg-gray-400/15 dark:text-gray-300',
}

const inputCls = "w-full px-3 py-2.5 bg-white/50 dark:bg-white/8 border border-white/50 dark:border-white/15 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-green-500/60 dark:focus:border-green-500/50 transition-colors"

const BLANK = { title: '', status: 'enquiry', customerId: '', customerName: '', addressId: '', addressLine1: '', quoteVisit: '' }

export default function JobDrawer({ job, onClose, onSave, onDelete, isDesktop, customers = [] }) {
  const isNew = !job?.id
  const [form, setForm]   = useState(job || BLANK)
  const [saving, setSaving] = useState(false)
  const [open, setOpen]   = useState(false)
  const [addressText, setAddressText] = useState(job?.addressLine1 || '')

  useEffect(() => {
    const base = job || BLANK
    setForm(base)
    setAddressText(base.addressLine1 || '')
  }, [job])

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
      let addressId = form.addressId

      // Resolve address: find or create if text changed
      if (form.customerId && addressText.trim()) {
        if (addressText.trim() !== form.addressLine1) {
          const { data: existing } = await supabase
            .from('addresses')
            .select('id')
            .eq('customer_id', form.customerId)
            .ilike('line1', addressText.trim())
            .maybeSingle()

          if (existing) {
            addressId = existing.id
          } else {
            const { data: created } = await supabase
              .from('addresses')
              .insert({ customer_id: form.customerId, line1: addressText.trim() })
              .select()
              .single()
            addressId = created?.id || addressId
          }
        }
      }

      await onSave({ ...form, addressId, addressLine1: addressText.trim() })
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
      <div className="flex items-start justify-between px-5 py-4 border-b border-white/25 dark:border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {isNew ? 'New Job' : (form.title || 'Untitled Job')}
            </h2>
            {form.customerName && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{form.customerName}</p>
            )}
          </div>
        </div>
        <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 flex items-center justify-center text-gray-700 dark:text-gray-300 transition-colors flex-shrink-0 mt-0.5">✕</button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Status badge row */}
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[form.status] || ''}`}>
          {STATUS_LABELS[form.status] || form.status}
        </span>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
            {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Job Title</label>
          <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Front of house windows" className={inputCls} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Customer</label>
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
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Address</label>
          <input
            type="text"
            value={addressText}
            onChange={e => setAddressText(e.target.value)}
            placeholder="Installation address"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Quote Visit</label>
          <input type="date" value={form.quoteVisit || ''} onChange={e => set('quoteVisit', e.target.value)} className={inputCls} />
        </div>

        <div className="border-t border-white/20 dark:border-white/8" />

        <CommentsSection parentType="job" parentId={form.id} />

        <div className="border-t border-white/20 dark:border-white/8" />

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
