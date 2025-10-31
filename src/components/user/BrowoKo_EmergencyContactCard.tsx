/**
 * @file BrowoKo_EmergencyContactCard.tsx
 * @version v4.8.0
 * @description Emergency Contacts Card with card-level editing
 */

import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Phone, Edit, X, Save, Plus, Trash2 } from '../icons/BrowoKoIcons';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface EmergencyContact {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
}

interface EmergencyContactCardProps {
  user: any;
  canEdit: boolean;
  onEditStart: () => boolean;
  onEditEnd: () => void;
  onDataUpdated?: () => void;
  permissions: any;
}

export function EmergencyContactCard({ user, canEdit, onEditStart, onEditEnd, onDataUpdated, permissions }: EmergencyContactCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [contacts, setContacts] = useState<EmergencyContact[]>(
    user?.emergency_contacts || []
  );

  const handleEdit = () => {
    const allowed = onEditStart();
    if (!allowed) return;
    
    setContacts(user?.emergency_contacts || []);
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
          emergency_contacts: contacts,
        })
        .eq('id', authUser.id);

      if (error) throw error;

      toast.success('Notfallkontakte gespeichert');
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

  const addContact = () => {
    setContacts([...contacts, { first_name: '', last_name: '', phone: '', email: '' }]);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
  };

  if (!user) return null;

  const displayContacts = isEditing ? contacts : (user.emergency_contacts || []);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-900 flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Notfallkontakte
          </h2>
          
          {!isEditing && permissions.canEditEmergencyContacts && (
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
            {contacts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Noch keine Notfallkontakte. Klicken Sie auf "Kontakt hinzufügen".
              </p>
            ) : (
              <div className="space-y-4">
                {contacts.map((contact, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Notfallkontakt {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContact(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Vorname</Label>
                        <Input
                          value={contact.first_name}
                          onChange={(e) => updateContact(index, 'first_name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nachname</Label>
                        <Input
                          value={contact.last_name}
                          onChange={(e) => updateContact(index, 'last_name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefon</Label>
                        <Input
                          type="tel"
                          value={contact.phone}
                          onChange={(e) => updateContact(index, 'phone', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>E-Mail</Label>
                        <Input
                          type="email"
                          value={contact.email}
                          onChange={(e) => updateContact(index, 'email', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={addContact}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Notfallkontakt hinzufügen
            </Button>

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
          <div className="space-y-4">
            {displayContacts.length === 0 ? (
              <p className="text-sm text-gray-500">Keine Notfallkontakte hinterlegt</p>
            ) : (
              displayContacts.map((contact: EmergencyContact, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Notfallkontakt {index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Vorname</Label>
                      <div className={`field-readonly-v2 mt-1 ${!contact.first_name ? 'field-readonly-v2-empty' : ''}`}>
                        {contact.first_name || 'Nicht angegeben'}
                      </div>
                    </div>
                    <div>
                      <Label>Nachname</Label>
                      <div className={`field-readonly-v2 mt-1 ${!contact.last_name ? 'field-readonly-v2-empty' : ''}`}>
                        {contact.last_name || 'Nicht angegeben'}
                      </div>
                    </div>
                    <div>
                      <Label>Telefon</Label>
                      <div className={`field-readonly-v2 mt-1 ${!contact.phone ? 'field-readonly-v2-empty' : ''}`}>
                        {contact.phone || 'Nicht angegeben'}
                      </div>
                    </div>
                    <div>
                      <Label>E-Mail</Label>
                      <div className={`field-readonly-v2 mt-1 ${!contact.email ? 'field-readonly-v2-empty' : ''}`}>
                        {contact.email || 'Nicht angegeben'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
