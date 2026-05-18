import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function dealFromCloud(d) {
  return {
    id: d.id,
    group: d.group_id || 'active',
    deal: d.deal || '',
    company: d.company || '',
    stage: d.stage || '',
    value: Number(d.value || 0),
    contact: d.contact || '',
    contactId: d.contact_id || '',
    location: d.location || '',
    quoteSent: d.quote_sent || '',
    deposit: !!d.deposit,
    comments: d.comments || '',
    quoteVisit: d.quote_visit || '',
    surveyDate: d.survey_date || '',
    installStart: d.install_start || '',
    installEnd: d.install_end || '',
    materialsCost: Number(d.materials_cost || 0),
    surveyor: d.surveyor || '',
    installCost: Number(d.install_cost || 0),
    createdAt: d.created_at || '',
  }
}

function dealToCloud(d) {
  return {
    id: d.id,
    group_id: d.group,
    deal: d.deal || null,
    company: d.company || null,
    stage: d.stage || null,
    value: Number(d.value || 0),
    contact: d.contact || null,
    contact_id: d.contactId || null,
    location: d.location || null,
    quote_sent: d.quoteSent || null,
    deposit: !!d.deposit,
    comments: d.comments || null,
    quote_visit: d.quoteVisit || null,
    survey_date: d.surveyDate || null,
    install_start: d.installStart || null,
    install_end: d.installEnd || null,
    materials_cost: Number(d.materialsCost || 0),
    surveyor: d.surveyor || null,
    install_cost: Number(d.installCost || 0),
  }
}

export function useDeals() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDeals()

    const channel = supabase
      .channel('public:deals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
        fetchDeals()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchDeals() {
    const { data, error } = await supabase.from('deals').select('*')
    if (error) { setError(error.message); setLoading(false); return }
    setDeals((data || []).map(dealFromCloud))
    setLoading(false)
  }

  async function updateDeal(updated) {
    setDeals(prev => prev.map(d => d.id === updated.id ? updated : d))
    const { error } = await supabase.from('deals').upsert(dealToCloud(updated))
    if (error) { fetchDeals(); throw error }
  }

  return { deals, loading, error, updateDeal }
}
