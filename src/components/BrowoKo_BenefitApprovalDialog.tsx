/**
 * ============================================
 * BROWOKO BENEFIT APPROVAL DIALOG
 * ============================================
 * Version: 3.7.0
 * Description: Dialog für Benefit-Genehmigung/Ablehnung (Admin)
 * ============================================
 */

import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import type { UserBenefitWithDetails } from '../types/schemas/BrowoKo_benefitSchemas';
import { BENEFIT_CATEGORY_META } from '../types/schemas/BrowoKo_benefitSchemas';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: UserBenefitWithDetails | null;
  mode: 'approve' | 'reject';
  onConfirm: (adminNotes: string, rejectionReason?: string) => Promise<void>;
}

export default function HRTHIS_BenefitApprovalDialog({
  open,
  onOpenChange,
  request,
  mode,
  onConfirm,
}: Props) {
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!request) return null;

  const { benefit, user, notes, requested_at } = request;
  const IconComponent = (LucideIcons as any)[benefit.icon] || LucideIcons.Gift;
  const categoryMeta = BENEFIT_CATEGORY_META[benefit.category];

  const requestedDate = new Date(requested_at).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const fullName = user ? `${user.first_name} ${user.last_name}` : '';
  const userInitials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?';

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(adminNotes, mode === 'reject' ? rejectionReason : undefined);
      // Reset
      setAdminNotes('');
      setRejectionReason('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error processing benefit request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="form-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'approve' ? 'Benefit genehmigen' : 'Benefit ablehnen'}
          </DialogTitle>
        </DialogHeader>

        <div className="form-grid">
          {/* User Info */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user?.profile_picture} alt={fullName} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900">{fullName}</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>

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
            <p className="text-sm text-gray-600 mb-3">{benefit.short_description}</p>

            {/* Metadata */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Angefordert am:</span>
                <span className="text-gray-900">{requestedDate}</span>
              </div>
              {benefit.value && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Wert:</span>
                  <span className="text-gray-900">{benefit.value.toFixed(2)} €</span>
                </div>
              )}
            </div>
          </div>

          {/* User Notes */}
          {notes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Notiz des Mitarbeiters:</p>
              <p className="text-sm text-blue-900">{notes}</p>
            </div>
          )}

          {/* Rejection Reason (nur bei Ablehnung) */}
          {mode === 'reject' && (
            <div>
              <Label htmlFor="rejection-reason">Ablehnungsgrund *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Bitte gib einen Grund für die Ablehnung an..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{rejectionReason.length}/500 Zeichen</p>
            </div>
          )}

          {/* Admin Notes (optional) */}
          <div>
            <Label htmlFor="admin-notes">
              Admin-Notiz (optional)
              {mode === 'approve' && <span className="text-gray-500 ml-1">- intern</span>}
            </Label>
            <Textarea
              id="admin-notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Interne Notiz für andere Admins..."
              rows={2}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{adminNotes.length}/500 Zeichen</p>
          </div>

          {/* Warning bei Rejection */}
          {mode === 'reject' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-900">
                <strong>Hinweis:</strong> Der Mitarbeiter wird über die Ablehnung benachrichtigt
                und kann den Grund einsehen.
              </p>
            </div>
          )}

          {/* Info bei Approval */}
          {mode === 'approve' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-900">
                <strong>Hinweis:</strong> Das Benefit wird sofort aktiviert und der Mitarbeiter
                wird benachrichtigt.
              </p>
            </div>
          )}
        </div>

        <div className="form-footer">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Abbrechen
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              isProcessing || (mode === 'reject' && !rejectionReason.trim())
            }
            className={
              mode === 'reject'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }
          >
            {isProcessing
              ? mode === 'approve'
                ? 'Wird genehmigt...'
                : 'Wird abgelehnt...'
              : mode === 'approve'
              ? 'Jetzt genehmigen'
              : 'Jetzt ablehnen'}
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