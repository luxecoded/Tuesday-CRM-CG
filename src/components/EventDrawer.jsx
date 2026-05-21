import { useState, useEffect, useCallback } from 'react'

const COMPANIES = [
  { value: 'Isis Windows',     label: 'Isis',     cls: 'bg-blue-400/20 text-blue-700 border-blue-300/40 dark:bg-blue-400/15 dark:text-blue-300 dark:border-blue-400/25' },
  { value: 'Paradise Windows', label: 'Paradise', cls: 'bg-amber-400/20 text-amber-700 border-amber-300/40 dark:bg-amber-400/15 dark:text-amber-300 dark:border-amber-400/25' },
  { value: 'Elite Windows',    label: 'Elite',    cls: 'bg-emerald-400/20 text-emerald-700 border-emerald-300/40 dark:bg-emerald-400/15 dark:text-emerald-300 dark:border-emerald-400/25' },
]

const EVENT_TYPES = [
  { value: 'quote',   label: 'Quote',   color: '#f59e0b' },
  { value: 'survey',  label: 'Survey',  color: '#a855f7' },
  { value: 'install', label: 'Install', color: '#10b981' },
  { value: 'meeting', label: 'Meeting', color: '#6366f1' },
  { value: 'other',   label: 'Other',   color: '#6b7280' },
]

const EVENT_COLORS = [
  '#6366f1', '#a855f7', '#ec4899', '#ef4444',
  '#f97316', '#f59e0b', '#10b981', '#38bdf8', '#6b7280',
]

const inputCls = "w-full px-3 py-2.5 bg-white/50 dark:bg-white/8 border border-white/50 dark:border-white/15 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-green-500/60 dark:focus:border-green-500/50 transition-colors"

export default function EventDrawer({ event, onClose, onSave, onDelete, isDesktop }) {
  const isNew = !event.id
  const [form, setForm] = useState(event)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => { setForm(event); setConfirmDelete(false) }, [event])

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    setTimeout(onClose, 300)
  }, [onClose])

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  const setType = (type) => {
    const match = EVENT_TYPES.find(t => t.value === type)
    setForm(prev => ({ ...prev, type, color: match ? match.color : prev.color }))
  }

  const handleSave = async () => {
    if (!form.title?.trim() || !form.date) return
    setSaving(true)
    try {
      await onSave(form)
      handleClose()
    } catch {
      alert('Could not save event — run supabase-setup.sql in your Supabase SQL editor first.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await onDelete(form.id)
      handleClose()
    } catch {
      alert('Could not delete event.')
    } finally {
      setDeleting(false)
    }
  }

  const content = (
    <>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/25 dark:border-white/10 flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{isNew ? 'New Event' : 'Edit Event'}</h2>
        <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 flex items-center justify-center text-gray-700 dark:text-gray-300 transition-colors">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Type</label>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map(t => (
              <button key={t.value} onClick={() => setType(t.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                  ${form.type === t.value
                    ? 'text-white border-transparent'
                    : 'bg-white/20 dark:bg-white/5 border-white/40 dark:border-white/12 text-gray-600 dark:text-gray-400 hover:border-white/60 dark:hover:border-white/20'}`}
                style={form.type === t.value ? { background: t.color, borderColor: t.color } : {}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Company</label>
          <div className="flex flex-wrap gap-2">
            {COMPANIES.map(c => (
              <button key={c.value} onClick={() => set('company', form.company === c.value ? '' : c.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                  ${form.company === c.value ? c.cls : 'bg-white/20 dark:bg-white/5 border-white/40 dark:border-white/12 text-gray-500 dark:text-gray-400 hover:border-white/60 dark:hover:border-white/20'}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Title</label>
          <input type="text" value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="Event title" className={inputCls} autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Date</label>
            <input type="date" value={form.date || ''} onChange={e => set('date', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">End Date</label>
            <input type="date" value={form.endDate || ''} onChange={e => set('endDate', e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Colour</label>
          <div className="flex gap-2 flex-wrap">
            {EVENT_COLORS.map(c => (
              <button key={c} onClick={() => set('color', c)}
                className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-1 ring-green-500/70 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                style={{ background: c }} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Notes</label>
          <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Optional notes…" className={inputCls + ' resize-none'} />
        </div>

        <button onClick={handleSave} disabled={saving || !form.title?.trim() || !form.date}
          className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md shadow-green-700/20">
          {saving ? 'Saving…' : isNew ? 'Add Event' : 'Save changes'}
        </button>

        {!isNew && onDelete && (
          <>
            <button onClick={handleDelete} disabled={deleting}
              className={`w-full font-semibold py-2.5 rounded-xl text-sm transition-colors border
                ${confirmDelete
                  ? 'bg-red-500/80 hover:bg-red-500 text-white border-red-500/80'
                  : 'bg-transparent text-red-500 dark:text-red-400 border-red-300/40 dark:border-red-400/30 hover:bg-red-400/10 dark:hover:bg-red-400/15'}`}>
              {deleting ? 'Deleting…' : confirmDelete ? 'Confirm delete' : 'Delete event'}
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
      <div className={`flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-out ${open ? 'w-80' : 'w-0'}`}>
        <div className="w-80 h-full border-l border-white/25 dark:border-white/10 bg-white/55 dark:bg-white/10 backdrop-blur-2xl flex flex-col">
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
