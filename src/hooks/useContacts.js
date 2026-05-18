import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function fromCloud(c) {
  return {
    id: c.id,
    firstName: c.first_name || '',
    lastName: c.last_name || '',
    email: c.email || '',
    phone: c.phone || '',
    company: c.company || '',
    role: c.role || '',
    notes: c.notes || '',
    createdAt: c.created_at || '',
  }
}

function toCloud(c) {
  const payload = {
    first_name: c.firstName || null,
    last_name: c.lastName || null,
    email: c.email || null,
    phone: c.phone || null,
    company: c.company || null,
    role: c.role || null,
    notes: c.notes || null,
  }
  if (c.id) payload.id = c.id
  return payload
}

export function useContacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchContacts()
    const channel = supabase
      .channel('public:contacts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => {
        fetchContacts()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchContacts() {
    const { data, error } = await supabase.from('contacts').select('*').order('last_name')
    if (error) { setError(error.message); setLoading(false); return }
    setContacts((data || []).map(fromCloud))
    setLoading(false)
  }

  async function addContact(c) {
    const { data, error } = await supabase.from('contacts').insert(toCloud(c)).select().single()
    if (error) throw error
    const added = fromCloud(data)
    setContacts(prev => [...prev, added].sort((a, b) => a.lastName.localeCompare(b.lastName)))
    return added
  }

  async function updateContact(c) {
    setContacts(prev => prev.map(x => x.id === c.id ? c : x))
    const { error } = await supabase.from('contacts').upsert(toCloud(c))
    if (error) { fetchContacts(); throw error }
  }

  async function deleteContact(id) {
    setContacts(prev => prev.filter(c => c.id !== id))
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (error) { fetchContacts(); throw error }
  }

  return { contacts, loading, error, addContact, updateContact, deleteContact }
}
