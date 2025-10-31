/**
 * ============================================
 * BROWOKO BENEFIT PURCHASE DIALOG
 * ============================================
 * Version: 3.8.0 - COIN SHOP
 * Description: Confirmation Dialog für Benefit-Kauf mit Coins
 * ============================================
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import {
  Coins,
  Minus,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShoppingBag,
} from 'lucide-react';
import type { BenefitWithPurchaseInfo } from '../types/schemas/BrowoKo_benefitSchemas';

interface BenefitPurchaseDialogProps {
  benefit: BenefitWithPurchaseInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export default function BenefitPurchaseDialog({
  benefit,
  open,
  onOpenChange,
  onConfirm,
}: BenefitPurchaseDialogProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);

  if (!benefit || !benefit.coin_price) return null;

  const userCoinBalance = benefit.user_coin_balance;
  const coinPrice = benefit.coin_price;
  const newBalance = userCoinBalance - coinPrice;
  const canAfford = newBalance >= 0;

  const handleConfirm = async () => {
    setIsPurchasing(true);
    try {
      await onConfirm();
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-500" />
            Benefit kaufen?
          </DialogTitle>
          <DialogDescription>
            Bestätige deinen Kauf mit Coins
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefit Info */}
          <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-2xl shadow-sm">
                {benefit.icon ? (
                  <span>{benefit.icon}</span>
                ) : (
                  <ShoppingBag className="w-5 h-5 text-orange-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {benefit.short_description}
                </p>
              </div>
            </div>
          </div>

          {/* Coin Balance Calculation */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Dein aktueller Kontostand:</span>
              <span className="font-semibold flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-yellow-600" />
                {userCoinBalance.toLocaleString('de-DE')}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Kosten:</span>
              <span className="font-semibold text-red-600 flex items-center gap-1.5">
                <Minus className="w-4 h-4" />
                {coinPrice.toLocaleString('de-DE')}
              </span>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Neuer Kontostand:</span>
              <span
                className={`font-semibold flex items-center gap-1.5 ${
                  canAfford ? 'text-green-600' : 'text-red-600'
                }`}
              >
                <Coins className="w-4 h-4" />
                {newBalance.toLocaleString('de-DE')}
              </span>
            </div>
          </div>

          {/* Insufficient Coins Warning */}
          {!canAfford && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Du hast nicht genügend Coins für diesen Kauf.
              </AlertDescription>
            </Alert>
          )}

          {/* Approval Info */}
          {canAfford && benefit.requires_approval && !benefit.instant_approval && (
            <Alert>
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <AlertDescription>
                <strong>Hinweis:</strong> Dieses Benefit muss noch von einem Admin
                genehmigt werden. Die Coins werden sofort abgezogen.
              </AlertDescription>
            </Alert>
          )}

          {canAfford && !benefit.requires_approval && benefit.instant_approval && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Super!</strong> Dieses Benefit ist sofort nach dem Kauf verfügbar!
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPurchasing}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPurchasing || !canAfford}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0"
          >
            {isPurchasing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {!isPurchasing && <Coins className="w-4 h-4 mr-2" />}
            Jetzt kaufen für {coinPrice.toLocaleString('de-DE')} Coins
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
