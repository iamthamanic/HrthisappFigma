/**
 * ============================================
 * HRTHIS ADMIN APPROVAL QUEUE
 * ============================================
 * Version: 3.7.0
 * Description: Admin Component für Benefits-Genehmigungen
 * ============================================
 */

import * as LucideIcons from 'lucide-react';
import { Check, X, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import type { UserBenefitWithDetails } from '../../types/schemas/HRTHIS_benefitSchemas';
import { BENEFIT_CATEGORY_META } from '../../types/schemas/HRTHIS_benefitSchemas';

interface Props {
  requests: UserBenefitWithDetails[];
  onApprove: (request: UserBenefitWithDetails) => void;
  onReject: (request: UserBenefitWithDetails) => void;
  isProcessing?: boolean;
}

export default function HRTHIS_AdminApprovalQueue({
  requests,
  onApprove,
  onReject,
  isProcessing = false,
}: Props) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <LucideIcons.CheckCircle className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Keine ausstehenden Anfragen
        </h3>
        <p className="text-sm text-gray-600">
          Alle Benefit-Anfragen wurden bearbeitet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const { benefit, user, requested_at, notes } = request;
        const IconComponent = (LucideIcons as any)[benefit.icon] || LucideIcons.Gift;
        const categoryMeta = BENEFIT_CATEGORY_META[benefit.category];

        // Datum formatieren
        const requestedDate = new Date(requested_at).toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

        // User Initialen
        const fullName = user ? `${user.first_name} ${user.last_name}` : '';
        const initials = fullName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase() || '?';

        return (
          <Card key={request.id} className="p-6">
            <div className="flex items-start gap-4">
              {/* User Avatar */}
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={user?.profile_picture} alt={fullName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{fullName}</h3>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800 border-0">Ausstehend</Badge>
                </div>

                {/* Benefit Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${getCategoryBgColor(benefit.category)}`}
                    >
                      <IconComponent className={`w-5 h-5 ${categoryMeta.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{benefit.title}</h4>
                      <Badge variant="outline" className="text-xs mt-1">
                        {categoryMeta.label}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{benefit.short_description}</p>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                  {/* Angefordert am */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500">Angefordert am:</span>
                      <span className="ml-2 text-gray-900">{requestedDate}</span>
                    </div>
                  </div>

                  {/* Wert */}
                  {benefit.value && (
                    <div>
                      <span className="text-gray-500">Wert:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {benefit.value.toFixed(2)} €
                      </span>
                    </div>
                  )}

                  {/* Verfügbarkeit */}
                  <div className="col-span-2">
                    <span className="text-gray-500">Verfügbarkeit:</span>
                    <span className="ml-2 text-gray-900">
                      {benefit.max_users
                        ? `${benefit.current_users}/${benefit.max_users} vergeben`
                        : 'Unbegrenzt'}
                    </span>
                  </div>
                </div>

                {/* User Notiz */}
                {notes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-500 mb-1">Notiz des Mitarbeiters:</p>
                    <p className="text-sm text-blue-900">{notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => onApprove(request)}
                    disabled={isProcessing}
                    size="sm"
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {isProcessing ? 'Wird genehmigt...' : 'Genehmigen'}
                  </Button>
                  <Button
                    onClick={() => onReject(request)}
                    disabled={isProcessing}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {isProcessing ? 'Wird abgelehnt...' : 'Ablehnen'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
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
