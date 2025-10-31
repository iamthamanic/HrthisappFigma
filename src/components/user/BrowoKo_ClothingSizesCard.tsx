/**
 * @file BrowoKo_ClothingSizesCard.tsx
 * @version v4.8.0
 * @description Clothing Sizes Card with card-level editing
 */

import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Package, Edit, X, Save } from '../icons/BrowoKoIcons';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface ClothingSizesCardProps {
  user: any;
  canEdit: boolean;
  onEditStart: () => boolean;
  onEditEnd: () => void;
  onDataUpdated?: () => void;
  permissions: any;
}

export function ClothingSizesCard({ user, canEdit, onEditStart, onEditEnd, onDataUpdated, permissions }: ClothingSizesCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [shirtSize, setShirtSize] = useState(user?.shirt_size || '');
  const [pantsSize, setPantsSize] = useState(user?.pants_size || '');
  const [shoeSize, setShoeSize] = useState(user?.shoe_size || '');
  const [jacketSize, setJacketSize] = useState(user?.jacket_size || '');

  const handleEdit = () => {
    const allowed = onEditStart();
    if (!allowed) return;
    
    setShirtSize(user?.shirt_size || '');
    setPantsSize(user?.pants_size || '');
    setShoeSize(user?.shoe_size || '');
    setJacketSize(user?.jacket_size || '');
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
          shirt_size: shirtSize || null,
          pants_size: pantsSize || null,
          shoe_size: shoeSize || null,
          jacket_size: jacketSize || null,
        })
        .eq('id', authUser.id);

      if (error) throw error;

      toast.success('Kleidergrößen gespeichert');
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
            <Package className="w-5 h-5" />
            Arbeitskleidung Größen
          </h2>
          
          {!isEditing && permissions.canEditClothingSizes && (
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
                <Label>Hemdgröße</Label>
                <Input 
                  value={shirtSize} 
                  onChange={(e) => setShirtSize(e.target.value)} 
                  placeholder="z.B. M, L, XL"
                />
              </div>
              <div className="space-y-2">
                <Label>Hosengröße</Label>
                <Input 
                  value={pantsSize} 
                  onChange={(e) => setPantsSize(e.target.value)} 
                  placeholder="z.B. 32, 34"
                />
              </div>
              <div className="space-y-2">
                <Label>Schuhgröße</Label>
                <Input 
                  value={shoeSize} 
                  onChange={(e) => setShoeSize(e.target.value)} 
                  placeholder="z.B. 42, 43"
                />
              </div>
              <div className="space-y-2">
                <Label>Jackengröße</Label>
                <Input 
                  value={jacketSize} 
                  onChange={(e) => setJacketSize(e.target.value)} 
                  placeholder="z.B. M, L, XL"
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
            <div>
              <Label>Hemdgröße</Label>
              <div className={`field-readonly-v2 mt-1 ${!user.shirt_size ? 'field-readonly-v2-empty' : ''}`}>
                {user.shirt_size || 'Nicht angegeben'}
              </div>
            </div>
            <div>
              <Label>Hosengröße</Label>
              <div className={`field-readonly-v2 mt-1 ${!user.pants_size ? 'field-readonly-v2-empty' : ''}`}>
                {user.pants_size || 'Nicht angegeben'}
              </div>
            </div>
            <div>
              <Label>Schuhgröße</Label>
              <div className={`field-readonly-v2 mt-1 ${!user.shoe_size ? 'field-readonly-v2-empty' : ''}`}>
                {user.shoe_size || 'Nicht angegeben'}
              </div>
            </div>
            <div>
              <Label>Jackengröße</Label>
              <div className={`field-readonly-v2 mt-1 ${!user.jacket_size ? 'field-readonly-v2-empty' : ''}`}>
                {user.jacket_size || 'Nicht angegeben'}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
