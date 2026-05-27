import { useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase.js'
import { useToast } from '../context/ToastContext.jsx'

const inputCls = "w-full px-3 py-2.5 bg-modal-input border border-modal-border rounded-lg text-sm text-ink outline-none focus:border-green-500/60 transition-colors"

const SIGNATURE = [
  'Kind regards,',
  'Christina Gray',
  'Elite Windows',
  '01865 876102',
  'www.elitewindowsltd.co.uk',
].join('\n')

const TRUST_A_TRADER = 'http://www.trustatrader.com/traders/elite-windows-oxon-bucks-ltd-double-glazing-vale-of-white-horse-west-oxfordshire/'

function buildDefaultSubject(docData) {
  const isOrder = docData.title?.toLowerCase().includes('order')
  const ref = docData.infoFields?.find(f => f.label === 'Quote Ref' || f.label === 'Order Ref')?.value
  if (isOrder) return ref ? `Order Confirmation — Ref: ${ref} — Elite Windows` : 'Order Confirmation — Elite Windows'
  return ref ? `Your Quotation — Ref: ${ref} — Elite Windows` : 'Your Quotation — Elite Windows'
}

function buildDefaultBody(docData) {
  const fullName = docData.infoFields?.find(f => f.label === 'Customer')?.value || ''
  const firstName = fullName.split(' ')[0] || ''
  const greeting = firstName ? `Dear ${firstName},` : 'Dear Sir/Madam,'
  const isOrder = docData.title?.toLowerCase().includes('order')

  if (isOrder) {
    return [
      greeting,
      '',
      'Please see attached order confirmation and detailed survey sheets to be signed and returned asap.',
      '',
      '***A delay in confirmation may result in a change to supply/fitting date as production can not go ahead without order confirmation & payment.***',
      '',
      'Please check all products are listed, designs for openings, frame colour, obscure glass required, handle colour, door panel design and any extras such as door knockers etc are correct.',
      '',
      'Dimensions are also expected to be confirmed by the customer as they are the responsibility of the customer unless measurements have been provided by Elite Windows as part of a survey service.',
      '',
      'If you do not have access to a scanner/printer or are unable to electronically sign, please confirm agreement by responding to this email.',
      'Please make payment to the following Lloyds bank account or request link to pay by card. (AMEX is not accepted)',
      '',
      SIGNATURE,
    ].join('\n')
  }

  return [
    greeting,
    '',
    'I am pleased to submit the following estimate for your double glazing project. Please find attached our quotation for your review.',
    '',
    'Please confirm receipt of attached quotation.',
    '',
    'This estimate is valid for 30 days & prices are subject to survey. I hope this quotation meets with your approval and I hope to hear from you in the near future.',
    '',
    'Customer reviews are available on Trust a Trader website via the following link:',
    TRUST_A_TRADER,
    '',
    SIGNATURE,
  ].join('\n')
}

async function blobUrlToBase64(url) {
  const res  = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Email compose modal. Receives the already-rendered PDF blob URL from
 * PdfPreviewModal so there's no double-render.
 *
 * Props:
 *   docData    — final document descriptor (after any edits in preview)
 *   pdfUrl     — blob URL from usePDF in PdfPreviewModal
 *   filename   — attachment filename
 *   defaultTo  — pre-filled recipient (customer email)
 *   onClose    — dismiss without sending
 *   onSent     — called after successful send
 */
export default function EmailComposeModal({ docData, pdfUrl, filename, defaultTo, onClose, onSent }) {
  const showToast = useToast()
  const [to,      setTo]      = useState(defaultTo || '')
  const [subject, setSubject] = useState(buildDefaultSubject(docData))
  const [body,    setBody]    = useState(buildDefaultBody(docData))
  const [sending, setSending] = useState(false)
  const [error,   setError]   = useState('')

  const handleSend = async () => {
    if (!to.trim()) { setError('Recipient email is required'); return }
    setSending(true)
    setError('')
    try {
      const payload = { to: to.trim(), subject, body }
      if (pdfUrl && filename) {
        payload.pdfBase64 = await blobUrlToBase64(pdfUrl)
        payload.filename  = filename
      }
      const { error: fnError } = await supabase.functions.invoke('send-pdf-email', { body: payload })
      if (fnError) throw new Error(fnError.message)
      showToast('Email sent successfully')
      onSent?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop — higher z than PdfPreviewModal so it sits on top */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-modal-bg border border-modal-border rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-modal-border bg-modal-raised">
          <h2 className="text-base font-bold text-ink">Send by Email</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-modal-close hover:bg-modal-close-hover flex items-center justify-center text-ink-soft transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">

          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">To</label>
            <input
              type="email"
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="client@example.com"
              className={inputCls}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">Message</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={9}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Attachment badge — only shown when a PDF is attached */}
          {pdfUrl && filename && (
            <div className="flex items-center gap-2 px-3 py-2 bg-modal-chip border border-modal-border rounded-lg">
              <span className="text-base">📎</span>
              <span className="text-sm text-ink-soft truncate">{filename}</span>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-modal-border bg-modal-raised">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-modal-chip hover:bg-modal-close-hover border border-modal-border text-ink-soft disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white transition-colors shadow-md shadow-green-700/20"
          >
            {sending ? 'Sending…' : 'Send Email →'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
