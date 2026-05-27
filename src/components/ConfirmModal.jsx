import { useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * Styled confirmation dialog — replaces window.confirm across all drawers.
 * Props:
 *   title        — heading text
 *   message      — body text
 *   confirmLabel — confirm button label (default "Confirm")
 *   danger       — true = red button, false = amber (default true)
 *   onConfirm    — called when user confirms
 *   onCancel     — called when user cancels or clicks backdrop
 */
export default function ConfirmModal({ title, message, confirmLabel = 'Confirm', danger = true, onConfirm, onCancel }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Card */}
      <div className="relative bg-surface-drawer border border-edge-hi rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-base font-bold text-ink mb-2">{title}</h3>
        <p className="text-sm text-ink-soft leading-relaxed mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-surface-chip hover:bg-surface-hover border border-edge-hi text-ink-soft transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              danger
                ? 'bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 border border-red-500/20'
                : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-500/20'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
