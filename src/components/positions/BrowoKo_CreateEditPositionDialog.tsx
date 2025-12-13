/**
 * @file components/positions/BrowoKo_CreateEditPositionDialog.tsx
 * @description Dialog for creating/editing positions with 4 tabs
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RichTextEditor } from '../BrowoKo_RichTextEditor';
import { SkillsTagInput } from '../BrowoKo_SkillsTagInput';
import { usePositionsStore } from '../../stores/BrowoKo_positionsStore';
import { useAdminStore } from '../../stores/BrowoKo_adminStore';
import { 
  Position,
  PositionFormData, 
  DEFAULT_POSITION_FORM_DATA,
  POSITION_LEVEL_LABELS,
  POSITION_STATUS_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  EDUCATION_LEVEL_LABELS,
  PositionLevel,
  PositionStatus,
  SalaryCurrency,
  SalaryPeriod,
  ExperienceLevel,
  EducationLevel,
} from '../../types/positions';
import { toast } from 'sonner@2.0.3';
import { Checkbox } from '../ui/checkbox';

interface CreateEditPositionDialogProps {
  open: boolean;
  onClose: () => void;
  position?: Position | null; // null = create, position = edit
}

export function CreateEditPositionDialog({ open, onClose, position }: CreateEditPositionDialogProps) {
  const { createPosition, updatePosition, positions } = usePositionsStore();
  const { departments, locations } = useAdminStore();
  
  const [formData, setFormData] = useState<PositionFormData>(DEFAULT_POSITION_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basis');

  const isEditMode = !!position;

  // Load position data when editing
  useEffect(() => {
    if (position && open) {
      // Find departments and locations for this position
      const positionWithRelations = positions.find(p => p.id === position.id);
      
      setFormData({
        name: position.name,
        level: position.level,
        department_ids: positionWithRelations?.departments?.map(d => d.id) || [],
        location_ids: positionWithRelations?.locations?.map(l => l.id) || [],
        description: position.description || '',
        responsibilities: position.responsibilities || '',
        requirements: position.requirements || DEFAULT_POSITION_FORM_DATA.requirements,
        salary_min: position.salary_min,
        salary_max: position.salary_max,
        salary_currency: position.salary_currency,
        salary_period: position.salary_period,
        reports_to_position_id: position.reports_to_position_id,
        status: position.status,
        open_positions: position.open_positions,
      });
    } else if (!position && open) {
      setFormData(DEFAULT_POSITION_FORM_DATA);
    }
  }, [position, open, positions]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Bitte geben Sie einen Positionsnamen ein');
      setActiveTab('basis');
      return;
    }

    if (formData.department_ids.length === 0) {
      toast.error('Bitte wählen Sie mindestens eine Abteilung aus');
      setActiveTab('basis');
      return;
    }

    if (formData.salary_min && formData.salary_max && formData.salary_min > formData.salary_max) {
      toast.error('Mindestgehalt kann nicht höher als Maximalgehalt sein');
      setActiveTab('gehalt');
      return;
    }

    setLoading(true);

    try {
      if (isEditMode) {
        await updatePosition(position!.id, formData);
      } else {
        await createPosition(formData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save position:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (updates: Partial<PositionFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updateRequirements = (updates: Partial<typeof formData.requirements>) => {
    setFormData(prev => ({
      ...prev,
      requirements: { ...prev.requirements, ...updates },
    }));
  };

  const toggleDepartment = (deptId: string) => {
    setFormData(prev => ({
      ...prev,
      department_ids: prev.department_ids.includes(deptId)
        ? prev.department_ids.filter(id => id !== deptId)
        : [...prev.department_ids, deptId],
    }));
  };

  const toggleLocation = (locId: string) => {
    setFormData(prev => ({
      ...prev,
      location_ids: prev.location_ids.includes(locId)
        ? prev.location_ids.filter(id => id !== locId)
        : [...prev.location_ids, locId],
    }));
  };

  // Filter out current position from "Reports To" dropdown
  const availablePositionsForReportsTo = positions.filter(p => p.id !== position?.id);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? `Position bearbeiten: ${position?.name}` : 'Neue Position anlegen'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="basis">Basis</TabsTrigger>
            <TabsTrigger value="beschreibung">Beschreibung</TabsTrigger>
            <TabsTrigger value="anforderungen">Anforderungen</TabsTrigger>
            <TabsTrigger value="gehalt">Gehalt & Recruiting</TabsTrigger>
          </TabsList>

          {/* TAB 1: BASIS */}
          <TabsContent value="basis" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="name">Positionsname *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="z.B. Senior Entwickler"
                required
              />
            </div>

            <div>
              <Label htmlFor="level">Level *</Label>
              <Select
                value={formData.level || ''}
                onValueChange={(value) => updateFormData({ level: value as PositionLevel })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Level wählen" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(POSITION_LEVEL_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Abteilungen * (Mehrfachauswahl)</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {departments.map((dept) => (
                  <div key={dept.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dept-${dept.id}`}
                      checked={formData.department_ids.includes(dept.id)}
                      onCheckedChange={() => toggleDepartment(dept.id)}
                    />
                    <label htmlFor={`dept-${dept.id}`} className="text-sm cursor-pointer flex-1">
                      {dept.name}
                    </label>
                  </div>
                ))}
              </div>
              {formData.department_ids.length === 0 && (
                <p className="text-sm text-red-500 mt-1">Mindestens eine Abteilung erforderlich</p>
              )}
            </div>

            <div>
              <Label>Standorte (Optional, Mehrfachauswahl)</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {locations.map((loc) => (
                  <div key={loc.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`loc-${loc.id}`}
                      checked={formData.location_ids.includes(loc.id)}
                      onCheckedChange={() => toggleLocation(loc.id)}
                    />
                    <label htmlFor={`loc-${loc.id}`} className="text-sm cursor-pointer flex-1">
                      {loc.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: BESCHREIBUNG */}
          <TabsContent value="beschreibung" className="space-y-4 mt-4">
            <div>
              <Label>Stellenbeschreibung</Label>
              <RichTextEditor
                content={formData.description}
                onChange={(html) => updateFormData({ description: html })}
                placeholder="Beschreiben Sie die Position..."
                minHeight="200px"
              />
            </div>

            <div>
              <Label>Verantwortlichkeiten</Label>
              <RichTextEditor
                content={formData.responsibilities}
                onChange={(html) => updateFormData({ responsibilities: html })}
                placeholder="Was sind die Hauptverantwortlichkeiten dieser Position?"
                minHeight="200px"
              />
            </div>
          </TabsContent>

          {/* TAB 3: ANFORDERUNGEN */}
          <TabsContent value="anforderungen" className="space-y-4 mt-4">
            <div>
              <Label>Skills / Fähigkeiten</Label>
              <SkillsTagInput
                skills={formData.requirements.skills}
                onChange={(skills) => updateRequirements({ skills })}
                placeholder="Skill hinzufügen (z.B. React, TypeScript)..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience">Berufserfahrung</Label>
                <Select
                  value={formData.requirements.experience || ''}
                  onValueChange={(value) => updateRequirements({ experience: value as ExperienceLevel })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Erfahrung wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Keine Angabe</SelectItem>
                    {Object.entries(EXPERIENCE_LEVEL_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="education">Ausbildung</Label>
                <Select
                  value={formData.requirements.education || ''}
                  onValueChange={(value) => updateRequirements({ education: value as EducationLevel })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ausbildung wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Keine Angabe</SelectItem>
                    {Object.entries(EDUCATION_LEVEL_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Zertifizierungen</Label>
              <SkillsTagInput
                skills={formData.requirements.certifications}
                onChange={(certifications) => updateRequirements({ certifications })}
                placeholder="Zertifizierung hinzufügen (z.B. PMP, Scrum Master)..."
              />
            </div>
          </TabsContent>

          {/* TAB 4: GEHALT & RECRUITING */}
          <TabsContent value="gehalt" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salary_min">Mindestgehalt</Label>
                <Input
                  id="salary_min"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.salary_min || ''}
                  onChange={(e) => updateFormData({ salary_min: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="45000"
                />
              </div>
              <div>
                <Label htmlFor="salary_max">Maximalgehalt</Label>
                <Input
                  id="salary_max"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.salary_max || ''}
                  onChange={(e) => updateFormData({ salary_max: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="65000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salary_currency">Währung</Label>
                <Select
                  value={formData.salary_currency}
                  onValueChange={(value) => updateFormData({ salary_currency: value as SalaryCurrency })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CHF">CHF (Fr)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="salary_period">Zeitraum</Label>
                <Select
                  value={formData.salary_period}
                  onValueChange={(value) => updateFormData({ salary_period: value as SalaryPeriod })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yearly">Jährlich</SelectItem>
                    <SelectItem value="monthly">Monatlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="reports_to">Berichtet an</Label>
              <Select
                value={formData.reports_to_position_id || ''}
                onValueChange={(value) => updateFormData({ reports_to_position_id: value || null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Keine Angabe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Keine Angabe</SelectItem>
                  {availablePositionsForReportsTo.map((pos) => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.name} ({pos.level || 'N/A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => updateFormData({ status: value as PositionStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(POSITION_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="open_positions">Offene Stellen</Label>
                <Input
                  id="open_positions"
                  type="number"
                  min="0"
                  value={formData.open_positions}
                  onChange={(e) => updateFormData({ open_positions: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Speichern...' : isEditMode ? 'Aktualisieren' : 'Erstellen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
