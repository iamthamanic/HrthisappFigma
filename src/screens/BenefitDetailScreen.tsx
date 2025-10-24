/**
 * ============================================
 * BENEFIT DETAIL SCREEN (v3.7.0)
 * ============================================
 * Version: 3.7.0
 * Description: Detail-Ansicht eines Benefits (eigene Route: /benefits/:id)
 * ============================================
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { ArrowLeft, Check, Clock, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import HRTHIS_BenefitRequestDialog from '../components/HRTHIS_BenefitRequestDialog';
import LoadingState from '../components/LoadingState';
import { useAuthStore } from '../stores/HRTHIS_authStore';
import type { Benefit, UserBenefit } from '../types/schemas/HRTHIS_benefitSchemas';
import {
  BENEFIT_CATEGORY_META,
  formatAvailability,
  formatBenefitStatus,
  canRequestBenefit,
  getMonthsEmployed,
} from '../types/schemas/HRTHIS_benefitSchemas';
import * as benefitsService from '../services/HRTHIS_benefitsService';

export default function BenefitDetailScreen() {
  const { benefitId } = useParams<{ benefitId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();

  // State
  const [loading, setLoading] = useState(true);
  const [benefit, setBenefit] = useState<Benefit | null>(null);
  const [userBenefit, setUserBenefit] = useState<UserBenefit | null>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  // Load Data
  useEffect(() => {
    loadBenefit();
  }, [benefitId, user]);

  const loadBenefit = async () => {
    if (!benefitId || !user || !profile?.organization_id) return;

    setLoading(true);
    try {
      // Benefit laden
      const benefitData = await benefitsService.getBenefitById(benefitId);
      if (!benefitData) {
        toast.error('Benefit nicht gefunden');
        navigate('/benefits');
        return;
      }
      setBenefit(benefitData);

      // User Benefit laden
      const myBenefits = await benefitsService.getUserBenefits(user.id);
      const existingRequest = myBenefits.find((ub) => ub.benefit_id === benefitId);
      setUserBenefit(existingRequest || null);
    } catch (error) {
      console.error('Error loading benefit:', error);
      toast.error('Fehler beim Laden des Benefits');
    } finally {
      setLoading(false);
    }
  };

  // Request Handler
  const handleRequest = async (notes: string) => {
    if (!benefit || !user) return;

    try {
      await benefitsService.requestBenefit({ benefit_id: benefit.id, notes }, user.id);
      toast.success('Benefit-Anfrage erfolgreich gesendet!');
      loadBenefit(); // Reload
    } catch (error: any) {
      console.error('Error requesting benefit:', error);
      if (error.code === '23505') {
        toast.error('Du hast dieses Benefit bereits angefordert');
      } else {
        toast.error('Fehler beim Anfordern des Benefits');
      }
    }
  };

  // Loading
  if (loading) {
    return <LoadingState loading={true} type="spinner" />;
  }

  if (!benefit) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Benefit nicht gefunden</p>
        <Button onClick={() => navigate('/benefits')} className="mt-4">
          Zurück zur Übersicht
        </Button>
      </div>
    );
  }

  // Icon & Meta
  const IconComponent = (LucideIcons as any)[benefit.icon] || LucideIcons.Gift;
  const categoryMeta = BENEFIT_CATEGORY_META[benefit.category];
  const availability = formatAvailability(benefit);
  const isAvailable = benefit.max_users === null || benefit.current_users < benefit.max_users;

  // Eligibility Check
  const monthsEmployed = profile?.date_of_joining ? getMonthsEmployed(profile.date_of_joining) : 0;
  const eligibility = canRequestBenefit(benefit, monthsEmployed, userBenefit);

  // User Status
  const statusBadge = userBenefit ? formatBenefitStatus(userBenefit.status) : null;
  const canRequest = !userBenefit && benefit.is_active && eligibility.can;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/benefits')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Zurück zur Übersicht
      </Button>

      {/* Hero Section */}
      <Card className="p-8">
        <div className="flex items-start gap-6">
          {/* Icon */}
          <div
            className={`w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0 ${getCategoryBgColor(benefit.category)}`}
          >
            <IconComponent className={`w-12 h-12 ${categoryMeta.color}`} />
          </div>

          {/* Title & Metadata */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 mb-2">{benefit.title}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{categoryMeta.label}</Badge>
                  {statusBadge && <Badge className={`${statusBadge.color} border-0`}>{statusBadge.label}</Badge>}
                  {!benefit.is_active && (
                    <Badge className="bg-gray-100 text-gray-800 border-0">Inaktiv</Badge>
                  )}
                </div>
              </div>
            </div>

            <p className="text-lg text-gray-600 mb-6">{benefit.short_description}</p>

            {/* Action Button */}
            {canRequest ? (
              <Button onClick={() => setRequestDialogOpen(true)} size="lg" disabled={!isAvailable}>
                {isAvailable ? 'Jetzt anfordern' : 'Nicht verfügbar'}
              </Button>
            ) : userBenefit?.status === 'APPROVED' ? (
              <Badge className="bg-green-600 hover:bg-green-600 border-0 text-base py-2 px-4">
                <Check className="w-4 h-4 mr-2" />
                Aktiv
              </Badge>
            ) : userBenefit?.status === 'PENDING' ? (
              <Badge className="bg-yellow-600 hover:bg-yellow-600 border-0 text-base py-2 px-4">
                <Clock className="w-4 h-4 mr-2" />
                Ausstehend
              </Badge>
            ) : !eligibility.can ? (
              <div className="text-sm text-red-600">{eligibility.reason}</div>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Verfügbarkeit */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Verfügbarkeit</h3>
          </div>
          <p className={`text-2xl font-semibold ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
            {availability}
          </p>
          {benefit.max_users && (
            <p className="text-xs text-gray-500 mt-1">
              {benefit.current_users} von {benefit.max_users} vergeben
            </p>
          )}
        </Card>

        {/* Coin Price (wenn vorhanden) */}
        {benefit.coin_price !== null && benefit.coin_price > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <LucideIcons.Coins className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-gray-900">Coin-Preis</h3>
            </div>
            <p className="text-2xl font-semibold text-yellow-600">
              {benefit.coin_price.toLocaleString()} Coins
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {benefit.purchase_type === 'COINS_ONLY' && 'Nur mit Coins kaufbar'}
              {benefit.purchase_type === 'REQUEST_ONLY' && 'Nur per Antrag'}
              {benefit.purchase_type === 'BOTH' && 'Coins oder Antrag'}
            </p>
          </Card>
        )}

        {/* Wert (wenn vorhanden UND keine Coin Price) */}
        {benefit.value && !(benefit.coin_price !== null && benefit.coin_price > 0) && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <LucideIcons.DollarSign className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Wert</h3>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{benefit.value.toFixed(2)} €</p>
            <p className="text-xs text-gray-500 mt-1">
              {benefit.value < 50 ? 'Pro Tag' : 'Pro Monat'}
            </p>
          </Card>
        )}

        {/* Voraussetzung */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Voraussetzung</h3>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {benefit.eligibility_months > 0 ? `${benefit.eligibility_months} Monate` : 'Keine'}
          </p>
          {benefit.eligibility_months > 0 && (
            <p className="text-xs text-gray-500 mt-1">Mindest-Betriebszugehörigkeit</p>
          )}
        </Card>
      </div>

      {/* Description */}
      <Card className="p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Beschreibung</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-line">{benefit.description}</p>
        </div>
      </Card>

      {/* Request Dialog */}
      <HRTHIS_BenefitRequestDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        benefit={benefit}
        onRequest={handleRequest}
      />
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
