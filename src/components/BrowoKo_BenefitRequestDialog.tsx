/**
 * ============================================
 * BROWOKO BENEFIT REQUEST DIALOG
 * ============================================
 * Version: 3.7.0
 * Description: Dialog für Benefit-Anfrage (Mitarbeiter)
 * ============================================
 */

import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import type { Benefit } from '../types/schemas/BrowoKo_benefitSchemas';
import { BENEFIT_CATEGORY_META, formatAvailability } from '../types/schemas/BrowoKo_benefitSchemas';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  benefit: Benefit | null;
  onRequest: (notes: string) => Promise<void>;
}

export default function HRTHIS_BenefitRequestDialog({
  open,
  onOpenChange,
  benefit,
  onRequest,
}: Props) {
  const [notes, setNotes] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  if (!benefit) return null;

  const IconComponent = (LucideIcons as any)[benefit.icon] || LucideIcons.Gift;
  const categoryMeta = BENEFIT_CATEGORY_META[benefit.category];
  const availability = formatAvailability(benefit);

  const handleRequest = async () => {
    setIsRequesting(true);
    try {
      await onRequest(notes);
      setNotes(''); // Reset
      onOpenChange(false);
    } catch (error) {
      console.error('Error requesting benefit:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Benefit anfordern</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Benefit Info Card */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getCategoryBgColor(benefit.category)}`}
              >
                <IconComponent className={`w-6 h-6 ${categoryMeta.color}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                <Badge variant="outline" className="text-xs mb-2">
                  {categoryMeta.label}
                </Badge>
                <p className="text-sm text-gray-600">{benefit.short_description}</p>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Verfügbarkeit:</span>
                <span className="font-medium text-gray-900">{availability}</span>
              </div>
              {benefit.value && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Wert:</span>
                  <span className="font-medium text-gray-900">{benefit.value.toFixed(2)} €</span>
                </div>
              )}
              {benefit.eligibility_months > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Voraussetzung:</span>
                  <span className="font-medium text-gray-900">
                    {benefit.eligibility_months} Monate Betriebszugehörigkeit
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notizen (Optional) */}
          <div>
            <Label htmlFor="notes">Notiz an HR (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Möchtest du etwas zu deiner Anfrage mitteilen?"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{notes.length}/500 Zeichen</p>
          </div>

          {/* Info Box */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-900">
              <strong>Hinweis:</strong> Deine Anfrage wird von der HR-Abteilung geprüft. Du
              erhältst eine Benachrichtigung, sobald die Entscheidung getroffen wurde.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isRequesting}>
            Abbrechen
          </Button>
          <Button onClick={handleRequest} disabled={isRequesting}>
            {isRequesting ? 'Wird gesendet...' : 'Jetzt anfordern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper: Category Background Color
function getCategoryBgColor(category: string): string {
  const colorMap: Record<string, string> = {
    Health: 'bg-red-50',
    Mobility: 'bg-blue-50',
    Finance: 'bg-green-50',
    Food: 'bg-orange-50',
    Learning: 'bg-purple-50',
    Lifestyle: 'bg-pink-50',
    'Work-Life': 'bg-indigo-50',
  };
  return colorMap[category] || 'bg-gray-50';
}
