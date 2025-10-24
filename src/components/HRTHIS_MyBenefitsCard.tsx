/**
 * ============================================
 * HRTHIS MY BENEFITS CARD
 * ============================================
 * Version: 3.7.0
 * Description: Card für "Meine Benefits" Liste
 * ============================================
 */

import * as LucideIcons from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import type { UserBenefitWithDetails } from '../types/schemas/HRTHIS_benefitSchemas';
import {
  BENEFIT_CATEGORY_META,
  formatBenefitStatus,
} from '../types/schemas/HRTHIS_benefitSchemas';

interface Props {
  userBenefit: UserBenefitWithDetails;
  onCancel?: (userBenefitId: string) => void;
  isCancelling?: boolean;
}

export default function HRTHIS_MyBenefitsCard({
  userBenefit,
  onCancel,
  isCancelling = false,
}: Props) {
  const { benefit, status, requested_at, approved_at, rejection_reason, approver } = userBenefit;

  // Icon laden
  const IconComponent = (LucideIcons as any)[benefit.icon] || LucideIcons.Gift;
  const categoryMeta = BENEFIT_CATEGORY_META[benefit.category];

  // Status
  const statusInfo = formatBenefitStatus(status);

  // Datum formatieren
  const requestedDate = new Date(requested_at).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const approvedDate = approved_at
    ? new Date(approved_at).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${getCategoryBgColor(benefit.category)}`}
        >
          <IconComponent className={`w-7 h-7 ${categoryMeta.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {categoryMeta.label}
                </Badge>
                <Badge className={`${statusInfo.color} border-0 text-xs`}>
                  {statusInfo.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{benefit.short_description}</p>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-xs">
            {/* Angefordert am */}
            <div>
              <span className="text-gray-500">Angefordert:</span>
              <span className="ml-2 text-gray-900">{requestedDate}</span>
            </div>

            {/* Genehmigt am */}
            {approvedDate && (
              <div>
                <span className="text-gray-500">Genehmigt:</span>
                <span className="ml-2 text-gray-900">{approvedDate}</span>
              </div>
            )}

            {/* Genehmigt von */}
            {approver && (
              <div className="col-span-2">
                <span className="text-gray-500">Genehmigt von:</span>
                <span className="ml-2 text-gray-900">
                  {approver.first_name} {approver.last_name}
                </span>
              </div>
            )}

            {/* Coin-Preis (falls vorhanden) */}
            {benefit.coin_price !== null && benefit.coin_price > 0 && (
              <div>
                <span className="text-gray-500">Kosten:</span>
                <span className="ml-2 font-medium text-yellow-600">
                  {benefit.coin_price.toLocaleString()} Coins
                </span>
              </div>
            )}

            {/* Wert (optional - nur wenn KEIN Coin-Preis) */}
            {benefit.value && !(benefit.coin_price !== null && benefit.coin_price > 0) && (
              <div>
                <span className="text-gray-500">Wert:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {benefit.value.toFixed(2)} €
                </span>
              </div>
            )}
          </div>

          {/* Rejection Reason */}
          {status === 'REJECTED' && rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-red-800">
                <span className="font-semibold">Ablehnungsgrund:</span> {rejection_reason}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Link to={`/benefits/${benefit.id}`}>
              <Button variant="outline" size="sm">
                Details ansehen
              </Button>
            </Link>

            {/* Stornieren Button (nur bei PENDING) */}
            {status === 'PENDING' && onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancel(userBenefit.id)}
                disabled={isCancelling}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {isCancelling ? 'Wird storniert...' : 'Stornieren'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
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
