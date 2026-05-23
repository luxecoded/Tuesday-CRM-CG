import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const STATUS_ORDER = ['enquiry','quoted','accepted','surveyed','installed','complete','lost']

export const STATUS_LABELS = {
  enquiry:   'Enquiry',
  quoted:    'Quoted',
  accepted:  'Accepted',
  surveyed:  'Surveyed',
  installed: 'Installed',
  complete:  'Complete',
  lost:      'Lost',
}

export const STATUS_COLORS = {
  enquiry:   '#a855f7',
  quoted:    '#f59e0b',
  accepted:  '#10b981',
  surveyed:  '#38bdf8',
  installed: '#14b8a6',
  complete:  '#059669',
  lost:      '#6b7280',
}

function fromCloud(d) {
  return {
    id:           d.id,
    title:        d.title          || '',
    status:       d.status         || 'enquiry',
    customerId:   d.customer_id    || '',
    customerName: d.customers?.full_name || '',
    addressId:    d.address_id     || '',
    addressLine1: d.addresses?.line1 || '',
    addressCity:  d.addresses?.city  || '',
    quoteVisit:   d.quote_visit    || '',
    createdAt:    d.created_at,
  }
}

function toCloud(d) {
  return {
    title:       d.title      || null,
    status:      d.status     || 'enquiry',
    customer_id: d.customerId || null,
    address_id:  d.addressId  || null,
    quote_visit: d.quoteVisit || null,
    updated_at:  new Date().toISOString(),
  }
}

const SELECT = '*, customers(full_name), addresses(line1, city)'

export function useJobs() {
  const [jobs, setJobs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    fetchJobs()
    const channel = supabase
      .channel('public:jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchJobs)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select(SELECT)
      .order('created_at')
    if (error) { setError(error.message); setLoading(false); return }
    setJobs((data || []).map(fromCloud))
    setLoading(false)
  }

  async function createJob(job) {
    const { data, error } = await supabase
      .from('jobs')
      .insert(toCloud(job))
      .select(SELECT)
      .single()
    if (error) throw error
    const created = fromCloud(data)
    setJobs(prev => [...prev, created])
    return created
  }

  async function updateJob(updated) {
    setJobs(prev => prev.map(j => j.id === updated.id ? updated : j))
    const payload = { ...toCloud(updated), id: updated.id }
    const { error } = await supabase.from('jobs').upsert(payload)
    if (error) { fetchJobs(); throw error }
  }

  async function deleteJob(id) {
    setJobs(prev => prev.filter(j => j.id !== id))
    const { error } = await supabase.from('jobs').delete().eq('id', id)
    if (error) { fetchJobs(); throw error }
  }

  return { jobs, loading, error, createJob, updateJob, deleteJob }
}
