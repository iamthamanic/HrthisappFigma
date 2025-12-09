/**
 * @file BrowoKo_DocumentUploadDialog.tsx
 * @domain HR - Document Management
 * @description Dialog for uploading new documents
 * @namespace BrowoKo_
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Upload } from './icons/BrowoKoIcons';
import sanitize from '../utils/security/BrowoKo_sanitization';
import { toast } from 'sonner@2.0.3';

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, title: string, category: 'LOHN' | 'VERTRAG' | 'ZERTIFIKAT' | 'SONSTIGES') => Promise<void>;
  uploading: boolean;
}

export function DocumentUploadDialog({ 
  open, 
  onOpenChange, 
  onUpload, 
  uploading 
}: DocumentUploadDialogProps) {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<'LOHN' | 'VERTRAG' | 'ZERTIFIKAT' | 'SONSTIGES'>('VERTRAG');

  const handleSubmit = async () => {
    if (!uploadFile || !uploadTitle) {
      return;
    }

    // ✅ VALIDATE FILE
    const fileValidation = sanitize.fileUpload(uploadFile, {
      allowedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/jpg',
      ],
      maxSize: 10 * 1024 * 1024, // 10MB
    });

    if (!fileValidation.valid) {
      toast.error(fileValidation.error || 'Ungültige Datei');
      return;
    }

    // ✅ SANITIZE TITLE
    const sanitizedTitle = sanitize.text(uploadTitle);
    
    if (!sanitizedTitle) {
      toast.error('Titel ist erforderlich');
      return;
    }

    // Upload with sanitized data
    await onUpload(uploadFile, sanitizedTitle, uploadCategory);
    
    // Reset form
    setUploadFile(null);
    setUploadTitle('');
    setUploadCategory('VERTRAG');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="form-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Dokument hochladen
          </DialogTitle>
          <DialogDescription>
            Lade ein neues Dokument hoch. Unterstützte Formate: PDF, Word, Excel, Bilder (max. 10 MB)
          </DialogDescription>
        </DialogHeader>

        <div className="form-grid">
          <div className="form-field">
            <Label htmlFor="file" className="form-label">Datei auswählen *</Label>
            <Input
              id="file"
              type="file"
              className="form-input"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              disabled={uploading}
            />
            {file && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded-lg">
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700 flex-1">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            )}
          </div>

          <div className="form-field">
            <Label htmlFor="title" className="form-label">Dokumenttitel *</Label>
            <Input
              id="title"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Arbeitsvertrag 2024"
              disabled={uploading}
            />
          </div>

          <div className="form-field">
            <Label htmlFor="category" className="form-label">Kategorie *</Label>
            <Select value={category} onValueChange={(value: any) => setCategory(value)}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VERTRAG">Vertrag</SelectItem>
                <SelectItem value="ZEUGNIS">Zeugnis</SelectItem>
                <SelectItem value="ZERTIFIKAT">Zertifikat</SelectItem>
                <SelectItem value="ABMAHNUNG">Abmahnung</SelectItem>
                <SelectItem value="KRANKSCHREIBUNG">Krankschreibung</SelectItem>
                <SelectItem value="SONSTIGES">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Upload-Fortschritt</span>
                <span className="font-medium text-blue-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {uploadComplete && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">Dokument erfolgreich hochgeladen!</span>
            </div>
          )}
        </div>

        <div className="form-footer">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            {uploadComplete ? 'Schließen' : 'Abbrechen'}
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={uploading || !file || !title || uploadComplete}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird hochgeladen...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Hochladen
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}