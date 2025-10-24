/**
 * ============================================
 * HRTHIS BENEFIT DIALOG (Admin)
 * ============================================
 * Version: 3.8.0 - COIN SHOP
 * Description: Dialog für Benefit erstellen/bearbeiten (Admin + Coin Shop)
 * ============================================
 */

import { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { Coins } from 'lucide-react';
import type { Benefit, BenefitFormData, BenefitPurchaseType } from '../../types/schemas/HRTHIS_benefitSchemas';
import { BENEFIT_CATEGORIES, BENEFIT_CATEGORY_META, BENEFIT_PURCHASE_TYPES } from '../../types/schemas/HRTHIS_benefitSchemas';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: BenefitFormData) => Promise<void>;
  editingBenefit?: Benefit | null;
}

// Lucide Icon Options
const LUCIDE_ICON_OPTIONS = [
  { value: 'Heart', label: 'Herz' },
  { value: 'Car', label: 'Auto' },
  { value: 'DollarSign', label: 'Geld' },
  { value: 'UtensilsCrossed', label: 'Essen' },
  { value: 'GraduationCap', label: 'Bildung' },
  { value: 'Palmtree', label: 'Palme' },
  { value: 'Home', label: 'Haus' },
  { value: 'Gift', label: 'Geschenk' },
  { value: 'Sparkles', label: 'Sterne' },
  { value: 'TrendingUp', label: 'Trend' },
  { value: 'Users', label: 'Team' },
  { value: 'Zap', label: 'Blitz' },
];

export default function HRTHIS_BenefitDialog({
  open,
  onOpenChange,
  onSave,
  editingBenefit,
}: Props) {
  // Form State
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(BENEFIT_CATEGORIES[0]);
  const [icon, setIcon] = useState('Gift');
  const [maxUsers, setMaxUsers] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [eligibilityMonths, setEligibilityMonths] = useState<string>('0');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Coin Shop State (v3.8.0)
  const [coinPrice, setCoinPrice] = useState<string>('');
  const [purchaseType, setPurchaseType] = useState<BenefitPurchaseType>('REQUEST_ONLY');
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [instantApproval, setInstantApproval] = useState(false);

  // Load editing benefit
  useEffect(() => {
    if (editingBenefit) {
      setTitle(editingBenefit.title);
      setShortDescription(editingBenefit.short_description);
      setDescription(editingBenefit.description);
      setCategory(editingBenefit.category);
      setIcon(editingBenefit.icon);
      setMaxUsers(editingBenefit.max_users?.toString() || '');
      setValue(editingBenefit.value?.toString() || '');
      setEligibilityMonths(editingBenefit.eligibility_months.toString());
      setIsActive(editingBenefit.is_active);
      
      // Coin Shop Fields (v3.8.0)
      setCoinPrice(editingBenefit.coin_price?.toString() || '');
      setPurchaseType(editingBenefit.purchase_type || 'REQUEST_ONLY');
      setRequiresApproval(editingBenefit.requires_approval ?? true);
      setInstantApproval(editingBenefit.instant_approval ?? false);
    } else {
      // Reset
      setTitle('');
      setShortDescription('');
      setDescription('');
      setCategory(BENEFIT_CATEGORIES[0]);
      setIcon('Gift');
      setMaxUsers('');
      setValue('');
      setEligibilityMonths('0');
      setIsActive(true);
      
      // Coin Shop Reset (v3.8.0)
      setCoinPrice('');
      setPurchaseType('REQUEST_ONLY');
      setRequiresApproval(true);
      setInstantApproval(false);
    }
  }, [editingBenefit, open]);

  // Save Handler (v3.8.0 - with Coin Shop fields)
  const handleSave = async () => {
    if (!title.trim() || !shortDescription.trim() || !description.trim()) {
      return;
    }

    setSaving(true);
    try {
      const formData: BenefitFormData = {
        title: title.trim(),
        short_description: shortDescription.trim(),
        description: description.trim(),
        category: category as any,
        icon,
        max_users: maxUsers ? parseInt(maxUsers) : null,
        value: value ? parseFloat(value) : null,
        eligibility_months: eligibilityMonths ? parseInt(eligibilityMonths) : 0,
        is_active: isActive,
        
        // Coin Shop Fields (v3.8.0)
        coin_price: coinPrice && purchaseType !== 'REQUEST_ONLY' ? parseInt(coinPrice) : null,
        purchase_type: purchaseType,
        requires_approval: requiresApproval,
        instant_approval: instantApproval,
      };

      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving benefit:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingBenefit ? 'Benefit bearbeiten' : 'Neues Benefit erstellen'}
          </DialogTitle>
          <DialogDescription>
            {editingBenefit ? 'Bearbeite die Details des Benefits' : 'Erstelle ein neues Benefit für deine Mitarbeiter'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Titel */}
          <div>
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Firmenwagen"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100 Zeichen</p>
          </div>

          {/* Kurzbeschreibung */}
          <div>
            <Label htmlFor="short-description">Kurzbeschreibung * (für Karten)</Label>
            <Input
              id="short-description"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="z.B. Elektrofahrzeug zur privaten Nutzung"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">{shortDescription.length}/200 Zeichen</p>
          </div>

          {/* Beschreibung */}
          <div>
            <Label htmlFor="description">Ausführliche Beschreibung *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detaillierte Beschreibung des Benefits..."
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/2000 Zeichen</p>
          </div>

          {/* Kategorie & Icon Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Kategorie */}
            <div>
              <Label htmlFor="category">Kategorie *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[9999]" position="popper" sideOffset={5}>
                  {BENEFIT_CATEGORIES.map((cat) => {
                    const meta = BENEFIT_CATEGORY_META[cat];
                    return (
                      <SelectItem key={cat} value={cat}>
                        {meta.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Icon */}
            <div>
              <Label htmlFor="icon">Icon *</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger id="icon">
                  <SelectValue>
                    {(() => {
                      const IconComponent = (LucideIcons as any)[icon] || LucideIcons.Gift;
                      const iconLabel = LUCIDE_ICON_OPTIONS.find(opt => opt.value === icon)?.label || icon;
                      return (
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" />
                          <span>{iconLabel}</span>
                        </div>
                      );
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-[9999]" position="popper" sideOffset={5}>
                  {LUCIDE_ICON_OPTIONS.map((opt) => {
                    const IconComponent = (LucideIcons as any)[opt.value] || LucideIcons.Gift;
                    return (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" />
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Max Users & Value Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Max Users */}
            <div>
              <Label htmlFor="max-users">Max. Anzahl Nutzer (optional)</Label>
              <Input
                id="max-users"
                type="number"
                min="1"
                value={maxUsers}
                onChange={(e) => setMaxUsers(e.target.value)}
                placeholder="Leer = unbegrenzt"
              />
              <p className="text-xs text-gray-500 mt-1">Leer lassen für unbegrenzt</p>
            </div>

            {/* Value */}
            <div>
              <Label htmlFor="value">Wert in € (optional)</Label>
              <Input
                id="value"
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="z.B. 500.00"
              />
              <p className="text-xs text-gray-500 mt-1">Monetärer Wert des Benefits</p>
            </div>
          </div>

          {/* Eligibility Months */}
          <div>
            <Label htmlFor="eligibility">Mindest-Betriebszugehörigkeit (Monate)</Label>
            <Input
              id="eligibility"
              type="number"
              min="0"
              max="36"
              value={eligibilityMonths}
              onChange={(e) => setEligibilityMonths(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">0 = Sofort verfügbar für alle</p>
          </div>

          <Separator className="my-6" />

          {/* COIN SHOP INTEGRATION (v3.8.0) */}
          <div className="space-y-4 p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Kaufoptionen (Coin Shop)</h3>
            </div>

            {/* Purchase Type */}
            <div>
              <Label className="mb-3 block">Wie können Mitarbeiter dieses Benefit erhalten?</Label>
              <RadioGroup
                value={purchaseType}
                onValueChange={(value) => setPurchaseType(value as BenefitPurchaseType)}
              >
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200">
                  <RadioGroupItem value="REQUEST_ONLY" id="request-only" />
                  <Label htmlFor="request-only" className="cursor-pointer flex-1">
                    <div>
                      <div className="font-medium">Nur per Antrag</div>
                      <div className="text-xs text-gray-500">Klassisches Request-System</div>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200">
                  <RadioGroupItem value="COINS_ONLY" id="coins-only" />
                  <Label htmlFor="coins-only" className="cursor-pointer flex-1">
                    <div>
                      <div className="font-medium">Nur mit Coins kaufbar</div>
                      <div className="text-xs text-gray-500">Direkter Kauf im Coin-Shop</div>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200">
                  <RadioGroupItem value="BOTH" id="both" />
                  <Label htmlFor="both" className="cursor-pointer flex-1">
                    <div>
                      <div className="font-medium">Beides möglich</div>
                      <div className="text-xs text-gray-500">User kann wählen: Coins ODER Antrag</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Coin Price (nur wenn nicht REQUEST_ONLY) */}
            {purchaseType !== 'REQUEST_ONLY' && (
              <div>
                <Label htmlFor="coin-price">Coin-Preis *</Label>
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-orange-600" />
                  <Input
                    id="coin-price"
                    type="number"
                    min="1"
                    value={coinPrice}
                    onChange={(e) => setCoinPrice(e.target.value)}
                    placeholder="z.B. 500"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Wie viele Coins kostet dieses Benefit?
                </p>
              </div>
            )}

            {/* Approval Settings (nur wenn Coins aktiv) */}
            {purchaseType !== 'REQUEST_ONLY' && (
              <div className="space-y-3 mt-4 p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requires-approval" className="cursor-pointer">
                      Genehmigung erforderlich
                    </Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Auch Coin-Käufe müssen genehmigt werden
                    </p>
                  </div>
                  <Switch
                    id="requires-approval"
                    checked={requiresApproval}
                    onCheckedChange={setRequiresApproval}
                  />
                </div>

                {!requiresApproval && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <Label htmlFor="instant-approval" className="cursor-pointer">
                        Sofort verfügbar nach Kauf
                      </Label>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Benefit ist direkt nach Kauf aktiv
                      </p>
                    </div>
                    <Switch
                      id="instant-approval"
                      checked={instantApproval}
                      onCheckedChange={setInstantApproval}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Is Active Switch */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="is-active" className="cursor-pointer">
                Benefit aktiviert
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Deaktivierte Benefits sind für Mitarbeiter nicht sichtbar
              </p>
            </div>
            <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || !shortDescription.trim() || !description.trim() || saving}
          >
            {saving ? 'Wird gespeichert...' : 'Speichern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
