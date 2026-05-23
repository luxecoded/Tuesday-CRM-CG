import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function fromCloud(a) {
  return {
    id:         a.id,
    customerId: a.customer_id || '',
    line1:      a.line1       || '',
    line2:      a.line2       || '',
    city:       a.city        || '',
    postcode:   a.postcode    || '',
    createdAt:  a.created_at,
  }
}

function toCloud(a) {
  const payload = {
    customer_id: a.customerId || null,
    line1:       a.line1      || null,
    line2:       a.line2      || null,
    city:        a.city       || null,
    postcode:    a.postcode   || null,
  }
  if (a.id) payload.id = a.id
  return payload
}

export function useAddresses(customerId) {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!customerId) { setAddresses([]); setLoading(false); return }
    fetchAddresses()
  }, [customerId])

  async function fetchAddresses() {
    setLoading(true)
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at')
    setAddresses((data || []).map(fromCloud))
    setLoading(false)
  }

  async function addAddress(a) {
    const { data, error } = await supabase
      .from('addresses')
      .insert(toCloud({ ...a, customerId }))
      .select()
      .single()
    if (error) throw error
    const added = fromCloud(data)
    setAddresses(prev => [...prev, added])
    return added
  }

  return { addresses, loading, addAddress, refetch: fetchAddresses }
}
