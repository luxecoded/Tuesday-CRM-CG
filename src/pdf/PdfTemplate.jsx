import { Document, Page, Text, View } from '@react-pdf/renderer'
import { styles } from './styles.js'

const COMPANY = {
  name:    'Elite Windows',
  address: '123 Example Street, London, EC1A 1BB',
  phone:   '020 7000 0000',
  email:   'info@elitewindows.co.uk',
}

function Header({ title, reference, status }) {
  return (
    <View style={styles.headerRow}>
      <View>
        <Text style={styles.companyName}>{COMPANY.name}</Text>
        <Text style={styles.companyDetail}>{COMPANY.address}</Text>
        <Text style={styles.companyDetail}>{COMPANY.phone}  ·  {COMPANY.email}</Text>
      </View>
      <View style={styles.docTitleBlock}>
        <Text style={styles.docTitle}>{title}</Text>
        {reference ? <Text style={styles.docRef}>{reference}</Text> : null}
        {status    ? <Text style={styles.docStatus}>{status}</Text>  : null}
      </View>
    </View>
  )
}

function InfoGrid({ fields }) {
  return (
    <View style={styles.infoGrid}>
      {fields.map((f, i) => (
        <View key={i} style={styles.infoCell}>
          <Text style={styles.infoLabel}>{f.label}</Text>
          <Text style={styles.infoValue}>{f.value || '—'}</Text>
        </View>
      ))}
    </View>
  )
}

function ItemsTable({ columns, rows }) {
  const colWidths = columns.map(c => c.width || `${Math.floor(100 / columns.length)}%`)

  return (
    <View style={styles.table}>
      <View style={styles.tableHeaderRow}>
        {columns.map((col, i) => (
          <Text key={i} style={[styles.tableHeaderCell, { width: colWidths[i], textAlign: col.align || 'left' }]}>
            {col.label}
          </Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={[styles.tableRow, ri % 2 === 1 ? styles.tableRowAlt : {}]}>
          {columns.map((col, ci) => (
            <Text key={ci} style={[styles.tableCell, { width: colWidths[ci], textAlign: col.align || 'left' }]}>
              {row[ci] ?? '—'}
            </Text>
          ))}
        </View>
      ))}
    </View>
  )
}

function Totals({ totals }) {
  return (
    <View style={styles.totalsBlock}>
      {totals.map((t, i) => (
        <View key={i} style={[styles.totalRow, t.bold ? styles.totalRowBold : {}]}>
          <Text style={[styles.totalLabel, t.bold ? styles.totalLabelBold : {}]}>{t.label}</Text>
          <Text style={[styles.totalValue, t.bold ? styles.totalValueBold : {}]}>{t.value}</Text>
        </View>
      ))}
    </View>
  )
}

function Notes({ text }) {
  if (!text) return null
  return (
    <View>
      <Text style={styles.sectionHeading}>Notes</Text>
      <View style={styles.notesBox}>
        <Text style={styles.notesText}>{text}</Text>
      </View>
    </View>
  )
}

function Footer({ generatedAt }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{COMPANY.name}</Text>
      <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      <Text style={styles.footerText}>Generated {generatedAt}</Text>
    </View>
  )
}

/**
 * Generic PDF template. Accepts a document descriptor produced by any mapper.
 *
 * docData shape:
 * {
 *   title:      string            — document heading (e.g. 'QUOTATION')
 *   reference:  string            — ref shown top-right (e.g. 'EWT-2025-001')
 *   status:     string            — optional status badge
 *   infoFields: [{ label, value }]
 *   columns:    [{ label, width, align }]
 *   rows:       string[][]        — each row is an array aligned to columns
 *   totals:     [{ label, value, bold }]
 *   notes:      string            — optional free-text block
 * }
 */
export default function PdfTemplate({ docData }) {
  const generatedAt = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header title={docData.title} reference={docData.reference} status={docData.status} />
        {docData.infoFields?.length > 0 && <InfoGrid fields={docData.infoFields} />}
        {docData.columns?.length > 0 && docData.rows?.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Items</Text>
            <ItemsTable columns={docData.columns} rows={docData.rows} />
          </>
        )}
        {docData.totals?.length > 0 && <Totals totals={docData.totals} />}
        <Notes text={docData.notes} />
        <Footer generatedAt={generatedAt} />
      </Page>
    </Document>
  )
}
