import { useState, useEffect } from 'react'

const STAGE_COLORS = {
  'Quote': '#a855f7', 'Awaiting Client': '#f59e0b', 'Survey': '#38bdf8',
  'Follow Up': '#ec4899', 'Signed': '#6366f1', 'To Order': '#f97316',
  'Installation TBC': '#84cc16', 'Installation Booked': '#10b981',
  'Installed Pending Certification': '#14b8a6', 'Awaiting Payment': '#f59e0b',
  'Completed': '#059669', 'Service Call': '#6b7280',
}

const COMPANY_CLASSES = {
  'Isis Windows':     'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  'Paradise Windows': 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  'Elite Windows':    'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
}

const MILESTONE_LABELS  = { quote: 'Quote Sent', survey: 'Survey Date', install: 'Install Start' }
const EVENT_TYPE_LABELS = { quote: 'Quote', survey: 'Survey', install: 'Install', meeting: 'Meeting', other: 'Other' }

function fmtDate(str) {
  if (!str) return null
  const [y, m, d] = str.split('-')
  return `${parseInt(d)} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m)-1]} ${y}`
}

function fmtValue(val) {
  if (!val) return null
  return `£${Number(val).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-right">{children}</span>
    </div>
  )
}

export default function EventDetailPanel({ item, onClose, onEdit, isDesktop }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 260)
  }

  const isDeal  = item.type !== 'event'
  const deal    = item.deal
  const ev      = item.event
  const title   = isDeal ? (deal?.deal || deal?.company || '—') : (ev?.title || '—')
  const company = isDeal ? deal?.company : ev?.company
  const milestoneDate = isDeal && deal
    ? (item.type === 'quote' ? deal.quoteSent : item.type === 'survey' ? deal.surveyDate : deal.installStart)
    : null

  const content = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5" style={{ background: item.color }} />
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-white leading-snug truncate">{title}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {isDeal ? MILESTONE_LABELS[item.type] : (ev?.type ? EVENT_TYPE_LABELS[ev.type] : 'Event')}
            </p>
          </div>
        </div>
        <button onClick={handleClose}
          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors flex-shrink-0 ml-3 mt-0.5">
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

        {company && (
          <Row label="Company">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${COMPANY_CLASSES[company] || 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
              {company}
            </span>
          </Row>
        )}

        {/* Deal milestone fields */}
        {isDeal && deal && (
          <>
            {deal.stage && (
              <Row label="Stage">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: STAGE_COLORS[deal.stage] || '#6b7280' }} />
                  {deal.stage}
                </span>
              </Row>
            )}
            {deal.value ? <Row label="Value">{fmtValue(deal.value)}</Row> : null}
            {milestoneDate && (
              <Row label={MILESTONE_LABELS[item.type]}>
                <span style={{ color: item.color }}>{fmtDate(milestoneDate)}</span>
              </Row>
            )}
            {deal.comments && (
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Notes</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{deal.comments}</p>
              </div>
            )}
          </>
        )}

        {/* Custom event fields */}
        {!isDeal && ev && (
          <>
            <Row label="Date">{fmtDate(ev.date)}</Row>
            {ev.endDate && <Row label="End Date">{fmtDate(ev.endDate)}</Row>}
            {ev.notes && (
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">Notes</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{ev.notes}</p>
              </div>
            )}
            <div className="pt-2">
              <button onClick={onEdit}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                Edit Event
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )

  if (isDesktop) {
    return (
      <div className={`w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full flex-shrink-0 transition-transform duration-200 ease-out
        ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
        {content}
      </div>
    )
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-250 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      <div className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl z-50 flex flex-col max-h-[85vh] transition-transform duration-300 ease-out
        ${visible ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="w-9 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
        {content}
      </div>
    </>
  )
}
