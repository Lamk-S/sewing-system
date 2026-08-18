import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Exporta un arreglo de objetos a un archivo Excel (.xlsx)
 */
export const exportToExcel = <T extends Record<string, unknown>>(data: T[], filename: string) => {
  if (data.length === 0) return

  // Convierte el JSON a una hoja de cálculo
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte')
  
  // Fuerza la descarga
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

/**
 * Exporta un arreglo de objetos a PDF con formato tabular
 */
export const exportToPDF = <T extends Record<string, unknown>>(
  data: T[], 
  columns: { header: string, dataKey: Extract<keyof T, string> }[], 
  filename: string, 
  title: string
) => {
  if (data.length === 0) return

  const doc = new jsPDF()

  // Título del documento
  doc.setFontSize(16)
  doc.setTextColor(30, 58, 95)
  doc.text(title, 14, 15)
  
  // Subtítulo con fecha
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generado el: ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`, 14, 22)

  // Mapear los datos según las columnas definidas
  const tableData = data.map(row => 
    columns.map(col => {
      const val = row[col.dataKey]
      if (typeof val === 'number' && (col.header.includes('Ganado') || col.header.includes('Precio'))) {
        return `$${val.toFixed(2)}`
      }
      return val as string | number
    })
  )

  const headers = columns.map(col => col.header)

  autoTable(doc, {
    startY: 28,
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 95] },
    styles: { fontSize: 9, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  })

  doc.save(`${filename}.pdf`)
}