import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Sync quote customer details into the contacts table.
// Matching priority: email → phone → name.
// Only fills in blank fields on existing contacts — never overwrites.
async function syncContact(quote) {
  const name  = (quote.customerName   || '').trim()
  const email = (quote.email          || '').trim().toLowerCase()
  const phone = (quote.contactNumber  || '').trim()

  if (!name) return  // nothing to sync without a name

  // --- find existing contact ---
  let existing = null

  if (!existing && email) {
    const { data } = await supabase
      .from('contacts').select('*').ilike('email', email).maybeSingle()
    if (data) existing = data
  }

  if (!existing && phone) {
    const { data } = await supabase
      .from('contacts').select('*').eq('phone', phone).maybeSingle()
    if (data) existing = data
  }

  if (!existing) {
    const { data } = await supabase
      .from('contacts').select('*').ilike('name', name).maybeSingle()
    if (data) existing = data
  }

  if (existing) {
    // Fill in any fields that are currently blank
    const updates = {}
    if (!existing.name    && name)              updates.name    = name
    if (!existing.email   && email)             updates.email   = email
    if (!existing.phone   && phone)             updates.phone   = phone
    if (!existing.company)                      updates.company = 'Elite Windows'

    if (Object.keys(updates).length > 0) {
      await supabase.from('contacts').update(updates).eq('id', existing.id)
    }
  } else {
    // Create a new contact record
    const id = 'r' + Math.random().toString(36).slice(2, 14)
    await supabase.from('contacts').insert({
      id,
      name,
      email:   email || null,
      phone:   phone || null,
      company: 'Elite Windows',
    })
  }
}

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
    const created = fromCloud(data)
    setQuotes(prev => [created, ...prev])
    syncContact(quote).catch(() => {})   // fire-and-forget — never blocks the save
    return created
  }

  async function updateQuote(updated) {
    setQuotes(prev => prev.map(q => q.id === updated.id ? updated : q))
    const payload = { ...toCloud(updated), id: updated.id }
    const { error } = await supabase.from('quotes').upsert(payload)
    if (error) { fetchQuotes(); throw error }
    syncContact(updated).catch(() => {}) // fire-and-forget — never blocks the save
  }

  async function deleteQuote(id) {
    setQuotes(prev => prev.filter(q => q.id !== id))
    const { error } = await supabase.from('quotes').delete().eq('id', id)
    if (error) { fetchQuotes(); throw error }
  }

  return { quotes, loading, error, createQuote, updateQuote, deleteQuote }
}
