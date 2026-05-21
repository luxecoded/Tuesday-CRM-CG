import { useState, useEffect, useCallback } from 'react'

const STAGES = [
  'Quote','Awaiting Client','Survey','Follow Up','Signed',
  'To Order','Installation TBC','Installation Booked',
  'Installed Pending Certification','Awaiting Payment','Completed','Service Call'
]
const COMPANIES = ['Isis Windows', 'Paradise Windows', 'Elite Windows']

const STAGE_COLOURS = {
  'Quote':                          'bg-purple-400/20 text-purple-700 dark:bg-purple-400/15 dark:text-purple-300',
  'Awaiting Client':                'bg-amber-400/20 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  'Survey':                         'bg-sky-400/20 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300',
  'Follow Up':                      'bg-pink-400/20 text-pink-700 dark:bg-pink-400/15 dark:text-pink-300',
  'Signed':                         'bg-violet-400/20 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300',
  'To Order':                       'bg-orange-400/20 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300',
  'Installation TBC':               'bg-lime-400/20 text-lime-700 dark:bg-lime-400/15 dark:text-lime-300',
  'Installation Booked':            'bg-emerald-400/20 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
  'Installed Pending Certification':'bg-teal-400/20 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300',
  'Awaiting Payment':               'bg-yellow-400/20 text-yellow-700 dark:bg-yellow-400/15 dark:text-yellow-300',
  'Completed':                      'bg-green-400/20 text-green-700 dark:bg-green-400/15 dark:text-green-300',
  'Service Call':                   'bg-gray-400/20 text-gray-600 dark:bg-gray-400/15 dark:text-gray-300',
}

function calcGP(deal) {
  const exVat = (deal.value || 0) / 1.2
  if (exVat <= 0) return null
  const gp = ((exVat - (deal.materialsCost || 0) - (deal.installCost || 0)) / exVat) * 100
  return gp.toFixed(1)
}

const inputCls = "w-full px-3 py-2.5 bg-white/50 dark:bg-white/8 border border-white/50 dark:border-white/15 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-green-500/60 dark:focus:border-green-500/50 transition-colors"

export default function DealDrawer({ deal, onClose, onSave, isDesktop }) {
  const [form, setForm] = useState(deal)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => { setForm(deal) }, [deal])

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    setTimeout(onClose, 300)
  }, [onClose])

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  const gp = calcGP(form)

  const content = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-white/25 dark:border-white/10 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{form.deal || 'Unnamed deal'}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{form.company}</p>
        </div>
        <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 flex items-center justify-center text-gray-700 dark:text-gray-300 transition-colors flex-shrink-0 mt-0.5">✕</button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${STAGE_COLOURS[form.stage] || 'bg-white/30 dark:bg-white/10 text-gray-600 dark:text-gray-300'}`}>
          {form.stage}
        </span>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Stage</label>
            <select value={form.stage} onChange={e => set('stage', e.target.value)} className={inputCls}>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Company</label>
            <select value={form.company} onChange={e => set('company', e.target.value)} className={inputCls}>
              {COMPANIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Value (inc VAT)</label>
            <input type="number" value={form.value} onChange={e => set('value', parseFloat(e.target.value) || 0)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Quote Sent</label>
            <input type="date" value={form.quoteSent} onChange={e => set('quoteSent', e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Materials Cost</label>
            <input type="number" value={form.materialsCost} onChange={e => set('materialsCost', parseFloat(e.target.value) || 0)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Install Cost</label>
            <input type="number" value={form.installCost} onChange={e => set('installCost', parseFloat(e.target.value) || 0)} className={inputCls} />
          </div>
        </div>

        {gp !== null ? (
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-400/15 dark:bg-green-500/15 border border-green-400/30 dark:border-green-500/25 rounded-lg text-sm font-semibold text-green-700 dark:text-green-400">
            📊 GP: {gp}%
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-white/30 dark:bg-white/5 border border-white/30 dark:border-white/12 rounded-lg text-sm text-gray-500 dark:text-gray-400">
            📊 GP: — fill in value and costs above
          </div>
        )}

        <div className="border-t border-white/20 dark:border-white/8" />

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Notes</label>
          <textarea value={form.comments} onChange={e => set('comments', e.target.value)} rows={4} className={inputCls + ' resize-none'} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Survey Date</label>
            <input type="date" value={form.surveyDate} onChange={e => set('surveyDate', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Install Start</label>
            <input type="date" value={form.installStart} onChange={e => set('installStart', e.target.value)} className={inputCls} />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.deposit} onChange={e => set('deposit', e.target.checked)} className="w-4 h-4 accent-green-500" />
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Deposit received</span>
        </label>

        <button onClick={handleSave} disabled={saving}
          className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md shadow-green-700/20">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
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
