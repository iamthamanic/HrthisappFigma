import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Upload, Image as ImageIcon } from '../icons/BrowoKoIcons';
import { useState, useRef } from 'react';

interface CompanyLogoUploadProps {
  logoUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
}

export default function CompanyLogoUpload({
  logoUrl,
  onUpload,
  uploading
}: CompanyLogoUploadProps) {
  const [preview, setPreview] = useState<string | null>(logoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Bitte wähle eine Bilddatei');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Die Datei ist zu groß. Maximale Größe: 2MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    await onUpload(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Firmen-Logo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6">
          {/* Logo Preview */}
          <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
            {preview ? (
              <img
                src={preview}
                alt="Company Logo"
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <ImageIcon className="w-12 h-12 text-gray-300" />
            )}
          </div>

          {/* Upload Button */}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Wird hochgeladen...' : preview ? 'Logo ändern' : 'Logo hochladen'}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Empfohlen: Quadratisches Format, max. 2MB
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
