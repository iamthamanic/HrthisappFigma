/**
 * @file HRTHIS_VehicleAddDialog.tsx
 * @version 4.5.4
 * @description Dialog to add new vehicle with images, details, and documents
 * 
 * Features:
 * - Multiple image upload (first = thumbnail)
 * - Kennzeichen (License Plate)
 * - Modell (Vehicle Model - e.g. Mercedes Sprinter)
 * - Fahrzeugtyp (Vehicle Type)
 * - Ladekapazität (Load Capacity in kg)
 * - Dienst Start (Service Start Date)
 * - Letzte Wartung (Last Maintenance Date)
 * - Dokumente Upload
 */

import { useState } from 'react';
import { X, Upload, Image as ImageIcon, FileText, Trash2, Calendar } from '../components/icons/HRTHISIcons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';

interface VehicleAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (vehicle: VehicleFormData) => void;
}

export interface VehicleFormData {
  id?: string;
  kennzeichen: string;
  modell: string;
  fahrzeugtyp: string;
  ladekapazitaet: number;
  dienst_start?: string;
  letzte_wartung?: string;
  images: File[];
  documents: File[];
  created_at?: string;
}

const VEHICLE_TYPES = [
  'Transporter',
  'Kastenwagen',
  'PKW'
];

export function VehicleAddDialog({ open, onOpenChange, onSave }: VehicleAddDialogProps) {
  const [kennzeichen, setKennzeichen] = useState('');
  const [modell, setModell] = useState('');
  const [fahrzeugtyp, setFahrzeugtyp] = useState('');
  const [ladekapazitaet, setLadekapazitaet] = useState('');
  const [dienstStart, setDienstStart] = useState('');
  const [letzteWartung, setLetzteWartung] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check file types
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      toast.error('Nur Bilddateien erlaubt!');
      return;
    }

    // Add to images
    setImages(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle document upload
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setDocuments(prev => [...prev, ...files]);
    toast.success(`${files.length} Dokument(e) hinzugefügt`);
  };

  // Remove document
  const handleRemoveDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle save
  const handleSave = () => {
    // Validation
    if (!kennzeichen.trim()) {
      toast.error('Bitte Kennzeichen eingeben');
      return;
    }
    if (!modell.trim()) {
      toast.error('Bitte Modell eingeben');
      return;
    }
    if (!fahrzeugtyp) {
      toast.error('Bitte Fahrzeugtyp auswählen');
      return;
    }
    if (!ladekapazitaet || parseFloat(ladekapazitaet) <= 0) {
      toast.error('Bitte gültige Ladekapazität eingeben');
      return;
    }

    const vehicleData: VehicleFormData = {
      id: crypto.randomUUID(),
      kennzeichen: kennzeichen.trim().toUpperCase(),
      modell: modell.trim(),
      fahrzeugtyp,
      ladekapazitaet: parseFloat(ladekapazitaet),
      dienst_start: dienstStart || undefined,
      letzte_wartung: letzteWartung || undefined,
      images,
      documents,
      equipment: [], // Initialize empty equipment array
      created_at: new Date().toISOString(),
    };

    onSave(vehicleData);

    // Reset form
    setKennzeichen('');
    setModell('');
    setFahrzeugtyp('');
    setLadekapazitaet('');
    setDienstStart('');
    setLetzteWartung('');
    setImages([]);
    setDocuments([]);
    setImagePreviews([]);
    
    toast.success('Fahrzeug erfolgreich hinzugefügt! 🚗');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Neues Fahrzeug hinzufügen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Images Upload */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Bilder (erstes Bild = Vorschaubild)
            </Label>
            
            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Vorschau ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    {index === 0 && (
                      <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                        Vorschau
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all">
              <ImageIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                Bilder hochladen (max. 10)
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={images.length >= 10}
              />
            </label>
            <p className="text-xs text-gray-500 mt-1">
              {images.length} / 10 Bilder hochgeladen
            </p>
          </div>

          {/* Kennzeichen */}
          <div>
            <Label htmlFor="kennzeichen" className="text-sm font-medium text-gray-700 mb-2 block">
              Kennzeichen *
            </Label>
            <Input
              id="kennzeichen"
              value={kennzeichen}
              onChange={(e) => setKennzeichen(e.target.value.toUpperCase())}
              placeholder="z.B. B-HR-1234"
              className="text-base"
            />
          </div>

          {/* Modell */}
          <div>
            <Label htmlFor="modell" className="text-sm font-medium text-gray-700 mb-2 block">
              Modell *
            </Label>
            <Input
              id="modell"
              value={modell}
              onChange={(e) => setModell(e.target.value)}
              placeholder="z.B. Mercedes Sprinter 316 CDI"
              className="text-base"
            />
          </div>

          {/* Fahrzeugtyp */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Fahrzeugtyp *
            </Label>
            <Select value={fahrzeugtyp} onValueChange={setFahrzeugtyp}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Fahrzeugtyp wählen..." />
              </SelectTrigger>
              <SelectContent className="z-[9999]" position="popper" sideOffset={5}>
                {VEHICLE_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ladekapazität */}
          <div>
            <Label htmlFor="ladekapazitaet" className="text-sm font-medium text-gray-700 mb-2 block">
              Ladekapazität (kg) *
            </Label>
            <Input
              id="ladekapazitaet"
              type="number"
              value={ladekapazitaet}
              onChange={(e) => setLadekapazitaet(e.target.value)}
              placeholder="z.B. 1000"
              min="0"
              step="100"
              className="text-base"
            />
          </div>

          {/* Dienst Start */}
          <div>
            <Label htmlFor="dienst_start" className="text-sm font-medium text-gray-700 mb-2 block">
              Dienst Start (optional)
            </Label>
            <div className="relative">
              <Input
                id="dienst_start"
                type="date"
                value={dienstStart}
                onChange={(e) => setDienstStart(e.target.value)}
                className="text-base"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Letzte Wartung */}
          <div>
            <Label htmlFor="letzte_wartung" className="text-sm font-medium text-gray-700 mb-2 block">
              Letzte Wartung (optional)
            </Label>
            <div className="relative">
              <Input
                id="letzte_wartung"
                type="date"
                value={letzteWartung}
                onChange={(e) => setLetzteWartung(e.target.value)}
                className="text-base"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Documents Upload */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Dokumente (optional)
            </Label>
            
            {/* Document List */}
            {documents.length > 0 && (
              <div className="space-y-2 mb-3">
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">
                        {doc.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveDocument(index)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                Dokumente hochladen
              </span>
              <input
                type="file"
                multiple
                onChange={handleDocumentUpload}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-1">
              {documents.length} Dokument(e) hochgeladen
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Fahrzeug hinzufügen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
