/**
 * @file BrowoKo_EquipmentAddDialog.tsx
 * @version 4.5.9
 * @description Dialog zum Hinzufügen von Equipment für Fahrzeuge
 * 
 * Features:
 * - Equipment Name (Pflichtfeld)
 * - Beschreibung
 * - Seriennummer
 * - Anschaffungsdatum
 * - Nächste Wartung
 * - Status (Aktiv/Wartung/Defekt)
 * - Bilder Upload
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Package, Calendar, Hash, FileText, Image as ImageIcon, X } from '../components/icons/BrowoKoIcons';
import { toast } from 'sonner@2.0.3';

export interface EquipmentFormData {
  name: string;
  description: string;
  serial_number: string;
  purchase_date?: string;
  next_maintenance?: string;
  status: 'AKTIV' | 'WARTUNG' | 'DEFEKT';
  images: string[];
}

interface EquipmentAddDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: EquipmentFormData) => void;
}

export function EquipmentAddDialog({ open, onClose, onSave }: EquipmentAddDialogProps) {
  const [formData, setFormData] = useState<EquipmentFormData>({
    name: '',
    description: '',
    serial_number: '',
    purchase_date: '',
    next_maintenance: '',
    status: 'AKTIV',
    images: [],
  });

  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newUrls: string[] = [];
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newUrls.push(reader.result as string);
        if (newUrls.length === files.length) {
          setImageUrls(prev => [...prev, ...newUrls]);
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...newUrls]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Bitte gib einen Equipment-Namen ein');
      return;
    }

    onSave(formData);
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      serial_number: '',
      purchase_date: '',
      next_maintenance: '',
      status: 'AKTIV',
      images: [],
    });
    setImageUrls([]);
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      serial_number: '',
      purchase_date: '',
      next_maintenance: '',
      status: 'AKTIV',
      images: [],
    });
    setImageUrls([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="form-card max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Equipment hinzufügen
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="form-grid">
          {/* Equipment Name */}
          <div className="form-field">
            <Label htmlFor="name" className="form-label flex items-center gap-2">
              <Package className="w-4 h-4" />
              Equipment Name *
            </Label>
            <Input
              id="name"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Werkzeugkoffer, Erste-Hilfe-Set, Warndreieck..."
              required
            />
          </div>

          {/* Description */}
          <div className="form-field">
            <Label htmlFor="description" className="form-label flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Beschreibung
            </Label>
            <Textarea
              id="description"
              className="form-input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Zusätzliche Informationen zum Equipment..."
              rows={3}
            />
          </div>

          {/* Serial Number */}
          <div className="form-field">
            <Label htmlFor="serial_number" className="form-label flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Seriennummer / ID
            </Label>
            <Input
              id="serial_number"
              className="form-input"
              value={formData.serial_number}
              onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              placeholder="z.B. EQ-2024-001"
            />
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Purchase Date */}
            <div className="form-field">
              <Label htmlFor="purchase_date" className="form-label flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Anschaffungsdatum
              </Label>
              <Input
                id="purchase_date"
                className="form-input"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              />
            </div>

            {/* Next Maintenance */}
            <div className="form-field">
              <Label htmlFor="next_maintenance" className="form-label flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Nächste Wartung
              </Label>
              <Input
                id="next_maintenance"
                className="form-input"
                type="date"
                value={formData.next_maintenance}
                onChange={(e) => setFormData({ ...formData, next_maintenance: e.target.value })}
              />
            </div>
          </div>

          {/* Status */}
          <div className="form-field">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'AKTIV' | 'WARTUNG' | 'DEFEKT') => 
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AKTIV">✅ Aktiv</SelectItem>
                <SelectItem value="WARTUNG">🔧 In Wartung</SelectItem>
                <SelectItem value="DEFEKT">❌ Defekt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Images Upload */}
          <div className="form-field">
            <Label htmlFor="images" className="form-label flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Bilder
            </Label>
            <div className="space-y-3">
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="cursor-pointer"
              />
              
              {/* Image Previews */}
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Equipment ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Abbrechen
            </Button>
            <Button type="submit">
              <Package className="w-4 h-4 mr-2" />
              Equipment hinzufügen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}