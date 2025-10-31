/**
 * @file BrowoKo_PersonalInfoCard_v2.tsx
 * @version v4.8.0
 * @description Personal information card with CARD-LEVEL editing
 */

import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar as CalendarUI } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Calendar, Edit, X, Save } from '../icons/BrowoKoIcons';
import { format, differenceInYears } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface PersonalInfoCardV2Props {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    private_email?: string;
    phone?: string;
    birth_date?: string;
    gender?: string;
  };
  canEdit: boolean;
  onEditStart: () => boolean;
  onEditEnd: () => void;
  onDataUpdated?: () => void;
}

function calculateAge(birthDate: string | undefined): number | null {
  if (!birthDate) return null;
  try {
    return differenceInYears(new Date(), new Date(birthDate));
  } catch {
    return null;
  }
}

function formatGender(gender: string | undefined): string {
  if (!gender) return 'Nicht angegeben';
  switch (gender) {
    case 'male': return 'Männlich';
    case 'female': return 'Weiblich';
    case 'diverse': return 'Divers';
    default: return 'Nicht angegeben';
  }
}

export function PersonalInfoCardV2({ 
  user, 
  canEdit, 
  onEditStart, 
  onEditEnd,
  onDataUpdated 
}: PersonalInfoCardV2Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [privateEmail, setPrivateEmail] = useState(user.private_email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [birthDate, setBirthDate] = useState(user.birth_date || '');
  const [gender, setGender] = useState(user.gender || '');

  const age = calculateAge(isEditing ? birthDate : user.birth_date);

  const handleEditClick = () => {
    const allowed = onEditStart();
    if (!allowed) return;

    // Reset form to current values
    setFirstName(user.first_name);
    setLastName(user.last_name);
    setPrivateEmail(user.private_email || '');
    setPhone(user.phone || '');
    setBirthDate(user.birth_date || '');
    setGender(user.gender || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    onEditEnd();
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Vorname und Nachname sind Pflichtfelder');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          private_email: privateEmail || null,
          phone: phone || null,
          birth_date: birthDate || null,
          gender: gender || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Persönliche Daten erfolgreich gespeichert');
      setIsEditing(false);
      onEditEnd();
      if (onDataUpdated) onDataUpdated();
    } catch (error: any) {
      console.error('Error saving personal info:', error);
      toast.error('Fehler beim Speichern: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-900">Persönliche Daten</h2>
          
          {!isEditing && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditClick}
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
                <Label htmlFor="first_name">Vorname *</Label>
                <Input
                  id="first_name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Anna"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Nachname *</Label>
                <Input
                  id="last_name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Muster"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date">Geburtsdatum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {birthDate
                        ? format(new Date(birthDate), 'dd.MM.yyyy', { locale: de })
                        : 'Datum wählen'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarUI
                      mode="single"
                      selected={birthDate ? new Date(birthDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setBirthDate(format(date, 'yyyy-MM-dd'));
                        }
                      }}
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                      initialFocus
                      locale={de}
                    />
                  </PopoverContent>
                </Popover>
                {age !== null && (
                  <p className="text-xs text-gray-500">Alter: {age} Jahre</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Geschlecht</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bitte wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Männlich</SelectItem>
                    <SelectItem value="female">Weiblich</SelectItem>
                    <SelectItem value="diverse">Divers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="private_email">Private E-Mail-Adresse</Label>
                <Input
                  id="private_email"
                  type="email"
                  value={privateEmail}
                  onChange={(e) => setPrivateEmail(e.target.value)}
                  placeholder="anna@beispiel.de"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefonnummer</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+49 30 12345678"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
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
              <Label>Vorname</Label>
              <div className="field-readonly-v2 mt-1">{user.first_name}</div>
            </div>

            <div>
              <Label>Nachname</Label>
              <div className="field-readonly-v2 mt-1">{user.last_name}</div>
            </div>

            <div>
              <Label>Geburtsdatum</Label>
              <div className={`field-readonly-v2 mt-1 ${!user.birth_date ? 'field-readonly-v2-empty' : ''}`}>
                {user.birth_date
                  ? format(new Date(user.birth_date), 'dd.MM.yyyy', { locale: de })
                  : 'Nicht angegeben'}
              </div>
              {age !== null && (
                <p className="text-xs text-gray-500 mt-1">Alter: {age} Jahre</p>
              )}
            </div>

            <div>
              <Label>Geschlecht</Label>
              <div className={`field-readonly-v2 mt-1 ${!user.gender ? 'field-readonly-v2-empty' : ''}`}>
                {formatGender(user.gender)}
              </div>
            </div>

            <div>
              <Label>Private E-Mail-Adresse</Label>
              <div className={`field-readonly-v2 mt-1 ${!user.private_email ? 'field-readonly-v2-empty' : ''}`}>
                {user.private_email || 'Nicht angegeben'}
              </div>
            </div>

            <div>
              <Label>Telefonnummer</Label>
              <div className={`field-readonly-v2 mt-1 ${!user.phone ? 'field-readonly-v2-empty' : ''}`}>
                {user.phone || 'Nicht angegeben'}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
