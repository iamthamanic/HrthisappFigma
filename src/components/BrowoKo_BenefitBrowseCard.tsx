/**
 * ============================================
 * BROWOKO BENEFIT BROWSE CARD
 * ============================================
 * Version: 3.8.0 - COIN SHOP
 * Description: Card Component für Benefits Browse Grid (mit Coin-Preis Support)
 * ============================================
 */

import { Link } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Coins } from 'lucide-react';
import type { 
  BenefitWithUserStatus,
  BenefitWithPurchaseInfo 
} from '../types/schemas/BrowoKo_benefitSchemas';
import {
  BENEFIT_CATEGORY_META,
  formatAvailability,
  formatBenefitStatus,
} from '../types/schemas/BrowoKo_benefitSchemas';

interface Props {
  benefit: BenefitWithUserStatus | BenefitWithPurchaseInfo;
  onRequest?: (benefitId: string) => void;
  onPurchase?: (benefitId: string, coinPrice: number) => void;
  isRequesting?: boolean;
}

export default function HRTHIS_BenefitBrowseCard({
  benefit,
  onRequest,
  onPurchase,
  isRequesting = false,
}: Props) {
  // Icon laden
  const IconComponent = (LucideIcons as any)[benefit.icon] || LucideIcons.Gift;
  const categoryMeta = BENEFIT_CATEGORY_META[benefit.category];

  // Status Badge
  const statusBadge = benefit.user_benefit
    ? formatBenefitStatus(benefit.user_benefit.status)
    : null;

  // Verfügbarkeit
  const availability = formatAvailability(benefit);
  const isAvailable = benefit.max_users === null || benefit.current_users < benefit.max_users;

  // Coin Shop Support (v3.8.0)
  const hasCoinPrice = benefit.coin_price !== null && benefit.coin_price > 0;
  const isPurchaseInfo = 'can_purchase_with_coins' in benefit;
  const canPurchaseWithCoins = isPurchaseInfo ? benefit.can_purchase_with_coins : false;
  const canRequestBenefit = isPurchaseInfo ? benefit.can_request : benefit.can_request;

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group relative">
      {/* Coin Price Badge (v3.8.0) */}
      {hasCoinPrice && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
            <Coins className="w-3 h-3 mr-1" />
            {benefit.coin_price!.toLocaleString('de-DE')}
          </Badge>
        </div>
      )}

      {/* Icon Header */}
      <div className={`p-6 ${getCategoryBgColor(benefit.category)}`}>
        <div className="flex items-center justify-between">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
            <IconComponent className={`w-8 h-8 ${categoryMeta.color}`} />
          </div>
          {statusBadge && !hasCoinPrice && (
            <Badge className={`${statusBadge.color} border-0`}>{statusBadge.label}</Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title & Category */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
            {benefit.title}
          </h3>
          <Badge variant="outline" className="text-xs">
            {categoryMeta.label}
          </Badge>
        </div>

        {/* Short Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{benefit.short_description}</p>

        {/* Metadata */}
        <div className="space-y-2 mb-4">
          {/* Verfügbarkeit */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Verfügbarkeit:</span>
            <span className={`font-medium ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
              {availability}
            </span>
          </div>

          {/* Wert (optional) */}
          {benefit.value && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Wert:</span>
              <span className="font-medium text-gray-900">
                {benefit.value.toFixed(2)} € {benefit.value < 50 ? '/Tag' : '/Monat'}
              </span>
            </div>
          )}

          {/* Voraussetzung (optional) */}
          {benefit.eligibility_months > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Voraussetzung:</span>
              <span className="font-medium text-gray-700">
                {benefit.eligibility_months} Monate
              </span>
            </div>
          )}
        </div>

        {/* Actions (v3.8.0 - Coin Shop Support) */}
        <div className="flex gap-2">
          <Link to={`/benefits/${benefit.id}`} className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              Details ansehen
            </Button>
          </Link>

          {/* Coin Purchase Button */}
          {canPurchaseWithCoins && onPurchase && benefit.coin_price && (
            <Button
              onClick={() => onPurchase(benefit.id, benefit.coin_price!)}
              disabled={isRequesting || !isAvailable}
              size="sm"
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0"
            >
              <Coins className="w-4 h-4 mr-1" />
              {benefit.coin_price.toLocaleString('de-DE')} kaufen
            </Button>
          )}

          {/* Request Button (nur wenn kein Coin-Purchase möglich) */}
          {canRequestBenefit && onRequest && !canPurchaseWithCoins && (
            <Button
              onClick={() => onRequest(benefit.id)}
              disabled={isRequesting || !isAvailable}
              size="sm"
              className="flex-1"
            >
              {isRequesting ? 'Wird gesendet...' : 'Anfordern'}
            </Button>
          )}

          {/* Both Buttons (wenn BOTH purchase_type) */}
          {canRequestBenefit && canPurchaseWithCoins && onRequest && (
            <Button
              onClick={() => onRequest(benefit.id)}
              disabled={isRequesting || !isAvailable}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {isRequesting ? 'Wird gesendet...' : 'Anfordern'}
            </Button>
          )}

          {benefit.is_approved && (
            <Badge className="flex-1 justify-center bg-green-600 hover:bg-green-600 border-0 py-2">
              ✓ Aktiv
            </Badge>
          )}

          {benefit.user_benefit?.status === 'PENDING' && (
            <Badge className="flex-1 justify-center bg-yellow-600 hover:bg-yellow-600 border-0 py-2">
              Ausstehend
            </Badge>
          )}
        </div>
      </div>
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
