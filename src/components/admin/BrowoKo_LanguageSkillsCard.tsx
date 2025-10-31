/**
 * @file BrowoKo_LanguageSkillsCard.tsx (Admin Version)
 * @version v4.8.0 - Card-Level Editing
 * @description Language skills card with individual edit button for ADMIN
 */

import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Globe, Edit, X, Save, Plus, Trash2 } from '../icons/BrowoKoIcons';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface LanguageSkill {
  language: string;
  level: string;
}

interface LanguageSkillsCardProps {
  user: any;
  canEdit: boolean;
  onEditStart: () => boolean;
  onEditEnd: () => void;
  onDataUpdated?: () => void;
}

const LEVEL_LABELS: Record<string, string> = {
  'native': 'Muttersprache',
  'C2': 'C2 - Nahezu muttersprachlich',
  'C1': 'C1 - Fortgeschritten',
  'B2': 'B2 - Selbstständig',
  'B1': 'B1 - Mittelstufe',
  'A2': 'A2 - Grundlegend',
  'A1': 'A1 - Anfänger',
};

export function LanguageSkillsCard({ user, canEdit, onEditStart, onEditEnd, onDataUpdated }: LanguageSkillsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [skills, setSkills] = useState<LanguageSkill[]>(
    user?.language_skills || []
  );

  const handleEdit = () => {
    const allowed = onEditStart();
    if (!allowed) return;
    
    setSkills(user?.language_skills || []);
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
          language_skills: skills,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Sprachkenntnisse gespeichert');
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

  const addSkill = () => {
    setSkills([...skills, { language: '', level: '' }]);
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const updateSkill = (index: number, field: keyof LanguageSkill, value: string) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], [field]: value };
    setSkills(updated);
  };

  if (!user) return null;

  const displaySkills = isEditing ? skills : (user.language_skills || []);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Sprachkenntnisse
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
            {skills.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Noch keine Sprachkenntnisse. Klicken Sie auf "Sprache hinzufügen".
              </p>
            ) : (
              <div className="space-y-4">
                {skills.map((skill, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Sprache {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSkill(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Sprache</Label>
                        <Input
                          value={skill.language}
                          onChange={(e) => updateSkill(index, 'language', e.target.value)}
                          placeholder="z.B. Englisch, Spanisch"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Niveau</Label>
                        <Select
                          value={skill.level}
                          onValueChange={(value) => updateSkill(index, 'level', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Wählen Sie ein Niveau" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="native">Muttersprache</SelectItem>
                            <SelectItem value="C2">C2 - Nahezu muttersprachlich</SelectItem>
                            <SelectItem value="C1">C1 - Fortgeschritten</SelectItem>
                            <SelectItem value="B2">B2 - Selbstständig</SelectItem>
                            <SelectItem value="B1">B1 - Mittelstufe</SelectItem>
                            <SelectItem value="A2">A2 - Grundlegend</SelectItem>
                            <SelectItem value="A1">A1 - Anfänger</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={addSkill}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Sprache hinzufügen
            </Button>

            <p className="text-xs text-gray-500 mt-3">
              CEFR-Stufen: A1/A2 (Anfänger), B1/B2 (Mittelstufe), C1/C2 (Fortgeschritten)
            </p>

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
            {displaySkills.length === 0 ? (
              <p className="text-sm text-gray-500">Keine Sprachkenntnisse hinterlegt</p>
            ) : (
              displaySkills.map((skill: LanguageSkill, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Sprache</Label>
                      <div className={`field-readonly-v2 mt-1 ${!skill.language ? 'field-readonly-v2-empty' : ''}`}>
                        {skill.language || 'Nicht angegeben'}
                      </div>
                    </div>
                    <div>
                      <Label>Niveau</Label>
                      <div className={`field-readonly-v2 mt-1 ${!skill.level ? 'field-readonly-v2-empty' : ''}`}>
                        {skill.level ? LEVEL_LABELS[skill.level] || skill.level : 'Nicht angegeben'}
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
