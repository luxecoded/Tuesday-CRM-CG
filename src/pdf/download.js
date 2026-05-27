import { pdf } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'
import { createElement } from 'react'
import PdfTemplate from './PdfTemplate.jsx'

/**
 * Generate and download a PDF from a document descriptor.
 * @param {object} docData  — output of any mapper function
 * @param {string} filename — e.g. 'EWT-001-quote.pdf'
 */
export async function downloadPdf(docData, filename) {
  const element = createElement(PdfTemplate, { docData })
  const blob = await pdf(element).toBlob()
  saveAs(blob, filename)
}
