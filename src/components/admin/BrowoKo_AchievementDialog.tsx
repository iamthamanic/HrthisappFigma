/**
 * ============================================
 * ACHIEVEMENT DIALOG COMPONENT (v3.9.1)
 * ============================================
 * Description: Dialog für Create/Edit Coin Achievements (Admin)
 * ============================================
 */

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import type { CoinAchievement } from '../../types/database';
import * as Icons from '../icons/BrowoKoIcons';

interface AchievementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: CoinAchievement | null;
  formData: AchievementFormData;
  setFormData: (data: AchievementFormData) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export interface AchievementFormData {
  title: string;
  description: string;
  icon: string;
  required_coins: number;
  unlock_type: 'PRIVILEGE' | 'ACCESS' | 'EVENT' | 'BENEFIT';
  unlock_description: string;
  category: 'MILESTONE' | 'EVENT' | 'EXCLUSIVE';
  badge_color: 'bronze' | 'silver' | 'gold' | 'platinum';
  sort_order: number;
  is_active: boolean;
}

// Available Lucide Icons for Achievements
const ICON_OPTIONS = [
  'Trophy',
  'Award',
  'Medal',
  'Crown',
  'Star',
  'Sparkles',
  'Target',
  'Zap',
  'Flame',
  'Gift',
  'Heart',
  'Users',
  'Briefcase',
  'Rocket',
  'Mountain',
  'Home',
  'Plane',
  'Utensils',
  'Coffee',
  'Book',
] as const;

export default function AchievementDialog({
  open,
  onOpenChange,
  editing,
  formData,
  setFormData,
  onSubmit,
  onClose,
}: AchievementDialogProps) {
  // Reset form when opening/closing
  useEffect(() => {
    if (!open) {
      // Dialog closed - keep form data for parent to reset
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  // Get Icon Component dynamically
  const IconComponent = (Icons as any)[formData.icon] || Icons.Trophy;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Achievement bearbeiten' : 'Neues Achievement erstellen'}
          </DialogTitle>
          <DialogDescription>
            {editing ? 'Bearbeite die Details des Achievements' : 'Erstelle ein neues Coin Achievement für Mitarbeiter'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="z.B. Coin Starter"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Beschreibung *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="z.B. Erreiche 100 Coins auf deinem Konto"
              rows={3}
              required
            />
          </div>

          {/* Required Coins */}
          <div>
            <Label htmlFor="required_coins">Erforderliche Coins *</Label>
            <Input
              id="required_coins"
              type="number"
              min="0"
              value={formData.required_coins}
              onChange={(e) =>
                setFormData({ ...formData, required_coins: parseInt(e.target.value) || 0 })
              }
              placeholder="z.B. 100"
              required
            />
          </div>

          {/* Icon Selection */}
          <div>
            <Label htmlFor="icon">Icon *</Label>
            <Select
              value={formData.icon}
              onValueChange={(value) => setFormData({ ...formData, icon: value })}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4" />
                    <span>{formData.icon}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="z-[9999]" position="popper" sideOffset={5}>
                {ICON_OPTIONS.map((iconName) => {
                  const ItemIcon = (Icons as any)[iconName] || Icons.Trophy;
                  return (
                    <SelectItem key={iconName} value={iconName}>
                      <div className="flex items-center gap-2">
                        <ItemIcon className="w-4 h-4" />
                        <span>{iconName}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Unlock Type */}
          <div>
            <Label htmlFor="unlock_type">Unlock Type *</Label>
            <Select
              value={formData.unlock_type}
              onValueChange={(value: any) => setFormData({ ...formData, unlock_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[9999]" position="popper" sideOffset={5}>
                <SelectItem value="PRIVILEGE">Privilege (Ehre/Anerkennung)</SelectItem>
                <SelectItem value="ACCESS">Access (Zugang zu Features)</SelectItem>
                <SelectItem value="EVENT">Event (Eventeinladung)</SelectItem>
                <SelectItem value="BENEFIT">Benefit (Materieller Vorteil)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Unlock Description */}
          <div>
            <Label htmlFor="unlock_description">Unlock-Beschreibung *</Label>
            <Textarea
              id="unlock_description"
              value={formData.unlock_description}
              onChange={(e) =>
                setFormData({ ...formData, unlock_description: e.target.value })
              }
              placeholder="Was passiert nach dem Unlock?"
              rows={2}
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Kategorie *</Label>
            <Select
              value={formData.category}
              onValueChange={(value: any) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[9999]" position="popper" sideOffset={5}>
                <SelectItem value="MILESTONE">Milestone (Meilenstein)</SelectItem>
                <SelectItem value="EVENT">Event (Veranstaltung)</SelectItem>
                <SelectItem value="EXCLUSIVE">Exclusive (Exklusiv)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Badge Color */}
          <div>
            <Label htmlFor="badge_color">Badge-Farbe *</Label>
            <Select
              value={formData.badge_color}
              onValueChange={(value: any) => setFormData({ ...formData, badge_color: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[9999]" position="popper" sideOffset={5}>
                <SelectItem value="bronze">Bronze</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Order */}
          <div>
            <Label htmlFor="sort_order">Sortierung</Label>
            <Input
              id="sort_order"
              type="number"
              min="0"
              value={formData.sort_order}
              onChange={(e) =>
                setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
              }
              placeholder="z.B. 1, 2, 3..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Niedrigere Zahlen werden zuerst angezeigt
            </p>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <Label className="mb-2 block">Preview:</Label>
            <div className="flex items-start gap-4">
              {/* Badge Preview */}
              <div className="relative">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    formData.badge_color === 'bronze'
                      ? 'bg-gradient-to-br from-amber-400 to-amber-700'
                      : formData.badge_color === 'silver'
                      ? 'bg-gradient-to-br from-gray-300 to-gray-600'
                      : formData.badge_color === 'gold'
                      ? 'bg-gradient-to-br from-yellow-300 to-yellow-600'
                      : 'bg-gradient-to-br from-purple-400 to-purple-700'
                  }`}
                >
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Text Preview */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {formData.title || 'Achievement Titel'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {formData.description || 'Achievement Beschreibung'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Icons.Coins className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {formData.required_coins} Coins
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dialog Footer */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit">
              {editing ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
