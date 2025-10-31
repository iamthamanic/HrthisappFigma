/**
 * ============================================
 * BROWOKO COIN WALLET WIDGET
 * ============================================
 * Version: 3.10.2
 * Description: Header Widget das aktuelle Coin-Balance anzeigt (Click-to-Expand)
 * Features:
 * - Shows current balance
 * - Click opens full stats dialog
 * - Yearly tracking support
 * - Dropdown button indicator for better UX
 * ============================================
 */

import { useEffect, useState } from 'react';
import { Coins, ChevronDown } from 'lucide-react';
import { useGamificationStore } from '../stores/gamificationStore';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import BrowoKo_CoinStatsDialog from './BrowoKo_CoinStatsDialog';

export default function HRTHIS_CoinWalletWidget() {
  const { profile } = useAuthStore();
  const { coins, loadCoinBalance } = useGamificationStore();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Load coin balance on mount
  useEffect(() => {
    if (profile?.id) {
      loadCoinBalance(profile.id);
    }
  }, [profile?.id, loadCoinBalance]);

  // Safely handle null/undefined balance - use 'coins' which is a number
  const balance = coins ?? 0;
  
  // Format number with thousand separators (German style)
  const formattedBalance = balance.toLocaleString('de-DE');

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-lg hover:from-yellow-100 hover:to-orange-100 hover:border-orange-300 transition-all cursor-pointer group"
        title="Klicke für detaillierte Statistiken"
      >
        <Coins className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 leading-none">Coins</span>
          <span className="text-sm font-semibold text-gray-900 leading-none mt-0.5">
            {formattedBalance}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-orange-500 group-hover:text-orange-600 group-hover:translate-y-0.5 transition-all ml-0.5" />
      </button>

      <BrowoKo_CoinStatsDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
      />
    </>
  );
}
