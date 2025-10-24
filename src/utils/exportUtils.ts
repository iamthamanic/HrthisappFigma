/**
 * Export Utilities for HRthis
 * Provides CSV, Excel, and PDF export functionality
 */

import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import * as XLSX from 'xlsx';

// ============================================
// CSV EXPORT
// ============================================

export interface TimeRecordExport {
  date: string;
  time_in: string | null;
  time_out: string | null;
  break_minutes: number;
  total_hours: number | null;
  notes?: string;
}

/**
 * Export time records to CSV
 */
export function exportTimeRecordsToCSV(records: TimeRecordExport[], filename?: string) {
  // CSV Headers
  const headers = [
    'Datum',
    'Beginn',
    'Ende',
    'Pause (Min)',
    'Gesamtstunden',
    'Notizen'
  ];

  // CSV Rows
  const rows = records.map(record => [
    format(new Date(record.date), 'dd.MM.yyyy', { locale: de }),
    record.time_in || '-',
    record.time_out || '-',
    record.break_minutes?.toString() || '0',
    record.total_hours?.toFixed(2) || '-',
    record.notes || ''
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create Blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `zeiterfassung_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export generic data to CSV
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  headers: { key: keyof T; label: string }[],
  filename: string
) {
  // CSV Headers
  const headerRow = headers.map(h => h.label);

  // CSV Rows
  const rows = data.map(item =>
    headers.map(h => {
      const value = item[h.key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    })
  );

  // Combine
  const csvContent = [
    headerRow.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================
// PDF EXPORT (using jsPDF)
// ============================================

/**
 * Export time records to PDF
 * Note: This is a simple implementation. For production, consider using a proper PDF library.
 */
export function exportTimeRecordsToPDF(records: TimeRecordExport[], filename?: string) {
  // Create HTML for PDF
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        h1 {
          color: #333;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #3b82f6;
          color: white;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .summary {
          margin-top: 20px;
          padding: 15px;
          background-color: #eff6ff;
          border-radius: 8px;
        }
      </style>
    </head>
    <body>
      <h1>Zeiterfassung - Export</h1>
      <p><strong>Zeitraum:</strong> ${format(new Date(records[0]?.date || new Date()), 'dd.MM.yyyy', { locale: de })} - ${format(new Date(records[records.length - 1]?.date || new Date()), 'dd.MM.yyyy', { locale: de })}</p>
      <p><strong>Erstellt am:</strong> ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr</p>
      
      <table>
        <thead>
          <tr>
            <th>Datum</th>
            <th>Beginn</th>
            <th>Ende</th>
            <th>Pause (Min)</th>
            <th>Gesamtstunden</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(record => `
            <tr>
              <td>${format(new Date(record.date), 'dd.MM.yyyy', { locale: de })}</td>
              <td>${record.time_in || '-'}</td>
              <td>${record.time_out || '-'}</td>
              <td>${record.break_minutes || 0}</td>
              <td>${record.total_hours?.toFixed(2) || '-'} h</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="summary">
        <h3>Zusammenfassung</h3>
        <p><strong>Gesamtstunden:</strong> ${records.reduce((sum, r) => sum + (r.total_hours || 0), 0).toFixed(2)} h</p>
        <p><strong>Arbeitstage:</strong> ${records.length}</p>
        <p><strong>Durchschnitt pro Tag:</strong> ${(records.reduce((sum, r) => sum + (r.total_hours || 0), 0) / records.length).toFixed(2)} h</p>
      </div>
      
      <div class="footer">
        <p>HRthis - Zeiterfassung Export | Generiert am ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr</p>
      </div>
    </body>
    </html>
  `;

  // Create a new window and print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

// ============================================
// iCAL EXPORT (for Calendar)
// ============================================

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
}

/**
 * Export calendar events to iCal format
 */
export function exportToICalendar(events: CalendarEvent[], filename?: string) {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HRthis//Calendar//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events.flatMap(event => [
      'BEGIN:VEVENT',
      `UID:${event.id}@hrthis.app`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(event.start)}`,
      `DTEND:${formatDate(event.end)}`,
      `SUMMARY:${event.title}`,
      event.description ? `DESCRIPTION:${event.description}` : '',
      event.location ? `LOCATION:${event.location}` : '',
      'END:VEVENT'
    ]).filter(Boolean),
    'END:VCALENDAR'
  ].join('\r\n');

  // Download
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `kalender_${format(new Date(), 'yyyy-MM-dd')}.ics`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================
// EXCEL EXPORT (for Employee Data)
// ============================================

/**
 * Export data to Excel file with formatting
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  filename: string,
  sheetName: string = 'Data'
) {
  // Prepare data with headers
  const exportData = [
    columns.map(col => col.label), // Header row
    ...data.map(item => 
      columns.map(col => {
        const value = item[col.key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
        if (value instanceof Date) return format(value, 'dd.MM.yyyy', { locale: de });
        return value;
      })
    )
  ];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(exportData);

  // Set column widths
  const colWidths = columns.map(() => ({ wch: 15 }));
  ws['!cols'] = colWidths;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Download
  XLSX.writeFile(wb, filename);
}

// ============================================
// EMPLOYEE DATA FORMATTING
// ============================================

export interface EmployeeExportData {
  employee_number: string | null;
  first_name: string;
  last_name: string;
  email: string;
  private_email: string | null;
  phone: string | null;
  position: string | null;
  department: string | null;
  location: string | null;
  role: string;
  employment_type: string | null;
  weekly_hours: number;
  vacation_days: number;
  start_date: string | null;
  is_active: boolean;
  street_address: string | null;
  postal_code: string | null;
  city: string | null;
  shirt_size: string | null;
  pants_size: string | null;
  shoe_size: string | null;
  jacket_size: string | null;
}

/**
 * Format user data for export
 */
export function formatUserDataForExport(
  users: any[],
  locations: any[]
): EmployeeExportData[] {
  return users.map(user => {
    const location = locations.find(l => l.id === user.location_id);
    
    return {
      employee_number: user.employee_number,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      private_email: user.private_email,
      phone: user.phone,
      position: user.position,
      department: user.department,
      location: location?.name || null,
      role: user.role,
      employment_type: user.employment_type,
      weekly_hours: user.weekly_hours,
      vacation_days: user.vacation_days,
      start_date: user.start_date,
      is_active: user.is_active,
      street_address: user.street_address,
      postal_code: user.postal_code,
      city: user.city,
      shirt_size: user.shirt_size,
      pants_size: user.pants_size,
      shoe_size: user.shoe_size,
      jacket_size: user.jacket_size,
    };
  });
}
