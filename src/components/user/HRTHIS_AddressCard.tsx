/**
 * @file HRTHIS_AddressCard.tsx
 * @version v4.8.0
 * @description Address Card with card-level editing for MeineDaten
 * @version v4.10.16 - Updated reference from PersonalSettings to MeineDaten
 */

import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { MapPin, Edit, X, Save } from '../icons/HRTHISIcons';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface AddressCardProps {
  user: any;
  canEdit: boolean;
  onEditStart: () => boolean;
  onEditEnd: () => void;
  onDataUpdated?: () => void;
  permissions: any;
}

export function AddressCard({ user, canEdit, onEditStart, onEditEnd, onDataUpdated, permissions }: AddressCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [street, setStreet] = useState(user?.street || '');
  const [houseNumber, setHouseNumber] = useState(user?.house_number || '');
  const [zipCode, setZipCode] = useState(user?.zip_code || '');
  const [city, setCity] = useState(user?.city || '');
  const [country, setCountry] = useState(user?.country || '');
  const [state, setState] = useState(user?.state || '');

  const handleEdit = () => {
    const allowed = onEditStart();
    if (!allowed) return;
    
    setStreet(user?.street || '');
    setHouseNumber(user?.house_number || '');
    setZipCode(user?.zip_code || '');
    setCity(user?.city || '');
    setCountry(user?.country || '');
    setState(user?.state || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    onEditEnd();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Nicht angemeldet');

      const { error } = await supabase
        .from('users')
        .update({
          street: street || null,
          house_number: houseNumber || null,
          zip_code: zipCode || null,
          city: city || null,
          country: country || null,
          state: state || null,
        })
        .eq('id', authUser.id);

      if (error) throw error;

      toast.success('Adresse gespeichert');
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
            <MapPin className="w-5 h-5" />
            Adresse
          </h2>
          
          {!isEditing && permissions.canEditAddress && (
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
              <div className="space-y-2">
                <Label>Straße</Label>
                <Input value={street} onChange={(e) => setStreet(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hausnummer</Label>
                <Input value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>PLZ</Label>
                <Input value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Stadt</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Land</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Bundesland</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} />
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
            <div>
              <Label>Straße</Label>
              <div className={`field-readonly-v2 mt-1 ${!user.street ? 'field-readonly-v2-empty' : ''}`}>
                {user.street || 'Nicht angegeben'}
              </div>
            </div>
            <div>
              <Label>Hausnummer</Label>
              <div className={`field-readonly-v2 mt-1 ${!user.house_number ? 'field-readonly-v2-empty' : ''}`}>
                {user.house_number || 'Nicht angegeben'}
              </div>
            </div>
            <div>
              <Label>PLZ</Label>
              <div className={`field-readonly-v2 mt-1 ${!user.zip_code ? 'field-readonly-v2-empty' : ''}`}>
                {user.zip_code || 'Nicht angegeben'}
              </div>
            </div>
            <div>
              <Label>Stadt</Label>
              <div className={`field-readonly-v2 mt-1 ${!user.city ? 'field-readonly-v2-empty' : ''}`}>
                {user.city || 'Nicht angegeben'}
              </div>
            </div>
            <div>
              <Label>Land</Label>
              <div className={`field-readonly-v2 mt-1 ${!user.country ? 'field-readonly-v2-empty' : ''}`}>
                {user.country || 'Nicht angegeben'}
              </div>
            </div>
            <div>
              <Label>Bundesland</Label>
              <div className={`field-readonly-v2 mt-1 ${!user.state ? 'field-readonly-v2-empty' : ''}`}>
                {user.state || 'Nicht angegeben'}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
