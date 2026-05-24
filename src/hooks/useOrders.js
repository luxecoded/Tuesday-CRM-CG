import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SELECT = `
  *,
  jobs (
    title,
    customers ( full_name ),
    addresses ( line1, city, postcode )
  ),
  order_items (*)
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
    id:                     d.id,
    jobId:                  d.job_id                   || '',
    quoteId:                d.quote_id                 || '',
    jobTitle:               d.jobs?.title              || '',
    customerName:           d.jobs?.customers?.full_name || '',
    addressLine1:           d.jobs?.addresses?.line1   || '',
    addressCity:            d.jobs?.addresses?.city    || '',
    addressPostcode:        d.jobs?.addresses?.postcode || '',
    ewtJobRef:              d.ewt_job_ref              || '',
    supplierQuoteRef:       d.supplier_quote_ref       || '',
    surveyor:               d.surveyor                 || '',
    surveyBooked:           d.survey_booked            || false,
    surveyDate:             d.survey_date              || '',
    contactedCustomer:      d.contacted_customer       || false,
    surveyToSupplier:       d.survey_to_supplier       || false,
    checkedSignedOff:       d.checked_signed_off       || false,
    deliveryDateRequested:  d.delivery_date_requested  || '',
    installStart:           d.install_start            || '',
    installEnd:             d.install_end              || '',
    customerNotified:       d.customer_notified        || false,
    depositReceived:        d.deposit_received         || false,
    materialsCost:          d.materials_cost           || 0,
    installationCharge:     d.installation_charge      || 0,
    supplierCharge:         d.supplier_charge          || 0,
    total:                  d.total                    || 0,
    vat:                    d.vat                      || 0,
    nett:                   d.nett                     || 0,
    items:                  (d.order_items || []).map(fromItemCloud),
    createdAt:              d.created_at,
  }
}

function toCloud(d) {
  const nullDate = v => v || null
  const total    = (d.materialsCost || 0) + (d.installationCharge || 0) + (d.supplierCharge || 0)
  const vat      = Math.round(total * 0.2 * 100) / 100
  const nett     = Math.round(total * 0.8 * 100) / 100
  return {
    job_id:                  d.jobId                 || null,
    quote_id:                d.quoteId               || null,
    ewt_job_ref:             d.ewtJobRef             || null,
    supplier_quote_ref:      d.supplierQuoteRef      || null,
    surveyor:                d.surveyor              || null,
    survey_booked:           d.surveyBooked          || false,
    survey_date:             nullDate(d.surveyDate),
    contacted_customer:      d.contactedCustomer     || false,
    survey_to_supplier:      d.surveyToSupplier      || false,
    checked_signed_off:      d.checkedSignedOff      || false,
    delivery_date_requested: nullDate(d.deliveryDateRequested),
    install_start:           nullDate(d.installStart),
    install_end:             nullDate(d.installEnd),
    customer_notified:       d.customerNotified      || false,
    deposit_received:        d.depositReceived       || false,
    materials_cost:          d.materialsCost         || 0,
    installation_charge:     d.installationCharge    || 0,
    supplier_charge:         d.supplierCharge        || 0,
    total,
    vat,
    nett,
    updated_at:              new Date().toISOString(),
  }
}

export function useOrders() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    fetchOrders()
    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, fetchOrders)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select(SELECT)
      .order('created_at', { ascending: false })
    if (error) { setError(error.message); setLoading(false); return }
    setOrders((data || []).map(fromCloud))
    setLoading(false)
  }

  async function createOrder(order) {
    const payload = toCloud(order)
    const { data, error } = await supabase.from('orders').insert(payload).select(SELECT).single()
    if (error) throw error
    const created = fromCloud(data)
    setOrders(prev => [created, ...prev])
    return created
  }

  async function updateOrder(updated) {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
    const { data, error } = await supabase.from('orders').update(toCloud(updated)).eq('id', updated.id).select(SELECT).single()
    if (error) { fetchOrders(); throw error }
    const fresh = data ? fromCloud(data) : updated
    setOrders(prev => prev.map(o => o.id === fresh.id ? fresh : o))
    return fresh
  }

  async function deleteOrder(id) {
    setOrders(prev => prev.filter(o => o.id !== id))
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) { fetchOrders(); throw error }
  }

  return { orders, loading, error, createOrder, updateOrder, deleteOrder }
}
