import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function fromCloud(d) {
  return {
    id:                   d.id,
    dealId:               d.deal_id               || '',
    ewtQuoteRef:          d.ewt_quote_ref         || '',
    customerName:         d.customer_name         || '',
    address:              d.address               || '',
    contactNumber:        d.contact_number        || '',
    email:                d.email                 || '',
    origin:               d.origin                || '',
    options:              Array.isArray(d.options) ? d.options : [],
    sentToSupplier:       d.sent_to_supplier      || false,
    quoteSentToCustomer:  d.quote_sent_to_customer || false,
    response:             d.response              || 'Waiting',
    createdAt:            d.created_at,
  }
}

function toCloud(d) {
  return {
    deal_id:                d.dealId              || null,
    ewt_quote_ref:          d.ewtQuoteRef         || null,
    customer_name:          d.customerName        || null,
    address:                d.address             || null,
    contact_number:         d.contactNumber       || null,
    email:                  d.email               || null,
    origin:                 d.origin              || null,
    options:                d.options             || [],
    sent_to_supplier:       d.sentToSupplier      || false,
    quote_sent_to_customer: d.quoteSentToCustomer || false,
    response:               d.response            || 'Waiting',
  }
}

export function useQuotes() {
  const [quotes, setQuotes]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    fetchQuotes()
    const channel = supabase
      .channel('public:quotes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, fetchQuotes)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchQuotes() {
    const { data, error } = await supabase.from('quotes').select('*').order('created_at', { ascending: false })
    if (error) { setError(error.message); setLoading(false); return }
    setQuotes((data || []).map(fromCloud))
    setLoading(false)
  }

  async function createQuote(quote) {
    const payload = toCloud(quote)
    const { data, error } = await supabase.from('quotes').insert(payload).select().single()
    if (error) throw error
    setQuotes(prev => [fromCloud(data), ...prev])
    return fromCloud(data)
  }

  async function updateQuote(updated) {
    setQuotes(prev => prev.map(q => q.id === updated.id ? updated : q))
    const payload = { ...toCloud(updated), id: updated.id }
    const { error } = await supabase.from('quotes').upsert(payload)
    if (error) { fetchQuotes(); throw error }
  }

  async function deleteQuote(id) {
    setQuotes(prev => prev.filter(q => q.id !== id))
    const { error } = await supabase.from('quotes').delete().eq('id', id)
    if (error) { fetchQuotes(); throw error }
  }

  return { quotes, loading, error, createQuote, updateQuote, deleteQuote }
}
