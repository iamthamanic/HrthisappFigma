import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, Loader2, FileText, CheckCircle2 } from './icons/BrowoKoIcons';
import { User } from '../types/database';

type DocumentCategory = 'VERTRAG' | 'ZERTIFIKAT' | 'LOHN' | 'AU' | 'PERSONALDOKUMENTE' | 'BEWERBUNGSUNTERLAGEN' | 'SONSTIGES';

interface QuickUploadDocumentDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUpload: (userId: string, file: File, category: DocumentCategory, title: string) => Promise<void>;
}

export default function QuickUploadDocumentDialog({
  user,
  isOpen,
  onClose,
  onUpload,
}: QuickUploadDocumentDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>('SONSTIGES');
  const [title, setTitle] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto-generate title from filename if empty
      if (!title) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleUpload = async () => {
    if (!user || !file || !title) return;

    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onUpload(user.id, file, category, title);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadComplete(true);

      // Close after short delay
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setTitle('');
    setCategory('SONSTIGES');
    setUploadProgress(0);
    setUploadComplete(false);
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Dokument hochladen
          </DialogTitle>
          <DialogDescription>
            Dokument für {user.first_name} {user.last_name} hochladen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Datei auswählen</Label>
            <div className="relative">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                disabled={uploading}
              />
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <FileText className="w-4 h-4" />
                <span>{file.name}</span>
                <span className="text-xs text-gray-400">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Dokumenttitel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Arbeitsvertrag 2024"
              disabled={uploading}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            <Select 
              value={category} 
              onValueChange={(value: DocumentCategory) => setCategory(value)}
              disabled={uploading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="quick-upload-vertrag" value="VERTRAG">Vertrag</SelectItem>
                <SelectItem key="quick-upload-zertifikat" value="ZERTIFIKAT">Zertifikat</SelectItem>
                <SelectItem key="quick-upload-lohn" value="LOHN">Gehaltsabrechnung</SelectItem>
                <SelectItem key="quick-upload-au" value="AU">AU</SelectItem>
                <SelectItem key="quick-upload-personaldokumente" value="PERSONALDOKUMENTE">Personaldokumente</SelectItem>
                <SelectItem key="quick-upload-bewerbungsunterlagen" value="BEWERBUNGSUNTERLAGEN">Bewerbungsunterlagen</SelectItem>
                <SelectItem key="quick-upload-sonstiges" value="SONSTIGES">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Upload läuft...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadComplete && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
              <span>Dokument erfolgreich hochgeladen!</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={uploading || !file || !title}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
