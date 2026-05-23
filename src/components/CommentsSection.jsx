import { useState } from 'react'
import { useComments } from '../hooks/useComments'

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function CommentsSection({ parentType, parentId }) {
  const { comments, loading, addComment, deleteComment } = useComments(parentType, parentId)
  const [text, setText]     = useState('')
  const [saving, setSaving] = useState(false)

  if (!parentId) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      await addComment(trimmed)
      setText('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-ink-muted uppercase tracking-wide">
        Comments
      </label>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 px-3 py-2 bg-surface-input border border-edge-input rounded-lg text-sm text-ink placeholder:text-ink-placeholder outline-none focus:border-green-500/55 transition-colors"
        />
        <button
          type="submit"
          disabled={saving || !text.trim()}
          className="px-3 py-2 bg-green-700 hover:bg-green-800 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
        >
          {saving ? '…' : 'Post'}
        </button>
      </form>

      {loading ? (
        <p className="text-xs text-ink-faint">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-ink-faint italic">No comments yet</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {comments.map(c => (
            <div key={c.id} className="flex items-start gap-2 group">
              <div className="flex-1 bg-surface-chip border border-edge-chip rounded-lg px-3 py-2">
                <p className="text-sm text-ink-body whitespace-pre-wrap break-words">{c.comment}</p>
                <p className="text-xs text-ink-faint mt-1">{timeAgo(c.createdAt)}</p>
              </div>
              <button
                onClick={() => deleteComment(c.id)}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-red-500/10 hover:bg-red-500/25 flex items-center justify-center text-red-400 text-xs transition-all flex-shrink-0 mt-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
