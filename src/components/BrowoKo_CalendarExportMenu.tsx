import { Button } from './ui/button';
import { Download, FileText, Calendar } from './icons/BrowoKoIcons';

interface CalendarExportMenuProps {
  onExportCSV: () => void;
  onExportPDF: () => void;
  onExportICal: () => void;
}

export function CalendarExportMenu({
  onExportCSV,
  onExportPDF,
  onExportICal
}: CalendarExportMenuProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onExportCSV}>
        <Download className="w-4 h-4 mr-2" />
        CSV
      </Button>
      <Button variant="outline" size="sm" onClick={onExportPDF}>
        <FileText className="w-4 h-4 mr-2" />
        PDF
      </Button>
      <Button variant="outline" size="sm" onClick={onExportICal}>
        <Calendar className="w-4 h-4 mr-2" />
        iCal
      </Button>
    </div>
  );
}
