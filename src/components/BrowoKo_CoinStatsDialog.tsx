/**
 * ============================================
 * BROWOKO COIN STATS DIALOG
 * ============================================
 * Version: 3.10.0
 * Description: Full Coin Statistics Dialog (Click-to-Expand from Wallet Widget)
 * Features:
 * - Current Balance
 * - Yearly Stats (earned/spent)
 * - All-Time Stats
 * - Recent Transactions
 * ============================================
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Coins, TrendingUp, TrendingDown, Calendar, History } from 'lucide-react';
import { useGamificationStore } from '../stores/gamificationStore';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import { useEffect } from 'react';

interface CoinStatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HRTHIS_CoinStatsDialog({ open, onOpenChange }: CoinStatsDialogProps) {
  const { profile } = useAuthStore();
  const { coinBalance, recentTransactions, loadCoinBalance, loadRecentTransactions } = useGamificationStore();

  // Load data when dialog opens
  useEffect(() => {
    if (open && profile?.id) {
      loadCoinBalance(profile.id);
      loadRecentTransactions(profile.id);
    }
  }, [open, profile?.id, loadCoinBalance, loadRecentTransactions]);

  const balance = coinBalance?.current_balance ?? 0;
  const yearlyEarned = coinBalance?.yearly_earned ?? 0;
  const yearlySpent = coinBalance?.yearly_spent ?? 0;
  const totalEarned = coinBalance?.total_earned ?? 0;
  const totalSpent = coinBalance?.total_spent ?? 0;
  const currentYear = coinBalance?.current_year ?? new Date().getFullYear();

  const formattedBalance = balance.toLocaleString('de-DE');
  const formattedYearlyEarned = yearlyEarned.toLocaleString('de-DE');
  const formattedYearlySpent = yearlySpent.toLocaleString('de-DE');
  const formattedTotalEarned = totalEarned.toLocaleString('de-DE');
  const formattedTotalSpent = totalSpent.toLocaleString('de-DE');

  // Calculate yearly net
  const yearlyNet = yearlyEarned - yearlySpent;
  const formattedYearlyNet = Math.abs(yearlyNet).toLocaleString('de-DE');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Coin Statistiken</DialogTitle>
          <DialogDescription>
            Deine vollständige Coin-Übersicht
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Balance - Hero Card */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Aktueller Coin-Stand</p>
                <p className="text-4xl font-bold text-gray-900">{formattedBalance}</p>
                <p className="text-sm text-gray-500 mt-1">Verfügbare Coins</p>
              </div>
              <div className="bg-orange-100 p-4 rounded-full">
                <Coins className="w-10 h-10 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Yearly Stats */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">{currentYear} Statistiken</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Yearly Earned */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-gray-600">Verdient</p>
                </div>
                <p className="text-2xl font-bold text-green-700">{formattedYearlyEarned}</p>
                <p className="text-xs text-gray-500 mt-1">Coins in {currentYear}</p>
              </div>

              {/* Yearly Spent */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-gray-600">Ausgegeben</p>
                </div>
                <p className="text-2xl font-bold text-red-700">{formattedYearlySpent}</p>
                <p className="text-xs text-gray-500 mt-1">Coins in {currentYear}</p>
              </div>

              {/* Yearly Net */}
              <div className={`${yearlyNet >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-4 h-4 text-gray-600" />
                  <p className="text-sm text-gray-600">Netto</p>
                </div>
                <p className={`text-2xl font-bold ${yearlyNet >= 0 ? 'text-blue-700' : 'text-gray-700'}`}>
                  {yearlyNet >= 0 ? '+' : '-'}{formattedYearlyNet}
                </p>
                <p className="text-xs text-gray-500 mt-1">Gewinn/Verlust {currentYear}</p>
              </div>
            </div>
          </div>

          {/* All-Time Stats */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Gesamt-Statistiken</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total Earned */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Gesamt verdient</p>
                <p className="text-2xl font-bold text-gray-900">{formattedTotalEarned}</p>
                <p className="text-xs text-gray-500 mt-1">Alle Zeiten</p>
              </div>

              {/* Total Spent */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Gesamt ausgegeben</p>
                <p className="text-2xl font-bold text-gray-900">{formattedTotalSpent}</p>
                <p className="text-xs text-gray-500 mt-1">Alle Zeiten</p>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Letzte Transaktionen</h3>
            
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <Coins className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Noch keine Transaktionen</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentTransactions.slice(0, 10).map((transaction) => {
                  const isEarned = transaction.type === 'EARNED';
                  const amount = Math.abs(transaction.amount);
                  const formattedAmount = amount.toLocaleString('de-DE');
                  const date = new Date(transaction.created_at).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`${isEarned ? 'bg-green-100' : 'bg-red-100'} p-2 rounded-full`}>
                          {isEarned ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{transaction.reason}</p>
                          <p className="text-xs text-gray-500">{date}</p>
                        </div>
                      </div>
                      <div className={`text-right`}>
                        <p className={`font-semibold ${isEarned ? 'text-green-600' : 'text-red-600'}`}>
                          {isEarned ? '+' : '-'}{formattedAmount}
                        </p>
                        <p className="text-xs text-gray-500">Coins</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
