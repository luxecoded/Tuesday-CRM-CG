import { useState, useEffect } from 'react'

const COMPANIES = ['Isis Windows', 'Paradise Windows', 'Elite Windows']

const COMPANY_CLASSES = {
  'Isis Windows':     'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  'Paradise Windows': 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  'Elite Windows':    'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
}

const STAGE_COLORS = {
  'Quote': '#a855f7', 'Awaiting Client': '#f59e0b', 'Survey': '#38bdf8',
  'Follow Up': '#ec4899', 'Signed': '#6366f1', 'To Order': '#f97316',
  'Installation TBC': '#84cc16', 'Installation Booked': '#10b981',
  'Installed Pending Certification': '#14b8a6', 'Awaiting Payment': '#f59e0b',
  'Completed': '#059669', 'Service Call': '#6b7280',
}

const inputCls = "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors"

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

  useEffect(() => { setForm(contact); setConfirmDelete(false) }, [contact])

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  const linkedDeals = deals.filter(d =>
    d.contactId && contact.id && String(d.contactId) === String(contact.id)
  )

  const handleSave = async () => {
    if (!form.firstName?.trim() && !form.lastName?.trim()) return
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try { await onDelete(form.id) } finally { setDeleting(false) }
  }

  const content = (
    <>
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isNew ? 'New Contact' : `${form.firstName} ${form.lastName}`.trim() || 'Unnamed Contact'}
          </h2>
          {!isNew && form.company && (
            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-md ${COMPANY_CLASSES[form.company] || 'bg-gray-100 text-gray-500'}`}>
              {form.company}
            </span>
          )}
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors flex-shrink-0 mt-0.5">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">First Name</label>
            <input type="text" value={form.firstName || ''} onChange={e => set('firstName', e.target.value)} placeholder="First" className={inputCls} autoFocus={isNew} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Last Name</label>
            <input type="text" value={form.lastName || ''} onChange={e => set('lastName', e.target.value)} placeholder="Last" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
            <input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="email@example.com" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Phone</label>
            <input type="tel" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+44 ..." className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Company</label>
            <select value={form.company || ''} onChange={e => set('company', e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {COMPANIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Role</label>
            <input type="text" value={form.role || ''} onChange={e => set('role', e.target.value)} placeholder="e.g. Sales Lead" className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
          <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Optional notes…" className={inputCls + ' resize-none'} />
        </div>

        <button onClick={handleSave} disabled={saving || (!form.firstName?.trim() && !form.lastName?.trim())}
          className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
          {saving ? 'Saving…' : isNew ? 'Add Contact' : 'Save changes'}
        </button>

        {!isNew && linkedDeals.length > 0 && (
          <>
            <div className="border-t border-gray-100 dark:border-gray-700" />
            <div>
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                Linked Deals ({linkedDeals.length})
              </label>
              <div className="space-y-2">
                {linkedDeals.map(deal => (
                  <div key={deal.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2.5">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{deal.deal || '—'}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: STAGE_COLORS[deal.stage] || '#6b7280' }} />
                        <span className="text-xs text-gray-400 dark:text-gray-500">{deal.stage}</span>
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
            <div className="border-t border-gray-100 dark:border-gray-700" />
            <button onClick={handleDelete} disabled={deleting}
              className={`w-full font-semibold py-2.5 rounded-xl text-sm transition-colors border
                ${confirmDelete
                  ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                  : 'bg-transparent text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20'}`}>
              {deleting ? 'Deleting…' : confirmDelete ? 'Confirm delete' : 'Delete contact'}
            </button>
            {confirmDelete && (
              <button onClick={() => setConfirmDelete(false)} className="w-full text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
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
      <div className="w-96 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full flex-shrink-0 transition-colors">
        {content}
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl z-50 flex flex-col max-h-[88vh] transition-colors">
        <div className="w-9 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
        {content}
      </div>
    </>
  )
}
