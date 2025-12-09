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
      <DialogContent className="form-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Benefit anfordern
          </DialogTitle>
        </DialogHeader>

        <div className="form-grid">
          {/* Benefit Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getCategoryBgColor(benefit.category)}`}
              >
                <IconComponent className={`w-6 h-6 ${categoryMeta.color}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                <Badge variant="outline" className="text-xs">
                  {categoryMeta.label}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-gray-600">{benefit.short_description}</p>
          </div>

          {/* Notes */}
          <div className="form-field">
            <Label htmlFor="notes" className="form-label">
              Notizen (optional)
            </Label>
            <Textarea
              id="notes"
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Begründung oder zusätzliche Informationen..."
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              Füge optional eine Begründung oder weitere Details zu deiner Anfrage hinzu
            </p>
          </div>

          {/* Approval Notice */}
          {benefit.requires_approval && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>Hinweis:</strong> Deine Anfrage muss von einem Admin genehmigt werden.
              </p>
            </div>
          )}
        </div>

        <div className="form-footer">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isRequesting}>
            Abbrechen
          </Button>
          <Button onClick={handleRequest} disabled={isRequesting}>
            {isRequesting ? 'Wird angefordert...' : 'Jetzt anfordern'}
          </Button>
        </div>
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