import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { ScrollArea } from './ui/scroll-area';
import { Download, FileSpreadsheet, FileText } from './icons/HRTHISIcons';
import { User, Location, Department } from '../types/database';

export interface ExportColumn {
  key: string;
  label: string;
  default: boolean;
}

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: User[];
  locations: Location[];
  departments: Department[];
  onExport: (format: 'csv' | 'excel', columns: string[], filename: string) => void;
}

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'employee_number', label: 'Personalnummer', default: true },
  { key: 'first_name', label: 'Vorname', default: true },
  { key: 'last_name', label: 'Nachname', default: true },
  { key: 'email', label: 'E-Mail (Arbeit)', default: true },
  { key: 'private_email', label: 'E-Mail (Privat)', default: false },
  { key: 'phone', label: 'Telefon', default: true },
  { key: 'position', label: 'Position', default: true },
  { key: 'department', label: 'Abteilung', default: true },
  { key: 'location', label: 'Standort', default: true },
  { key: 'employment_type', label: 'Beschäftigungsart', default: true },
  { key: 'weekly_hours', label: 'Wochenstunden', default: true },
  { key: 'vacation_days', label: 'Urlaubstage', default: true },
  { key: 'start_date', label: 'Eintrittsdatum', default: false },
  { key: 'role', label: 'Rolle', default: true },
  { key: 'is_active', label: 'Status', default: true },
  { key: 'street_address', label: 'Straße', default: false },
  { key: 'postal_code', label: 'PLZ', default: false },
  { key: 'city', label: 'Stadt', default: false },
  { key: 'shirt_size', label: 'T-Shirt Größe', default: false },
  { key: 'pants_size', label: 'Hosen Größe', default: false },
  { key: 'shoe_size', label: 'Schuh Größe', default: false },
  { key: 'jacket_size', label: 'Jacken Größe', default: false },
];

export default function ExportDialog({
  isOpen,
  onClose,
  data,
  locations,
  departments,
  onExport,
}: ExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'excel'>('excel');
  const [filename, setFilename] = useState(`mitarbeiter_export_${new Date().toISOString().split('T')[0]}`);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    EXPORT_COLUMNS.filter(col => col.default).map(col => col.key)
  );

  const handleToggleColumn = (key: string) => {
    setSelectedColumns(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    setSelectedColumns(EXPORT_COLUMNS.map(col => col.key));
  };

  const handleDeselectAll = () => {
    setSelectedColumns([]);
  };

  const handleExport = () => {
    const fileExtension = format === 'csv' ? '.csv' : '.xlsx';
    const fullFilename = filename.endsWith(fileExtension) ? filename : `${filename}${fileExtension}`;
    onExport(format, selectedColumns, fullFilename);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Mitarbeiterdaten exportieren
          </DialogTitle>
          <DialogDescription>
            Exportiere {data.length} Mitarbeiter in CSV oder Excel Format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-hidden">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export-Format</Label>
            <RadioGroup value={format} onValueChange={(value: 'csv' | 'excel') => setFormat(value)}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  <div>
                    <p>Excel (.xlsx)</p>
                    <p className="text-xs text-gray-500">Mit Formatierung und Spaltenbreiten</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <p>CSV (.csv)</p>
                    <p className="text-xs text-gray-500">Kompatibel mit allen Programmen</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename">Dateiname</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="mitarbeiter_export"
            />
          </div>

          {/* Column Selection */}
          <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
              <Label>Zu exportierende Spalten ({selectedColumns.length}/{EXPORT_COLUMNS.length})</Label>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs h-7"
                >
                  Alle auswählen
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="text-xs h-7"
                >
                  Keine
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg p-4">
              <div className="space-y-2">
                {EXPORT_COLUMNS.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.key}
                      checked={selectedColumns.includes(column.key)}
                      onCheckedChange={() => handleToggleColumn(column.key)}
                    />
                    <Label
                      htmlFor={column.key}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Preview Info */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Vorschau:</strong> {data.length} Zeilen × {selectedColumns.length} Spalten = {data.length * selectedColumns.length} Zellen
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleExport}
            disabled={selectedColumns.length === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
