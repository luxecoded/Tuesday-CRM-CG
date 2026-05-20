import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function fromCloud(d) {
  return {
    id:            d.id,
    group:         d.deal_group  || 'active',
    deal:          d.deal        || '',
    company:       d.company     || '',
    stage:         d.stage       || '',
    value:         d.value       || 0,
    contact:       d.contact     || '',
    contactId:     d.contact_id  || '',
    location:      d.location    || '',
    quoteSent:     d.quote_sent  || '',
    deposit:       d.deposit     || false,
    comments:      d.comments    || '',
    quoteVisit:    d.quote_visit  || '',
    surveyDate:    d.survey_date  || '',
    installStart:  d.install_start || '',
    installEnd:    d.install_end  || '',
    materialsCost: d.materials_cost || 0,
    surveyor:      d.surveyor    || '',
    installCost:   d.install_cost || 0,
  }
}

function toCloud(d) {
  const nullDate = v => v || null
  const payload = {
    deal_group:    d.group        || 'active',
    deal:          d.deal         || null,
    company:       d.company      || null,
    stage:         d.stage        || null,
    value:         d.value        || 0,
    contact:       d.contact      || null,
    contact_id:    d.contactId    || null,
    location:      d.location     || null,
    quote_sent:    nullDate(d.quoteSent),
    deposit:       d.deposit      || false,
    comments:      d.comments     || null,
    quote_visit:   nullDate(d.quoteVisit),
    survey_date:   nullDate(d.surveyDate),
    install_start: nullDate(d.installStart),
    install_end:   nullDate(d.installEnd),
    materials_cost: d.materialsCost || 0,
    surveyor:      d.surveyor     || null,
    install_cost:  d.installCost  || 0,
  }
  if (d.id) payload.id = d.id
  return payload
}

export function useDeals() {
  const [deals, setDeals]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    fetchDeals()
    const channel = supabase
      .channel('public:deals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, fetchDeals)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchDeals() {
    const { data, error } = await supabase.from('deals').select('*').order('created_at')
    if (error) { setError(error.message); setLoading(false); return }
    setDeals((data || []).map(fromCloud))
    setLoading(false)
  }

  async function updateDeal(updated) {
    setDeals(prev => prev.map(d => d.id === updated.id ? updated : d))
    const { error } = await supabase.from('deals').upsert(toCloud(updated))
    if (error) { fetchDeals(); throw error }
  }

  return { deals, loading, error, updateDeal }
}
