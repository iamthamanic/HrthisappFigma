/**
 * @file BrowoKo_CalendarExportDialog.tsx
 * @domain BrowoKo - Calendar Export
 * @description Dialog for selecting date range before export
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Calendar, Download } from './icons/BrowoKoIcons';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface CalendarExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportType: 'csv' | 'pdf' | null;
  onExport: (startDate: string, endDate: string) => void;
}

export function CalendarExportDialog({
  open,
  onOpenChange,
  exportType,
  onExport,
}: CalendarExportDialogProps) {
  // Default: Current month
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState(format(firstDayOfMonth, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(lastDayOfMonth, 'yyyy-MM-dd'));

  const handleExport = () => {
    onExport(startDate, endDate);
    onOpenChange(false);
  };

  const getTitle = () => {
    switch (exportType) {
      case 'csv':
        return 'CSV Export';
      case 'pdf':
        return 'PDF Export';
      default:
        return 'Export';
    }
  };

  const getDescription = () => {
    switch (exportType) {
      case 'csv':
        return 'Wählen Sie den Zeitraum für den CSV-Export aus';
      case 'pdf':
        return 'Wählen Sie den Zeitraum für den PDF-Export aus';
      default:
        return 'Wählen Sie den Zeitraum aus';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="form-card">
          <div className="form-grid">
            {/* Start Date */}
            <div className="form-field">
              <label className="form-label">
                <Calendar className="w-4 h-4" />
                Von Datum
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
              />
            </div>

            {/* End Date */}
            <div className="form-field">
              <label className="form-label">
                <Calendar className="w-4 h-4" />
                Bis Datum
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Zeitraum: </span>
              {format(new Date(startDate), 'dd. MMMM yyyy', { locale: de })} -{' '}
              {format(new Date(endDate), 'dd. MMMM yyyy', { locale: de })}
            </p>
          </div>

          {/* Actions */}
          <div className="form-footer">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              onClick={handleExport}
              disabled={!startDate || !endDate || startDate > endDate}
            >
              <Download className="w-4 h-4 mr-2" />
              {exportType === 'csv' ? 'CSV Exportieren' : 'PDF Exportieren'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
