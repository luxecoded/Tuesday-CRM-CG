import { useState, useEffect } from 'react'

const STAGES = [
  'Quote','Awaiting Client','Survey','Follow Up','Signed',
  'To Order','Installation TBC','Installation Booked',
  'Installed Pending Certification','Awaiting Payment','Completed','Service Call'
]
const COMPANIES = ['Isis Windows', 'Paradise Windows', 'Elite Windows']

const STAGE_COLOURS = {
  'Quote':                          'bg-purple-100 text-purple-700',
  'Awaiting Client':                'bg-amber-100 text-amber-700',
  'Survey':                         'bg-sky-100 text-sky-700',
  'Follow Up':                      'bg-pink-100 text-pink-700',
  'Signed':                         'bg-indigo-100 text-indigo-700',
  'To Order':                       'bg-orange-100 text-orange-700',
  'Installation TBC':               'bg-lime-100 text-lime-700',
  'Installation Booked':            'bg-emerald-100 text-emerald-700',
  'Installed Pending Certification':'bg-teal-100 text-teal-700',
  'Awaiting Payment':               'bg-yellow-100 text-yellow-700',
  'Completed':                      'bg-green-100 text-green-700',
  'Service Call':                   'bg-gray-100 text-gray-600',
}

function calcGP(deal) {
  const exVat = (deal.value || 0) / 1.2
  if (exVat <= 0) return null
  const gp = ((exVat - (deal.materialsCost || 0) - (deal.installCost || 0)) / exVat) * 100
  return gp.toFixed(1)
}

export default function DealDrawer({ deal, onClose, onSave, isDesktop }) {
  const [form, setForm] = useState(deal)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setForm(deal) }, [deal])

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  const gp = calcGP(form)

  const content = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{form.deal || 'Unnamed deal'}</h2>
          <p className="text-sm text-gray-500">{form.company}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors flex-shrink-0 mt-0.5">✕</button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Stage badge */}
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${STAGE_COLOURS[form.stage] || 'bg-gray-100 text-gray-600'}`}>
          {form.stage}
        </span>

        {/* Stage + Company */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Stage</label>
            <select value={form.stage} onChange={e => set('stage', e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-indigo-400">
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Company</label>
            <select value={form.company} onChange={e => set('company', e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-indigo-400">
              {COMPANIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Value + Quote Sent */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Value (inc VAT)</label>
            <input type="number" value={form.value} onChange={e => set('value', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Quote Sent</label>
            <input type="date" value={form.quoteSent} onChange={e => set('quoteSent', e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-indigo-400" />
          </div>
        </div>

        {/* Costs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Materials Cost</label>
            <input type="number" value={form.materialsCost} onChange={e => set('materialsCost', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Install Cost</label>
            <input type="number" value={form.installCost} onChange={e => set('installCost', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-indigo-400" />
          </div>
        </div>

        {/* GP Badge */}
        {gp !== null ? (
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-semibold text-green-700">
            📊 GP: {gp}%
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400">
            📊 GP: — fill in value and costs above
          </div>
        )}

        <div className="border-t border-gray-100" />

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Notes</label>
          <textarea value={form.comments} onChange={e => set('comments', e.target.value)} rows={4}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-indigo-400 resize-none" />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Survey Date</label>
            <input type="date" value={form.surveyDate} onChange={e => set('surveyDate', e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Install Start</label>
            <input type="date" value={form.installStart} onChange={e => set('installStart', e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-indigo-400" />
          </div>
        </div>

        {/* Deposit */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.deposit} onChange={e => set('deposit', e.target.checked)}
            className="w-4 h-4 accent-indigo-500" />
          <span className="text-sm text-gray-700 font-medium">Deposit received</span>
        </label>

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </>
  )

  if (isDesktop) {
    return (
      <div className="w-96 border-l border-gray-200 bg-white flex flex-col h-full flex-shrink-0">
        {content}
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 flex flex-col max-h-[88vh]">
        <div className="w-9 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
        {content}
      </div>
    </>
  )
}
