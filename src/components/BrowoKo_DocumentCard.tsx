import { memo, useMemo, useCallback } from 'react';
import { FileText, Download, Trash2, Calendar as CalendarIcon, File, Eye, Heart, UserCircle, Briefcase, Award } from './icons/BrowoKoIcons';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface DocumentCardProps {
  document: {
    id: string;
    title: string;
    category: 'LOHN' | 'VERTRAG' | 'ZERTIFIKAT' | 'AU' | 'PERSONALDOKUMENTE' | 'BEWERBUNGSUNTERLAGEN' | 'SONSTIGES';
    file_name: string;
    file_size: number | null;
    uploaded_at: string;
  };
  onView: () => void; // NEW: View document
  onDownload: () => void;
  onDelete: () => void;
}

const categoryConfig = {
  VERTRAG: {
    label: 'Verträge',
    icon: FileText,
    color: 'bg-blue-100 text-blue-600',
    badgeColor: 'bg-blue-100 text-blue-700'
  },
  ZERTIFIKAT: {
    label: 'Zertifikate',
    icon: Award,
    color: 'bg-purple-100 text-purple-600',
    badgeColor: 'bg-purple-100 text-purple-700'
  },
  LOHN: {
    label: 'Gehaltsabrechnungen',
    icon: CalendarIcon,
    color: 'bg-green-100 text-green-600',
    badgeColor: 'bg-green-100 text-green-700'
  },
  AU: {
    label: 'AU',
    icon: Heart,
    color: 'bg-red-100 text-red-600',
    badgeColor: 'bg-red-100 text-red-700'
  },
  PERSONALDOKUMENTE: {
    label: 'Personaldokumente',
    icon: UserCircle,
    color: 'bg-indigo-100 text-indigo-600',
    badgeColor: 'bg-indigo-100 text-indigo-700'
  },
  BEWERBUNGSUNTERLAGEN: {
    label: 'Bewerbungsunterlagen',
    icon: Briefcase,
    color: 'bg-orange-100 text-orange-600',
    badgeColor: 'bg-orange-100 text-orange-700'
  },
  SONSTIGES: {
    label: 'Sonstiges',
    icon: File,
    color: 'bg-gray-100 text-gray-600',
    badgeColor: 'bg-gray-100 text-gray-700'
  },
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const DocumentCard = memo(function DocumentCard({ document, onView, onDownload, onDelete }: DocumentCardProps) {
  const config = categoryConfig[document.category] || categoryConfig.SONSTIGES;
  const Icon = config.icon;
  
  // Memoize file size calculation
  const fileSize = useMemo(() => formatFileSize(document.file_size), [document.file_size]);
  
  // Memoize date formatting
  const uploadDate = useMemo(() => 
    format(new Date(document.uploaded_at), 'dd. MMM yyyy', { locale: de }),
    [document.uploaded_at]
  );
  
  // Memoize event handlers
  const handleView = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onView();
  }, [onView]);
  
  const handleDownload = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload();
  }, [onDownload]);
  
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  }, [onDelete]);

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{document.title}</p>
            <Badge variant="secondary" className={config.badgeColor}>
              {config.label}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
            <span>{document.file_name}</span>
            <span>•</span>
            <span>{fileSize}</span>
            <span>•</span>
            <span>
              Hochgeladen: {uploadDate}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* NEW: Ansicht Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleView}
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden md:inline">Ansicht</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          <span className="hidden md:inline">Download</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden md:inline">Löschen</span>
        </Button>
      </div>
    </div>
  );
});
