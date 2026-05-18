import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function fromCloud(e) {
  return {
    id: e.id,
    title: e.title || '',
    date: e.date || '',
    endDate: e.end_date || '',
    color: e.color || '#6366f1',
    notes: e.notes || '',
    dealId: e.deal_id || null,
    createdAt: e.created_at || '',
  }
}

function toCloud(e) {
  const payload = {
    title: e.title || null,
    date: e.date || null,
    end_date: e.endDate || null,
    color: e.color || '#6366f1',
    notes: e.notes || null,
    deal_id: e.dealId || null,
  }
  if (e.id) payload.id = e.id
  return payload
}

export function useEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchEvents()
    const channel = supabase
      .channel('public:events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEvents()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchEvents() {
    const { data, error } = await supabase.from('events').select('*').order('date')
    if (error) { setError(error.message); setLoading(false); return }
    setEvents((data || []).map(fromCloud))
    setLoading(false)
  }

  async function addEvent(e) {
    const { data, error } = await supabase.from('events').insert(toCloud(e)).select().single()
    if (error) throw error
    const added = fromCloud(data)
    setEvents(prev => [...prev, added].sort((a, b) => a.date.localeCompare(b.date)))
    return added
  }

  async function updateEvent(e) {
    setEvents(prev => prev.map(x => x.id === e.id ? e : x))
    const { error } = await supabase.from('events').upsert(toCloud(e))
    if (error) { fetchEvents(); throw error }
  }

  async function deleteEvent(id) {
    setEvents(prev => prev.filter(e => e.id !== id))
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) { fetchEvents(); throw error }
  }

  return { events, loading, error, addEvent, updateEvent, deleteEvent }
}
