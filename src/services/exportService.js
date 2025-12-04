import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

/**
 * Export Service - CSV and PDF export functionality
 */

// Export data to CSV
export const exportToCSV = (data, filename = 'export') => {
  try {
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

    // Generate CSV
    const csv = XLSX.utils.sheet_to_csv(worksheet)

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Error exporting to CSV:', error)
    throw error
  }
}

// Export data to Excel
export const exportToExcel = (data, filename = 'export') => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

    XLSX.writeFile(workbook, `${filename}.xlsx`)
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    throw error
  }
}

// Export data to PDF
export const exportToPDF = (data, options = {}) => {
  try {
    const {
      filename = 'export',
      title = 'Report',
      columns = [],
      orientation = 'portrait'
    } = options

    const doc = new jsPDF(orientation, 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const startY = 30
    let yPos = startY

    // Title
    doc.setFontSize(18)
    doc.text(title, margin, yPos)
    yPos += 10

    // Date
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos)
    yPos += 15

    // Table headers
    if (columns.length > 0 && data.length > 0) {
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'bold')

      const colWidth = (pageWidth - 2 * margin) / columns.length
      let xPos = margin

      columns.forEach((col, index) => {
        doc.text(col.header, xPos, yPos)
        xPos += colWidth
      })

      yPos += 8
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, yPos, pageWidth - margin, yPos)
      yPos += 5

      // Table data
      doc.setFont(undefined, 'normal')
      doc.setFontSize(10)

      data.forEach((row, rowIndex) => {
        if (yPos > pageHeight - 30) {
          doc.addPage()
          yPos = startY
        }

        xPos = margin
        columns.forEach((col, colIndex) => {
          const value = col.accessor ? col.accessor(row) : row[col.key] || ''
          doc.text(String(value).substring(0, 30), xPos, yPos)
          xPos += colWidth
        })

        yPos += 7

        // Row separator
        if (rowIndex < data.length - 1) {
          doc.setDrawColor(240, 240, 240)
          doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2)
        }
      })
    } else {
      // Simple list format
      doc.setFontSize(12)
      data.forEach((item, index) => {
        if (yPos > pageHeight - 30) {
          doc.addPage()
          yPos = startY
        }

        const text = Object.entries(item)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')

        doc.text(text.substring(0, 80), margin, yPos)
        yPos += 8
      })
    }

    // Save
    doc.save(`${filename}.pdf`)
  } catch (error) {
    console.error('Error exporting to PDF:', error)
    throw error
  }
}

// Export reports to CSV
export const exportReportsToCSV = (reports) => {
  const data = reports.map(report => ({
    'ID': report.id,
    'Title': report.title,
    'Description': report.description,
    'Severity': report.severity,
    'Status': report.status || 'pending',
    'Location': report.location 
      ? `${report.location.latitude}, ${report.location.longitude}`
      : 'N/A',
    'Created At': report.createdAt 
      ? new Date(report.createdAt).toLocaleString()
      : 'N/A',
    'Updated At': report.updatedAt
      ? new Date(report.updatedAt).toLocaleString()
      : 'N/A'
  }))

  exportToCSV(data, 'reports')
}

// Export reports to PDF
export const exportReportsToPDF = (reports) => {
  const data = reports.map(report => ({
    id: report.id,
    title: report.title,
    severity: report.severity,
    status: report.status || 'pending',
    createdAt: report.createdAt 
      ? new Date(report.createdAt).toLocaleString()
      : 'N/A'
  }))

  exportToPDF(data, {
    filename: 'reports',
    title: 'Drain Reports',
    columns: [
      { key: 'id', header: 'ID', accessor: (row) => row.id.substring(0, 8) },
      { key: 'title', header: 'Title', accessor: (row) => row.title },
      { key: 'severity', header: 'Severity', accessor: (row) => row.severity },
      { key: 'status', header: 'Status', accessor: (row) => row.status },
      { key: 'createdAt', header: 'Created', accessor: (row) => row.createdAt }
    ]
  })
}

// Export sensors to CSV
export const exportSensorsToCSV = (sensors) => {
  const data = sensors.map(sensor => ({
    'ID': sensor.id,
    'Name': sensor.name || 'Unnamed',
    'Location': sensor.location || 'N/A',
    'Status': sensor.status || 'inactive',
    'Water Level': sensor.waterLevel !== undefined ? `${sensor.waterLevel}%` : 'N/A',
    'Flow Rate': sensor.flowRate !== undefined ? `${sensor.flowRate} L/min` : 'N/A',
    'Temperature': sensor.temperature !== undefined ? `${sensor.temperature}°C` : 'N/A',
    'Created At': sensor.createdAt 
      ? new Date(sensor.createdAt).toLocaleString()
      : 'N/A'
  }))

  exportToCSV(data, 'sensors')
}

