import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function fromCloud(d) {
  return {
    id:                    d.id,
    dealId:                d.deal_id                || '',
    ewtJobRef:             d.ewt_job_ref            || '',
    ewtQuoteRef:           d.ewt_quote_ref          || '',
    supplierQuoteRef:      d.supplier_quote_ref     || '',
    customerName:          d.customer_name          || '',
    installAddress:        d.install_address        || '',
    correspondentAddress:  d.correspondent_address  || '',
    contactNumber:         d.contact_number         || '',
    emailAddress:          d.email_address          || '',
    windowsCount:          d.windows_count          || 0,
    windowsType:           d.windows_type           || '',
    doorsCount:            d.doors_count            || 0,
    doorsType:             d.doors_type             || '',
    totalProduct:          d.total_product          || 0,   // generated
    surveyBooked:          d.survey_booked          || false,
    surveyDate:            d.survey_date            || '',
    contactedCustomer:     d.contacted_customer     || false,
    surveyToSupplier:      d.survey_to_supplier     || false,
    supplierName:          d.supplier_name          || '',
    supplierReference:     d.supplier_reference     || '',
    checkedSignedOff:      d.checked_signed_off     || false,
    deliveryDateRequested: d.delivery_date_requested || '',
    installDate:           d.install_date           || '',
    customerNotified:      d.customer_notified      || false,
    installationCharge:    d.installation_charge    || 0,
    supplierCharge:        d.supplier_charge        || 0,
    total:                 d.total                  || 0,   // generated
    vat:                   d.vat                    || 0,   // generated
    nett:                  d.nett                   || 0,   // generated
    createdAt:             d.created_at,
  }
}

function toCloud(d) {
  const nullDate = v => v || null
  return {
    deal_id:                 d.dealId               || null,
    ewt_job_ref:             d.ewtJobRef            || null,
    ewt_quote_ref:           d.ewtQuoteRef          || null,
    supplier_quote_ref:      d.supplierQuoteRef     || null,
    customer_name:           d.customerName         || null,
    install_address:         d.installAddress       || null,
    correspondent_address:   d.correspondentAddress || null,
    contact_number:          d.contactNumber        || null,
    email_address:           d.emailAddress         || null,
    windows_count:           d.windowsCount         || 0,
    windows_type:            d.windowsType          || null,
    doors_count:             d.doorsCount           || 0,
    doors_type:              d.doorsType            || null,
    survey_booked:           d.surveyBooked         || false,
    survey_date:             nullDate(d.surveyDate),
    contacted_customer:      d.contactedCustomer    || false,
    survey_to_supplier:      d.surveyToSupplier     || false,
    supplier_name:           d.supplierName         || null,
    supplier_reference:      d.supplierReference    || null,
    checked_signed_off:      d.checkedSignedOff     || false,
    delivery_date_requested: nullDate(d.deliveryDateRequested),
    install_date:            nullDate(d.installDate),
    customer_notified:       d.customerNotified     || false,
    installation_charge:     d.installationCharge   || 0,
    supplier_charge:         d.supplierCharge       || 0,
    // total, vat, nett are generated columns — never written
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
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchOrders() {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (error) { setError(error.message); setLoading(false); return }
    setOrders((data || []).map(fromCloud))
    setLoading(false)
  }

  async function createOrder(order) {
    const payload = toCloud(order)
    const { data, error } = await supabase.from('orders').insert(payload).select().single()
    if (error) throw error
    setOrders(prev => [fromCloud(data), ...prev])
    return fromCloud(data)
  }

  async function updateOrder(updated) {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
    const payload = { ...toCloud(updated), id: updated.id }
    const { error } = await supabase.from('orders').upsert(payload)
    if (error) { fetchOrders(); throw error }
  }

  async function deleteOrder(id) {
    setOrders(prev => prev.filter(o => o.id !== id))
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) { fetchOrders(); throw error }
  }

  return { orders, loading, error, createOrder, updateOrder, deleteOrder }
}
