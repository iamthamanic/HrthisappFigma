/**
 * @file HRTHIS_PersonalInfoCard.tsx (Admin Version)
 * @version v4.8.0 - Card-Level Editing
 * @description Personal information card with individual edit button for ADMIN
 */

import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Edit, X, Save } from '../icons/HRTHISIcons';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface PersonalInfoCardProps {
  user: any;
  canEdit: boolean;
  onEditStart: () => boolean;
  onEditEnd: () => void;
  onDataUpdated?: () => void;
}

export function PersonalInfoCard({ user, canEdit, onEditStart, onEditEnd, onDataUpdated }: PersonalInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [birthDate, setBirthDate] = useState(user?.birth_date || '');
  const [gender, setGender] = useState(user?.gender || '');

  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(isEditing ? birthDate : user?.birth_date);

  const handleEdit = () => {
    const allowed = onEditStart();
    if (!allowed) return;
    
    setFirstName(user?.first_name || '');
    setLastName(user?.last_name || '');
    setPhone(user?.phone || '');
    setBirthDate(user?.birth_date || '');
    setGender(user?.gender || '');
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
          phone: phone || null,
          birth_date: birthDate || null,
          gender: gender || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Persönliche Daten gespeichert');
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
          <h2 className="font-medium text-gray-900">Persönliche Daten</h2>
          
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
              <div className="space-y-2">
                <Label>Vorname *</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nachname *</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Telefonnummer</Label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Geburtsdatum</Label>
                <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                {age !== null && <p className="text-xs text-gray-500">Alter: {age} Jahre</p>}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Geschlecht</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bitte wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Männlich</SelectItem>
                    <SelectItem value="female">Weiblich</SelectItem>
                    <SelectItem value="diverse">Divers</SelectItem>
                    <SelectItem value="prefer_not_to_say">Keine Angabe</SelectItem>
                  </SelectContent>
                </Select>
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
              <Label>Vorname</Label>
              <div className="field-readonly-v2 mt-1">{user.first_name}</div>
            </div>
            <div>
              <Label>Nachname</Label>
              <div className="field-readonly-v2 mt-1">{user.last_name}</div>
            </div>
            <div>
              <Label>E-Mail (System)</Label>
              <div className="field-readonly-v2 mt-1">{user.email}</div>
            </div>
            <div>
              <Label>Telefonnummer</Label>
              <div className={`field-readonly-v2 mt-1 ${!user.phone ? 'field-readonly-v2-empty' : ''}`}>
                {user.phone || 'Nicht angegeben'}
              </div>
            </div>
            <div>
              <Label>Geburtsdatum</Label>
              <div className={`field-readonly-v2 mt-1 ${!user.birth_date ? 'field-readonly-v2-empty' : ''}`}>
                {user.birth_date ? new Date(user.birth_date).toLocaleDateString('de-DE') : 'Nicht angegeben'}
              </div>
              {age !== null && <p className="text-xs text-gray-500 mt-1">Alter: {age} Jahre</p>}
            </div>
            <div>
              <Label>Geschlecht</Label>
              <div className={`field-readonly-v2 mt-1 ${!user.gender ? 'field-readonly-v2-empty' : ''}`}>
                {user.gender === 'male' ? 'Männlich' :
                 user.gender === 'female' ? 'Weiblich' :
                 user.gender === 'diverse' ? 'Divers' :
                 user.gender === 'prefer_not_to_say' ? 'Keine Angabe' :
                 'Nicht angegeben'}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
