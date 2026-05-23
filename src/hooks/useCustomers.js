import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function fromCloud(c) {
  return {
    id:        c.id,
    fullName:  c.full_name  || '',
    phone:     c.phone      || '',
    email:     c.email      || '',
    notes:     c.notes      || '',
    createdAt: c.created_at,
  }
}

function toCloud(c) {
  const payload = {
    full_name: c.fullName || null,
    phone:     c.phone    || null,
    email:     c.email    || null,
    notes:     c.notes    || null,
  }
  if (c.id) payload.id = c.id
  return payload
}

export function useCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    fetchCustomers()
    const channel = supabase
      .channel('public:customers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchCustomers)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchCustomers() {
    const { data, error } = await supabase.from('customers').select('*').order('full_name')
    if (error) { setError(error.message); setLoading(false); return }
    setCustomers((data || []).map(fromCloud))
    setLoading(false)
  }

  async function addCustomer(c) {
    const { data, error } = await supabase.from('customers').insert(toCloud(c)).select().single()
    if (error) throw error
    const added = fromCloud(data)
    setCustomers(prev => [...prev, added].sort((a, b) => a.fullName.localeCompare(b.fullName)))
    return added
  }

  async function updateCustomer(c) {
    setCustomers(prev => prev.map(x => x.id === c.id ? c : x))
    const { error } = await supabase.from('customers').upsert(toCloud(c))
    if (error) { fetchCustomers(); throw error }
  }

  return { customers, loading, error, addCustomer, updateCustomer }
}
