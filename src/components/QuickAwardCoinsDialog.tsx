import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Coins, Loader2, Sparkles } from './icons/HRTHISIcons';
import { User } from '../types/database';

interface QuickAwardCoinsDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onAward: (userId: string, amount: number, reason: string) => Promise<void>;
}

export default function QuickAwardCoinsDialog({
  user,
  isOpen,
  onClose,
  onAward,
}: QuickAwardCoinsDialogProps) {
  const [awarding, setAwarding] = useState(false);
  const [amount, setAmount] = useState(50);
  const [reason, setReason] = useState('');

  const handleAward = async () => {
    if (!user || amount <= 0) return;

    setAwarding(true);
    try {
      await onAward(user.id, amount, reason);
      handleClose();
    } catch (error) {
      console.error('Award coins error:', error);
    } finally {
      setAwarding(false);
    }
  };

  const handleClose = () => {
    setAmount(50);
    setReason('');
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-600" />
            Coins vergeben
          </DialogTitle>
          <DialogDescription>
            Belohne {user.first_name} {user.last_name} mit Coins
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Coins Amount */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Anzahl Coins</Label>
              <div className="flex items-center gap-2 text-2xl font-semibold text-yellow-600">
                <Coins className="w-6 h-6" />
                {amount}
              </div>
            </div>
            
            <Slider
              value={[amount]}
              onValueChange={(value) => setAmount(value[0])}
              min={10}
              max={500}
              step={10}
              disabled={awarding}
              className="w-full"
            />

            {/* Quick Select Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[50, 100, 200, 500].map((value) => (
                <Button
                  key={value}
                  variant={amount === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAmount(value)}
                  disabled={awarding}
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Grund (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="z.B. Tolle Arbeit im Projekt X, Hilfe für Kollegen..."
              rows={4}
              disabled={awarding}
              className="resize-none"
            />
          </div>

          {/* Preview */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">
                  Belohnung wird vergeben
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  {user.first_name} erhält {amount} Coins{reason && ` für: "${reason}"`}
                </p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-900">
              <strong>Hinweis:</strong> Der Mitarbeiter erhält eine Benachrichtigung über die Belohnung.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={awarding}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleAward}
            disabled={awarding || amount <= 0}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          >
            {awarding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Coins className="w-4 h-4 mr-2" />
            {amount} Coins vergeben
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
