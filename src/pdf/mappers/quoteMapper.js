function fmt(val) {
  if (!val && val !== 0) return '—'
  return `£${Number(val).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDim(mm) {
  return mm ? `${mm}mm` : '—'
}

const STATUS_LABELS = {
  draft:    'Draft',
  sent:     'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
}

/**
 * Maps a quote object (from useQuotes) into a generic PdfTemplate docData descriptor.
 */
export function mapQuote(quote) {
  const date = quote.createdAt
    ? new Date(quote.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const infoFields = [
    { label: 'Customer',     value: quote.customerName  || '—' },
    { label: 'Quote Ref',    value: quote.ewtQuoteRef   || '—' },
    { label: 'Address',      value: [quote.addressLine1, quote.addressCity].filter(Boolean).join(', ') || '—' },
    { label: 'Date',         value: date },
    { label: 'Job',          value: quote.jobTitle       || '—' },
    { label: 'Origin',       value: quote.origin         || '—' },
    { label: 'Supplier',     value: quote.supplierName   || '—' },
    { label: 'Supplier Ref', value: quote.supplierReference || '—' },
  ]

  const columns = [
    { label: 'Product',      width: '30%' },
    { label: 'Qty',          width: '6%',  align: 'center' },
    { label: 'Width',        width: '9%',  align: 'right' },
    { label: 'Height',       width: '9%',  align: 'right' },
    { label: 'Frame',        width: '16%' },
    { label: 'Glass',        width: '15%' },
    { label: 'Price',        width: '15%', align: 'right' },
  ]

  const rows = (quote.items || []).map(item => [
    item.productName  || '—',
    String(item.quantity ?? 1),
    fmtDim(item.width),
    fmtDim(item.height),
    item.frameColour  || '—',
    item.glassType    || '—',
    fmt(item.salePrice),
  ])

  const totals = [
    { label: 'EWT Value',      value: fmt(quote.ewtValue) },
    { label: 'Supplier Value', value: fmt(quote.supplierValue) },
    { label: 'Total',          value: fmt(quote.total), bold: true },
  ]

  const reference = quote.ewtQuoteRef ? `Ref: ${quote.ewtQuoteRef}` : undefined
  const status    = STATUS_LABELS[quote.status] || quote.status

  return {
    title:      'QUOTATION',
    reference,
    status,
    infoFields,
    columns,
    rows,
    totals,
  }
}

export function quoteFilename(quote) {
  const ref = quote.ewtQuoteRef || quote.id?.slice(0, 8) || 'quote'
  return `EWT-${ref}-quotation.pdf`
}
