/**
 * @file HRTHIS_BankInfoCard.tsx (Admin Version)
 * @version v4.8.0 - Card-Level Editing
 * @description Bank info card with individual edit button for ADMIN
 */

import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Briefcase, Edit, X, Save } from '../icons/HRTHISIcons';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface BankInfoCardProps {
  user: any;
  canEdit: boolean;
  onEditStart: () => boolean;
  onEditEnd: () => void;
  onDataUpdated?: () => void;
}

export function BankInfoCard({ user, canEdit, onEditStart, onEditEnd, onDataUpdated }: BankInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [bankName, setBankName] = useState(user?.bank_name || '');
  const [iban, setIban] = useState(user?.iban || '');
  const [bic, setBic] = useState(user?.bic || '');

  const handleEdit = () => {
    const allowed = onEditStart();
    if (!allowed) return;
    
    setBankName(user?.bank_name || '');
    setIban(user?.iban || '');
    setBic(user?.bic || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    onEditEnd();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          bank_name: bankName || null,
          iban: iban || null,
          bic: bic || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Bankverbindung gespeichert');
      setIsEditing(false);
      onEditEnd();
      if (onDataUpdated) onDataUpdated();
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error('Fehler beim Speichern: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Bankverbindung
          </h2>
          
          {!isEditing && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEdit}
                      disabled={!canEdit}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Bearbeiten
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canEdit && (
                  <TooltipContent>
                    <p>Bitte speichern oder abbrechen Sie erst die aktuelle Bearbeitung</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Bankname</Label>
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input 
                  value={iban} 
                  onChange={(e) => setIban(e.target.value.toUpperCase())} 
                  placeholder="DE89 3704 0044 0532 0130 00"
                />
              </div>
              <div className="space-y-2">
                <Label>BIC</Label>
                <Input 
                  value={bic} 
                  onChange={(e) => setBic(e.target.value.toUpperCase())} 
                  placeholder="COBADEFFXXX"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="w-4 h-4 mr-2" />
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Speichert...' : 'Speichern'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Bankname</Label>
              <div className={`field-readonly-v2 mt-1 ${!user.bank_name ? 'field-readonly-v2-empty' : ''}`}>
                {user.bank_name || 'Nicht angegeben'}
              </div>
            </div>
            <div>
              <Label>IBAN</Label>
              <div className={`field-readonly-v2 mt-1 ${!user.iban ? 'field-readonly-v2-empty' : ''}`}>
                {user.iban || 'Nicht angegeben'}
              </div>
            </div>
            <div>
              <Label>BIC</Label>
              <div className={`field-readonly-v2 mt-1 ${!user.bic ? 'field-readonly-v2-empty' : ''}`}>
                {user.bic || 'Nicht angegeben'}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
