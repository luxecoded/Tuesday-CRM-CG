import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SELECT = `
  *,
  jobs (
    title,
    customer_id,
    customers ( full_name ),
    address_id,
    addresses ( line1, city )
  ),
  quote_items (*)
`

function fromItemCloud(i) {
  return {
    id:          i.id,
    productName: i.product_name   || '',
    quantity:    i.quantity       || 1,
    width:       i.width          || '',
    height:      i.height         || '',
    frameColour: i.frame_colour   || '',
    glassType:   i.glass_type     || '',
    supplierCost: i.supplier_cost || 0,
    salePrice:   i.sale_price     || 0,
  }
}

function fromCloud(d) {
  return {
    id:                d.id,
    jobId:             d.job_id              || '',
    jobTitle:          d.jobs?.title         || '',
    customerName:      d.jobs?.customers?.full_name || '',
    addressLine1:      d.jobs?.addresses?.line1     || '',
    addressCity:       d.jobs?.addresses?.city      || '',
    ewtQuoteRef:       d.ewt_quote_ref       || '',
    origin:            d.origin              || '',
    supplierName:      d.supplier_name       || '',
    supplierReference: d.supplier_reference  || '',
    ewtValue:          d.ewt_value           || 0,
    supplierValue:     d.supplier_value      || 0,
    total:             d.total               || 0,
    status:            d.status              || 'draft',
    sentToSupplier:    d.sent_to_supplier    || false,
    sentToCustomer:    d.sent_to_customer    || false,
    items:             (d.quote_items || []).map(fromItemCloud),
    createdAt:         d.created_at,
  }
}

function toCloud(d) {
  return {
    job_id:             d.jobId             || null,
    ewt_quote_ref:      d.ewtQuoteRef       || null,
    origin:             d.origin            || null,
    supplier_name:      d.supplierName      || null,
    supplier_reference: d.supplierReference || null,
    ewt_value:          d.ewtValue          || 0,
    supplier_value:     d.supplierValue     || 0,
    total:              d.total             || 0,
    status:             d.status            || 'draft',
    sent_to_supplier:   d.sentToSupplier    || false,
    sent_to_customer:   d.sentToCustomer    || false,
    updated_at:         new Date().toISOString(),
  }
}

function itemToCloud(item, quoteId) {
  return {
    quote_id:     quoteId,
    product_name: item.productName  || 'Item',
    quantity:     item.quantity     || 1,
    width:        item.width        || null,
    height:       item.height       || null,
    frame_colour: item.frameColour  || null,
    glass_type:   item.glassType    || null,
    supplier_cost: item.supplierCost || 0,
    sale_price:   item.salePrice    || 0,
  }
}

function calcTotals(items) {
  const ewtValue      = items.reduce((s, i) => s + (i.salePrice    || 0) * (i.quantity || 1), 0)
  const supplierValue = items.reduce((s, i) => s + (i.supplierCost || 0) * (i.quantity || 1), 0)
  return { ewtValue, supplierValue, total: ewtValue + supplierValue }
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quote_items' }, fetchQuotes)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchQuotes() {
    const { data, error } = await supabase
      .from('quotes')
      .select(SELECT)
      .order('created_at', { ascending: false })
    if (error) { setError(error.message); setLoading(false); return }
    setQuotes((data || []).map(fromCloud))
    setLoading(false)
  }

  async function saveItems(quoteId, items) {
    await supabase.from('quote_items').delete().eq('quote_id', quoteId)
    if (items.length > 0) {
      const { error } = await supabase
        .from('quote_items')
        .insert(items.map(i => itemToCloud(i, quoteId)))
      if (error) throw error
    }
  }

  async function createQuote(quote) {
    const totals  = calcTotals(quote.items || [])
    const payload = { ...toCloud(quote), ...totals }
    const { data, error } = await supabase
      .from('quotes')
      .insert(payload)
      .select(SELECT)
      .single()
    if (error) throw error
    await saveItems(data.id, quote.items || [])
    const full = await fetchOne(data.id)
    setQuotes(prev => [full, ...prev])
    return full
  }

  async function updateQuote(updated) {
    const totals  = calcTotals(updated.items || [])
    const payload = { ...toCloud(updated), ...totals, id: updated.id }
    const { error } = await supabase.from('quotes').upsert(payload)
    if (error) { fetchQuotes(); throw error }
    await saveItems(updated.id, updated.items || [])
    const fresh = await fetchOne(updated.id)
    if (fresh) setQuotes(prev => prev.map(q => q.id === fresh.id ? fresh : q))
    return fresh || updated
  }

  async function deleteQuote(id) {
    setQuotes(prev => prev.filter(q => q.id !== id))
    const { error } = await supabase.from('quotes').delete().eq('id', id)
    if (error) { fetchQuotes(); throw error }
  }

  async function fetchOne(id) {
    const { data } = await supabase.from('quotes').select(SELECT).eq('id', id).single()
    return data ? fromCloud(data) : null
  }

  return { quotes, loading, error, createQuote, updateQuote, deleteQuote }
}
