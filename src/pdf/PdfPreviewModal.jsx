import { useState, useEffect, useMemo, createElement } from 'react'
import { createPortal } from 'react-dom'
import { usePDF } from '@react-pdf/renderer'
import PdfTemplate from './PdfTemplate.jsx'
import EmailComposeModal from './EmailComposeModal.jsx'

const inputCls = "w-full px-3 py-2 bg-modal-input border border-modal-border rounded-lg text-sm text-ink outline-none focus:border-green-500/60 transition-colors"

/**
 * PDF preview modal with editable info fields and notes.
 * - Info fields (customer, address, refs, etc.) are all editable
 * - Notes field adds a free-text block to the PDF
 * - Line items and totals are read-only (edit them in the drawer)
 * - PDF re-renders 600ms after typing stops
 *
 * Props:
 *   docData   — document descriptor from any mapper
 *   filename  — download filename
 *   defaultTo — pre-filled recipient email (e.g. customer email)
 *   onClose   — called when dismissed
 */
export default function PdfPreviewModal({ docData, filename, defaultTo = '', onClose }) {
  const [showEmail, setShowEmail] = useState(false)
  // Editable state — keyed by field index so we don't depend on field label
  const [fieldValues, setFieldValues] = useState(() =>
    Object.fromEntries((docData.infoFields || []).map((f, i) => [i, f.value || '']))
  )
  const [notes, setNotes] = useState(docData.notes || '')

  // Debounced snapshot — PDF only re-renders after typing stops
  const [debounced, setDebounced] = useState({ fieldValues, notes })
  useEffect(() => {
    const t = setTimeout(() => setDebounced({ fieldValues, notes }), 600)
    return () => clearTimeout(t)
  }, [fieldValues, notes])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const mergedDocData = useMemo(() => ({
    ...docData,
    infoFields: (docData.infoFields || []).map((f, i) => ({
      ...f,
      value: debounced.fieldValues[i] ?? f.value,
    })),
    notes: debounced.notes,
  }), [docData, debounced])

  const docElement = useMemo(
    () => createElement(PdfTemplate, { docData: mergedDocData }),
    [mergedDocData]
  )

  const [instance] = usePDF({ document: docElement })

  const setField = (i, val) => setFieldValues(prev => ({ ...prev, [i]: val }))

  const handleDownload = () => {
    if (!instance.url) return
    const a = document.createElement('a')
    a.href = instance.url
    a.download = filename
    a.click()
  }

  const modal = createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-8">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative bg-modal-bg border border-modal-border rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden"
        style={{ height: 'min(90vh, 760px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-modal-border bg-modal-raised flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-ink">PDF Preview</h2>
            <p className="text-xs text-ink-muted mt-0.5">{filename}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-modal-close hover:bg-modal-close-hover flex items-center justify-center text-ink-soft transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">

          {/* ── Edit sidebar (desktop) ── */}
          <div className="hidden lg:flex w-60 flex-shrink-0 border-r border-modal-border bg-modal-raised flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">

              {/* Info fields */}
              {(docData.infoFields || []).map((field, i) => (
                <div key={i}>
                  <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={fieldValues[i] ?? ''}
                    onChange={e => setField(i, e.target.value)}
                    className={inputCls}
                  />
                </div>
              ))}

              <div className="border-t border-modal-border pt-3">
                <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add a message or note for the client…"
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <p className="text-xs text-ink-faint leading-relaxed pb-2">
                Preview updates after you stop typing. Items and totals are edited in the drawer.
              </p>
            </div>
          </div>

          {/* ── PDF viewer ── */}
          <div className="flex-1 min-w-0 bg-gray-100 dark:bg-gray-900 relative">
            {instance.loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-ink-muted">
                  <div className="text-2xl mb-2 animate-spin">⟳</div>
                  <p className="text-sm">Generating PDF…</p>
                </div>
              </div>
            )}
            {instance.error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-red-400">Failed to render PDF. Try closing and reopening.</p>
              </div>
            )}
            {instance.url && !instance.loading && (
              <iframe
                src={instance.url}
                className="w-full h-full border-0"
                title="PDF Preview"
              />
            )}
          </div>
        </div>

        {/* ── Mobile edit area ── */}
        <div className="lg:hidden flex-shrink-0 border-t border-modal-border bg-modal-raised max-h-40 overflow-y-auto">
          <div className="p-4 space-y-2">
            {(docData.infoFields || []).map((field, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-ink-faint w-20 flex-shrink-0">{field.label}</span>
                <input
                  type="text"
                  value={fieldValues[i] ?? ''}
                  onChange={e => setField(i, e.target.value)}
                  className={inputCls}
                />
              </div>
            ))}
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes…"
              rows={2}
              className={`${inputCls} resize-none mt-1`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-modal-border bg-modal-raised flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-modal-chip hover:bg-modal-close-hover border border-modal-border text-ink-soft transition-colors"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => setShowEmail(true)}
              disabled={instance.loading || !instance.url}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-modal-border bg-modal-chip hover:bg-modal-close-hover text-ink-soft disabled:opacity-60 transition-colors"
            >
              ✉ Email
            </button>
            <button
              onClick={handleDownload}
              disabled={instance.loading || !instance.url}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white transition-colors shadow-md shadow-green-700/20"
            >
              {instance.loading ? 'Generating…' : '⬇ Download'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )

  return (
    <>
      {modal}
      {showEmail && (
        <EmailComposeModal
          docData={mergedDocData}
          pdfUrl={instance.url}
          filename={filename}
          defaultTo={defaultTo}
          onClose={() => setShowEmail(false)}
          onSent={() => { setShowEmail(false); onClose() }}
        />
      )}
    </>
  )
}
