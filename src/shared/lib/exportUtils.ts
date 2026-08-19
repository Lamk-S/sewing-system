import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Exporta un arreglo de objetos a un archivo Excel (.xlsx) de forma segura
 */
export const exportToExcel = async <T extends Record<string, unknown>>(data: T[], filename: string) => {
  if (data.length === 0) return

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Reporte')

  // Extraer las cabeceras dinámicamente del primer objeto
  const headers = Object.keys(data[0])
  worksheet.columns = headers.map(header => ({
    header: header.toUpperCase(),
    key: header,
    width: 20
  }))

  // Agregar filas
  data.forEach(row => {
    worksheet.addRow(row)
  })

  // Dar formato a la cabecera
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }

  // Generar y descargar el archivo
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `${filename}.xlsx`)
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