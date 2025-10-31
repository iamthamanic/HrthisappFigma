/**
 * @file BrowoKo_DocumentViewDialog.tsx
 * @version 4.4.3
 * @description Dialog to view documents in-app instead of opening new tab
 * 
 * Features:
 * - View PDFs directly in dialog (iframe)
 * - View images directly
 * - Fallback for unsupported types
 * - Download button
 * - Close button
 */

import { X, Download, AlertCircle } from '../components/icons/BrowoKoIcons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';

interface DocumentViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentUrl: string | null;
  documentName: string;
  mimeType?: string;
  onDownload?: () => void;
}

export function DocumentViewDialog({
  open,
  onOpenChange,
  documentUrl,
  documentName,
  mimeType,
  onDownload
}: DocumentViewDialogProps) {
  
  // Determine if document can be previewed
  const canPreview = mimeType?.startsWith('image/') || mimeType === 'application/pdf';
  const isImage = mimeType?.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900 truncate pr-4">
              {documentName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {onDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownload}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          {!documentUrl ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Dokument wird geladen...</p>
              </div>
            </div>
          ) : canPreview ? (
            <>
              {isImage && (
                <div className="flex items-center justify-center h-full p-4">
                  <img
                    src={documentUrl}
                    alt={documentName}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              )}
              
              {isPdf && (
                <iframe
                  src={documentUrl}
                  className="w-full h-full border-0"
                  title={documentName}
                />
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center max-w-md">
                <Alert variant="default" className="mb-4">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Vorschau für diesen Dateityp nicht verfügbar.
                  </AlertDescription>
                </Alert>
                <p className="text-gray-600 mb-6">
                  Dieser Dateityp kann nicht direkt angezeigt werden.
                  Bitte lade die Datei herunter.
                </p>
                {onDownload && (
                  <Button onClick={onDownload} className="gap-2">
                    <Download className="w-4 h-4" />
                    Dokument herunterladen
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
