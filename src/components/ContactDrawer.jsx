import { useState, useEffect, useCallback } from 'react'

const COMPANIES = ['Isis Windows', 'Paradise Windows', 'Elite Windows']

const COMPANY_CLASSES = {
  'Isis Windows':     'bg-blue-400/20 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300',
  'Paradise Windows': 'bg-amber-400/20 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  'Elite Windows':    'bg-emerald-400/20 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
}

const STAGE_COLORS = {
  'Quote': '#a855f7', 'Awaiting Client': '#f59e0b', 'Survey': '#38bdf8',
  'Follow Up': '#ec4899', 'Signed': '#6366f1', 'To Order': '#f97316',
  'Installation TBC': '#84cc16', 'Installation Booked': '#10b981',
  'Installed Pending Certification': '#14b8a6', 'Awaiting Payment': '#f59e0b',
  'Completed': '#059669', 'Service Call': '#6b7280',
}

const inputCls = "w-full px-3 py-2.5 bg-white/50 dark:bg-white/8 border border-white/50 dark:border-white/15 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-green-500/60 dark:focus:border-green-500/50 transition-colors"

function fmt(val) {
  if (!val) return '—'
  return `£${Number(val).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default function ContactDrawer({ contact, onClose, onSave, onDelete, isDesktop, deals = [] }) {
  const isNew = !contact.id
  const [form, setForm] = useState(contact)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => { setForm(contact); setConfirmDelete(false) }, [contact])

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    setTimeout(onClose, 300)
  }, [onClose])

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  const linkedDeals = deals.filter(d =>
    contact.name && d.contact && d.contact === contact.name
  )

  const handleSave = async () => {
    if (!form.name?.trim()) return
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await onDelete(form.id)
      handleClose()
    } catch {
      alert('Could not delete contact.')
    } finally {
      setDeleting(false)
    }
  }

  const content = (
    <>
      <div className="flex items-start justify-between px-5 py-4 border-b border-white/25 dark:border-white/10 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isNew ? 'New Contact' : form.name || 'Unnamed Contact'}
          </h2>
          {!isNew && form.company && (
            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-md ${COMPANY_CLASSES[form.company] || 'bg-white/30 dark:bg-white/10 text-gray-500'}`}>
              {form.company}
            </span>
          )}
        </div>
        <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 flex items-center justify-center text-gray-700 dark:text-gray-300 transition-colors flex-shrink-0 mt-0.5">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Full Name</label>
          <input type="text" value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="Full name" className={inputCls} autoFocus={isNew} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Email</label>
            <input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="email@example.com" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Phone</label>
            <input type="tel" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+44 ..." className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Company</label>
          <select value={form.company || ''} onChange={e => set('company', e.target.value)} className={inputCls}>
            <option value="">— None —</option>
            {COMPANIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Notes</label>
          <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Optional notes…" className={inputCls + ' resize-none'} />
        </div>

        <button onClick={handleSave} disabled={saving || !form.name?.trim()}
          className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md shadow-green-700/20">
          {saving ? 'Saving…' : isNew ? 'Add Contact' : 'Save changes'}
        </button>

        {!isNew && linkedDeals.length > 0 && (
          <>
            <div className="border-t border-white/20 dark:border-white/8" />
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Linked Deals ({linkedDeals.length})
              </label>
              <div className="space-y-2">
                {linkedDeals.map(deal => (
                  <div key={deal.id} className="flex items-center justify-between bg-white/30 dark:bg-white/5 rounded-lg px-3 py-2.5">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{deal.deal || '—'}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: STAGE_COLORS[deal.stage] || '#6b7280' }} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{deal.stage}</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{fmt(deal.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!isNew && onDelete && (
          <>
            <div className="border-t border-white/20 dark:border-white/8" />
            <button onClick={handleDelete} disabled={deleting}
              className={`w-full font-semibold py-2.5 rounded-xl text-sm transition-colors border
                ${confirmDelete
                  ? 'bg-red-500/80 hover:bg-red-500 text-white border-red-500/80'
                  : 'bg-transparent text-red-500 dark:text-red-400 border-red-300/40 dark:border-red-400/30 hover:bg-red-400/10 dark:hover:bg-red-400/15'}`}>
              {deleting ? 'Deleting…' : confirmDelete ? 'Confirm delete' : 'Delete contact'}
            </button>
            {confirmDelete && (
              <button onClick={() => setConfirmDelete(false)} className="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                Cancel
              </button>
            )}
          </>
        )}
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
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      <div className={`fixed bottom-0 left-0 right-0 bg-white/70 dark:bg-gray-900/95 backdrop-blur-2xl rounded-t-2xl z-50 flex flex-col max-h-[88vh] transition-all duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="w-9 h-1 bg-white/50 dark:bg-white/20 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
        {content}
      </div>
    </>
  )
}
