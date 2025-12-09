/**
 * BULK DOCUMENT UPLOAD DIALOG (v3.10.6)
 * Upload multiple documents to multiple users
 * Each document can have its own category
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
import { Upload, X, FileText, Plus } from './icons/BrowoKoIcons';
import { Badge } from './ui/badge';
import sanitize from '../utils/security/BrowoKo_sanitization';
import { toast } from 'sonner@2.0.3';
import type { User } from '../types/database';

// Document categories
type DocumentCategory = 'VERTRAG' | 'ZERTIFIKAT' | 'LOHN' | 'AU' | 'PERSONALDOKUMENTE' | 'BEWERBUNGSUNTERLAGEN' | 'SONSTIGES';

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  VERTRAG: 'Vertrag',
  ZERTIFIKAT: 'Zertifikat',
  LOHN: 'Gehaltsabrechnung',
  AU: 'AU',
  PERSONALDOKUMENTE: 'Personaldokumente',
  BEWERBUNGSUNTERLAGEN: 'Bewerbungsunterlagen',
  SONSTIGES: 'Sonstige',
};

// Document item for multi-upload
interface DocumentItem {
  id: string;
  file: File | null;
  title: string;
  category: DocumentCategory;
}

interface BulkDocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUsers: User[];
  onUpload: (file: File, title: string, category: DocumentCategory, userIds: string[]) => Promise<void>;
  uploading: boolean;
}

export default function BulkDocumentUploadDialog({
  open,
  onOpenChange,
  selectedUsers,
  onUpload,
  uploading,
}: BulkDocumentUploadDialogProps) {
  // Multi-document support
  const [documents, setDocuments] = useState<DocumentItem[]>([
    { id: '1', file: null, title: '', category: 'VERTRAG' as DocumentCategory }
  ]);
  
  const [currentUploadIndex, setCurrentUploadIndex] = useState<number>(-1);

  // Add new document slot
  const addDocument = () => {
    const newId = (documents.length + 1).toString();
    setDocuments([
      ...documents,
      { id: newId, file: null, title: '', category: 'VERTRAG' as DocumentCategory }
    ]);
  };

  // Remove document slot
  const removeDocument = (id: string) => {
    if (documents.length === 1) {
      toast.error('Mindestens ein Dokument muss vorhanden sein');
      return;
    }
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  // Update document field
  const updateDocument = (id: string, field: keyof DocumentItem, value: any) => {
    setDocuments(documents.map(doc =>
      doc.id === id ? { ...doc, [field]: value } : doc
    ));
  };

  const handleSubmit = async () => {
    // Validate all documents
    const validDocuments = documents.filter(doc => doc.file && doc.title);
    
    if (validDocuments.length === 0) {
      toast.error('Bitte füge mindestens ein Dokument mit Titel und Datei hinzu');
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error('Keine Mitarbeiter ausgewählt');
      return;
    }

    // Validate files
    for (const doc of validDocuments) {
      if (!doc.file) continue;
      
      const fileValidation = sanitize.fileUpload(doc.file, {
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
        toast.error(`Ungültige Datei "${doc.title}": ${fileValidation.error}`);
        return;
      }
    }

    // Get user IDs
    const userIds = selectedUsers.map(u => u.id);

    // Upload each document
    try {
      for (let i = 0; i < validDocuments.length; i++) {
        const doc = validDocuments[i];
        setCurrentUploadIndex(i);
        
        // ✅ SANITIZE TITLE
        const sanitizedTitle = sanitize.text(doc.title);
        
        if (!sanitizedTitle || !doc.file) continue;

        // Upload with sanitized data
        await onUpload(doc.file, sanitizedTitle, doc.category, userIds);
      }

      toast.success(`✅ ${validDocuments.length} Dokument(e) erfolgreich hochgeladen!`);
      
      // Reset form
      setDocuments([{ id: '1', file: null, title: '', category: 'VERTRAG' as DocumentCategory }]);
      setCurrentUploadIndex(-1);
    } catch (error) {
      console.error('Upload error:', error);
      setCurrentUploadIndex(-1);
    }
  };

  const handleClose = () => {
    if (!uploading && currentUploadIndex === -1) {
      setDocuments([{ id: '1', file: null, title: '', category: 'VERTRAG' as DocumentCategory }]);
      setCurrentUploadIndex(-1);
      onOpenChange(false);
    }
  };

  const isUploading = uploading || currentUploadIndex >= 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="form-card sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Dokument an mehrere Mitarbeiter senden</DialogTitle>
          <DialogDescription>
            Das Dokument wird an {selectedUsers.length} ausgewählte{' '}
            {selectedUsers.length === 1 ? 'Mitarbeiter' : 'Mitarbeiter'} gesendet.
          </DialogDescription>
        </DialogHeader>

        <div className="form-grid max-h-[60vh] overflow-y-auto">
          {/* Selected Users */}
          <div className="form-field">
            <Label className="form-label">Ausgewählte Mitarbeiter ({selectedUsers.length})</Label>
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-24 overflow-y-auto">
              {selectedUsers.slice(0, 10).map((user) => (
                <Badge key={user.id} variant="secondary" className="text-xs">
                  {user.first_name} {user.last_name}
                </Badge>
              ))}
              {selectedUsers.length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{selectedUsers.length - 10} weitere
                </Badge>
              )}
            </div>
          </div>

          {/* Documents List */}
          <div className="form-field">
            <div className="flex items-center justify-between mb-2">
              <Label className="form-label">Dokumente ({documents.length})</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDocument}
                disabled={isUploading}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Weiteres Dokument
              </Button>
            </div>

            {documents.map((doc, index) => (
              <div
                key={doc.id}
                className={`p-4 border rounded-lg space-y-3 ${
                  currentUploadIndex === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {/* Document Header */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Dokument {index + 1}
                    {currentUploadIndex === index && (
                      <span className="ml-2 text-blue-600">(Wird hochgeladen...)</span>
                    )}
                  </span>
                  {documents.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDocument(doc.id)}
                      disabled={isUploading}
                      className="h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Document Title */}
                <div className="space-y-1">
                  <Label htmlFor={`title-${doc.id}`} className="text-xs">
                    Dokumenttitel *
                  </Label>
                  <Input
                    id={`title-${doc.id}`}
                    placeholder="z.B. Arbeitsvertrag 2025"
                    value={doc.title}
                    onChange={(e) => updateDocument(doc.id, 'title', e.target.value)}
                    disabled={isUploading}
                    className="h-9"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <Label htmlFor={`category-${doc.id}`} className="text-xs">
                    Kategorie *
                  </Label>
                  <Select
                    value={doc.category}
                    onValueChange={(value) => updateDocument(doc.id, 'category', value as DocumentCategory)}
                    disabled={isUploading}
                  >
                    <SelectTrigger id={`category-${doc.id}`} className="h-9">
                      <SelectValue placeholder="Kategorie wählen" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      <SelectItem value="VERTRAG">
                        {CATEGORY_LABELS.VERTRAG}
                      </SelectItem>
                      <SelectItem value="ZERTIFIKAT">
                        {CATEGORY_LABELS.ZERTIFIKAT}
                      </SelectItem>
                      <SelectItem value="LOHN">
                        {CATEGORY_LABELS.LOHN}
                      </SelectItem>
                      <SelectItem value="AU">
                        {CATEGORY_LABELS.AU}
                      </SelectItem>
                      <SelectItem value="PERSONALDOKUMENTE">
                        {CATEGORY_LABELS.PERSONALDOKUMENTE}
                      </SelectItem>
                      <SelectItem value="BEWERBUNGSUNTERLAGEN">
                        {CATEGORY_LABELS.BEWERBUNGSUNTERLAGEN}
                      </SelectItem>
                      <SelectItem value="SONSTIGES">
                        {CATEGORY_LABELS.SONSTIGES}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* File Upload */}
                <div className="space-y-1">
                  <Label htmlFor={`file-${doc.id}`} className="text-xs">
                    Datei hochladen *
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      id={`file-${doc.id}`}
                      type="file"
                      onChange={(e) => updateDocument(doc.id, 'file', e.target.files?.[0] || null)}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      disabled={isUploading}
                      className="hidden"
                    />
                    <label
                      htmlFor={`file-${doc.id}`}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed rounded-lg transition-colors ${
                        isUploading
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                          : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                      }`}
                    >
                      <Upload className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {doc.file ? doc.file.name : 'Datei auswählen'}
                      </span>
                    </label>
                    {doc.file && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => updateDocument(doc.id, 'file', null)}
                        disabled={isUploading}
                        className="h-8 w-8"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, Word, JPG, PNG (max. 10 MB)
                  </p>
                </div>

                {/* Preview */}
                {doc.file && doc.title && (
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {doc.title}
                        </p>
                        <p className="text-gray-600 truncate">
                          {CATEGORY_LABELS[doc.category]} • {doc.file.name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-footer">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isUploading || documents.filter(d => d.file && d.title).length === 0}
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {currentUploadIndex >= 0 ? (
                  `Dokument ${currentUploadIndex + 1}/${documents.filter(d => d.file && d.title).length}...`
                ) : (
                  'Wird hochgeladen...'
                )}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {documents.filter(d => d.file && d.title).length} Dokument(e) an {selectedUsers.length} Mitarbeiter senden
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}