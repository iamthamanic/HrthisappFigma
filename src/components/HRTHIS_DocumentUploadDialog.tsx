/**
 * @file HRTHIS_DocumentUploadDialog.tsx
 * @domain HR - Document Management
 * @description Dialog for uploading new documents
 * @namespace HRTHIS_
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
import { Upload } from './icons/HRTHISIcons';
import sanitize from '../utils/security/HRTHIS_sanitization';
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dokument hochladen</DialogTitle>
          <DialogDescription>
            Lade ein neues Dokument in deinen persönlichen Bereich hoch
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              placeholder="z.B. Arbeitsvertrag 2024"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="category">Kategorie *</Label>
            <Select
              value={uploadCategory}
              onValueChange={(value) => setUploadCategory(value as 'LOHN' | 'VERTRAG' | 'ZERTIFIKAT' | 'SONSTIGES')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="hrthis-upload-vertrag" value="VERTRAG">Verträge</SelectItem>
                <SelectItem key="hrthis-upload-zertifikat" value="ZERTIFIKAT">Zertifikate</SelectItem>
                <SelectItem key="hrthis-upload-lohn" value="LOHN">Gehaltsabrechnungen</SelectItem>
                <SelectItem key="hrthis-upload-sonstiges" value="SONSTIGES">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="file">Datei auswählen *</Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setUploadFile(file);
                  if (!uploadTitle) {
                    setUploadTitle(file.name.split('.')[0]);
                  }
                }
              }}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <p className="text-xs text-gray-500 mt-1">
              Erlaubte Formate: PDF, Word, Bilder (max. 10 MB)
            </p>
          </div>

          {uploadFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>Ausgewählt:</strong> {uploadFile.name}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Größe: {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={!uploadFile || !uploadTitle || uploading}>
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Wird hochgeladen...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Hochladen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
