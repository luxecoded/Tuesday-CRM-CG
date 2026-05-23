import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function fromCloud(c) {
  return {
    id:         c.id,
    parentType: c.parent_type,
    parentId:   c.parent_id,
    comment:    c.comment,
    createdAt:  c.created_at,
  }
}

export function useComments(parentType, parentId) {
  const [comments, setComments] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!parentId) { setComments([]); setLoading(false); return }
    fetchComments()
    const channel = supabase
      .channel(`comments:${parentType}:${parentId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'comments',
        filter: `parent_id=eq.${parentId}`,
      }, fetchComments)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [parentType, parentId])

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('parent_type', parentType)
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false })
    setComments((data || []).map(fromCloud))
    setLoading(false)
  }

  async function addComment(text) {
    const { data, error } = await supabase
      .from('comments')
      .insert({ parent_type: parentType, parent_id: parentId, comment: text })
      .select()
      .single()
    if (error) throw error
    const added = fromCloud(data)
    setComments(prev => [added, ...prev])
    return added
  }

  async function deleteComment(id) {
    setComments(prev => prev.filter(c => c.id !== id))
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) fetchComments()
  }

  return { comments, loading, addComment, deleteComment }
}
