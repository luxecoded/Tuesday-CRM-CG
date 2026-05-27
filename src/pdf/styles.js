import { StyleSheet } from '@react-pdf/renderer'

export const colors = {
  brand:      '#166534',  // green-800
  brandLight: '#dcfce7',  // green-100
  ink:        '#111827',
  inkSoft:    '#374151',
  inkMuted:   '#6b7280',
  inkFaint:   '#9ca3af',
  border:     '#e5e7eb',
  rowAlt:     '#f9fafb',
  white:      '#ffffff',
}

export const styles = StyleSheet.create({
  page: {
    fontFamily:  'Helvetica',
    fontSize:    9,
    color:       colors.ink,
    paddingTop:  36,
    paddingBottom: 48,
    paddingHorizontal: 40,
  },

  // ── Header ───────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: colors.brand,
  },
  companyName: {
    fontSize:   20,
    fontFamily: 'Helvetica-Bold',
    color:      colors.brand,
    marginBottom: 3,
  },
  companyDetail: {
    fontSize: 8,
    color:    colors.inkMuted,
    lineHeight: 1.5,
  },
  docTitleBlock: {
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize:   16,
    fontFamily: 'Helvetica-Bold',
    color:      colors.ink,
    letterSpacing: 1.5,
  },
  docRef: {
    fontSize:  9,
    color:     colors.inkSoft,
    marginTop: 4,
  },
  docStatus: {
    marginTop:    5,
    paddingVertical:   2,
    paddingHorizontal: 7,
    backgroundColor:   colors.brandLight,
    borderRadius: 3,
    fontSize: 8,
    color:    colors.brand,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Info grid ─────────────────────────────────────────────────
  infoGrid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    marginBottom:   16,
    gap:            0,
  },
  infoCell: {
    width:         '50%',
    marginBottom:  8,
  },
  infoLabel: {
    fontSize:  7,
    color:     colors.inkFaint,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom:  2,
  },
  infoValue: {
    fontSize: 9,
    color:    colors.inkSoft,
  },

  // ── Section heading ───────────────────────────────────────────
  sectionHeading: {
    fontSize:     8,
    fontFamily:   'Helvetica-Bold',
    color:        colors.brand,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom:  6,
    marginTop:     4,
  },

  // ── Table ─────────────────────────────────────────────────────
  table: {
    marginBottom: 12,
  },
  tableHeaderRow: {
    flexDirection:   'row',
    backgroundColor: colors.brand,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 2,
  },
  tableHeaderCell: {
    fontSize:   7.5,
    fontFamily: 'Helvetica-Bold',
    color:      colors.white,
  },
  tableRow: {
    flexDirection:    'row',
    paddingVertical:  5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: colors.rowAlt,
  },
  tableCell: {
    fontSize: 8.5,
    color:    colors.inkSoft,
  },

  // ── Totals ────────────────────────────────────────────────────
  totalsBlock: {
    alignItems:   'flex-end',
    marginTop:    8,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom:  4,
    minWidth:      180,
  },
  totalLabel: {
    fontSize:  8.5,
    color:     colors.inkMuted,
    width:     100,
    textAlign: 'right',
    marginRight: 12,
  },
  totalValue: {
    fontSize:  8.5,
    color:     colors.inkSoft,
    width:     70,
    textAlign: 'right',
  },
  totalRowBold: {
    borderTopWidth: 1.5,
    borderTopColor: colors.brand,
    paddingTop:     5,
    marginTop:      2,
  },
  totalLabelBold: {
    fontFamily: 'Helvetica-Bold',
    color:      colors.ink,
    fontSize:   9.5,
  },
  totalValueBold: {
    fontFamily: 'Helvetica-Bold',
    color:      colors.ink,
    fontSize:   9.5,
  },

  // ── Notes ─────────────────────────────────────────────────────
  notesBox: {
    backgroundColor: colors.rowAlt,
    borderWidth:     1,
    borderColor:     colors.border,
    borderRadius:    3,
    padding:         10,
    marginBottom:    16,
  },
  notesText: {
    fontSize:  8.5,
    color:     colors.inkSoft,
    lineHeight: 1.5,
  },

  // ── Footer ────────────────────────────────────────────────────
  footer: {
    position:   'absolute',
    bottom:     24,
    left:       40,
    right:      40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop:     6,
  },
  footerText: {
    fontSize: 7.5,
    color:    colors.inkFaint,
  },
})
