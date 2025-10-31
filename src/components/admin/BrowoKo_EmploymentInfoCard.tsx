/**
 * @file BrowoKo_EmploymentInfoCard.tsx (v4.8.0 - Card-Level Editing)
 * @domain HR - Team Member Details
 * @description Employment information form card with card-level editing
 * Includes: Basic employment info, break settings, work time model, and on-call status
 */

import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Briefcase, Edit, X, Save } from '../icons/BrowoKoIcons';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface Team {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface EmploymentInfoCardProps {
  user: any;
  teams: Team[];
  locations: Location[];
  departments: Department[];
  userTeams: string[];
  teamRoles: Record<string, string>;
  canEdit: boolean;
  onEditStart: () => boolean;
  onEditEnd: () => void;
  onDataUpdated?: () => void;
}

export function EmploymentInfoCard({
  user,
  teams,
  locations,
  departments,
  userTeams,
  teamRoles,
  canEdit,
  onEditStart,
  onEditEnd,
  onDataUpdated,
}: EmploymentInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: user?.email || '',
    position: user?.position || '',
    department: user?.department || '',
    weekly_hours: user?.weekly_hours || 40,
    vacation_days: user?.vacation_days || 30,
    employment_type: user?.employment_type || '',
    salary: user?.salary || 0,
    location_id: user?.location_id || null,
    start_date: user?.start_date || '',
    probation_period_months: user?.probation_period_months || null,
    work_phone: user?.work_phone || '',
    contract_status: user?.contract_status || null,
    contract_end_date: user?.contract_end_date || null,
    re_entry_dates: user?.re_entry_dates || [],
    break_auto: user?.break_auto ?? false,
    break_manual: user?.break_manual ?? false,
    break_minutes: user?.break_minutes || 30,
    work_time_model: user?.work_time_model || null,
    shift_start_time: user?.shift_start_time || '',
    shift_end_time: user?.shift_end_time || '',
    flextime_start_earliest: user?.flextime_start_earliest || '',
    flextime_start_latest: user?.flextime_start_latest || '',
    flextime_end_earliest: user?.flextime_end_earliest || '',
    flextime_end_latest: user?.flextime_end_latest || '',
    on_call: user?.on_call ?? false,
  });

  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(userTeams || []);

  const handleEdit = () => {
    const allowed = onEditStart();
    if (!allowed) return;

    // Reset form to current user data
    setFormData({
      email: user?.email || '',
      position: user?.position || '',
      department: user?.department || '',
      weekly_hours: user?.weekly_hours || 40,
      vacation_days: user?.vacation_days || 30,
      employment_type: user?.employment_type || '',
      salary: user?.salary || 0,
      location_id: user?.location_id || null,
      start_date: user?.start_date || '',
      probation_period_months: user?.probation_period_months || null,
      work_phone: user?.work_phone || '',
      contract_status: user?.contract_status || null,
      contract_end_date: user?.contract_end_date || null,
      re_entry_dates: user?.re_entry_dates || [],
      break_auto: user?.break_auto ?? false,
      break_manual: user?.break_manual ?? false,
      break_minutes: user?.break_minutes || 30,
      work_time_model: user?.work_time_model || null,
      shift_start_time: user?.shift_start_time || '',
      shift_end_time: user?.shift_end_time || '',
      flextime_start_earliest: user?.flextime_start_earliest || '',
      flextime_start_latest: user?.flextime_start_latest || '',
      flextime_end_earliest: user?.flextime_end_earliest || '',
      flextime_end_latest: user?.flextime_end_latest || '',
      on_call: user?.on_call ?? false,
    });
    setSelectedTeamIds(userTeams || []);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    onEditEnd();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update user data
      const { error: userError } = await supabase
        .from('users')
        .update({
          email: formData.email,
          position: formData.position || null,
          department: formData.department || null,
          weekly_hours: formData.weekly_hours,
          vacation_days: formData.vacation_days,
          employment_type: formData.employment_type || null,
          salary: formData.salary,
          location_id: formData.location_id,
          start_date: formData.start_date || null,
          probation_period_months: formData.probation_period_months,
          work_phone: formData.work_phone || null,
          contract_status: formData.contract_status,
          contract_end_date: formData.contract_end_date || null,
          re_entry_dates: formData.re_entry_dates,
          break_auto: formData.break_auto,
          break_manual: formData.break_manual,
          break_minutes: formData.break_minutes,
          work_time_model: formData.work_time_model,
          shift_start_time: formData.shift_start_time || null,
          shift_end_time: formData.shift_end_time || null,
          flextime_start_earliest: formData.flextime_start_earliest || null,
          flextime_start_latest: formData.flextime_start_latest || null,
          flextime_end_earliest: formData.flextime_end_earliest || null,
          flextime_end_latest: formData.flextime_end_latest || null,
          on_call: formData.on_call,
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // Handle team memberships
      const currentTeamIds = userTeams || [];
      const teamsToAdd = selectedTeamIds.filter(id => !currentTeamIds.includes(id));
      const teamsToRemove = currentTeamIds.filter(id => !selectedTeamIds.includes(id));

      // Remove user from teams
      if (teamsToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('team_members')
          .delete()
          .eq('user_id', user.id)
          .in('team_id', teamsToRemove);

        if (deleteError) throw deleteError;
      }

      // Add user to teams (with MEMBER role by default)
      if (teamsToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('team_members')
          .insert(
            teamsToAdd.map(teamId => ({
              user_id: user.id,
              team_id: teamId,
              role: 'MEMBER',
              is_lead: false,
              joined_at: new Date().toISOString()
            }))
          );

        if (insertError) throw insertError;
      }

      toast.success('Firmeninformationen gespeichert');
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

  const getLocationName = (locationId: string | null) => {
    if (!locationId) return 'Nicht angegeben';
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : 'Nicht angegeben';
  };

  if (!user) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Firmeninformationen
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Employment Info */}
              <div className="space-y-2">
                <Label htmlFor="employee_number">Personalnummer</Label>
                <Input
                  id="employee_number"
                  value={user.employee_number || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Wird automatisch vom System vergeben</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Arbeits-E-Mail-Adresse</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="mitarbeiter@firma.de"
                />
                <p className="text-xs text-gray-500">System Login E-Mail</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="HR Manager"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Abteilung</Label>
                <Select
                  value={formData.department || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, department: value === 'none' ? '' : value })}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Abteilung wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine Abteilung</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.name}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="teams">Team(s)</Label>
                <div className="space-y-2">
                  {teams.length > 0 ? (
                    teams.map((team) => {
                      const role = teamRoles[team.id];
                      return (
                        <div key={team.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`team-${team.id}`}
                            checked={selectedTeamIds.includes(team.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTeamIds([...selectedTeamIds, team.id]);
                              } else {
                                setSelectedTeamIds(selectedTeamIds.filter(id => id !== team.id));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor={`team-${team.id}`} className="text-sm text-gray-700 cursor-pointer">
                            {team.name}
                            {role === 'TEAMLEAD' && (
                              <Badge variant="default" className="ml-2">Teamlead</Badge>
                            )}
                            {role === 'MEMBER' && (
                              <Badge variant="secondary" className="ml-2">Mitglied</Badge>
                            )}
                          </label>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500">Keine Teams verfügbar</p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ℹ️ Die Rolle (Teamlead/Mitglied) kann nur beim Bearbeiten des Teams geändert werden
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekly_hours">Wochenstunden</Label>
                <Input
                  id="weekly_hours"
                  type="number"
                  value={formData.weekly_hours}
                  onChange={(e) => setFormData({ ...formData, weekly_hours: parseInt(e.target.value) || 0 })}
                  placeholder="40"
                  min="0"
                  max="168"
                />
                {formData.weekly_hours !== user?.weekly_hours && (
                  <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                    <span>⚠️</span>
                    <div>
                      <strong>Hinweis:</strong> Änderungen der Wochenstunden wirken sich auf zukünftige Arbeitszeitkonten aus. Bereits berechnete Monate werden automatisch mit dem neuen Wert neu berechnet.
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="vacation_days">Urlaubstage/Jahr</Label>
                <Input
                  id="vacation_days"
                  type="number"
                  value={formData.vacation_days}
                  onChange={(e) => setFormData({ ...formData, vacation_days: parseInt(e.target.value) || 0 })}
                  placeholder="30"
                  min="0"
                  max="365"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employment_type">Beschäftigungsart</Label>
                <Select
                  value={formData.employment_type || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, employment_type: value === 'none' ? '' : value })}
                >
                  <SelectTrigger id="employment_type">
                    <SelectValue placeholder="Bitte wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nicht angegeben</SelectItem>
                    <SelectItem value="Vollzeit">Vollzeit</SelectItem>
                    <SelectItem value="Teilzeit">Teilzeit</SelectItem>
                    <SelectItem value="Praktikum">Praktikum</SelectItem>
                    <SelectItem value="Minijob">Minijob</SelectItem>
                    <SelectItem value="Sonstige">Sonstige</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Gehalt (Brutto/Monat)</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      id="salary"
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                      placeholder="3500"
                      min="0"
                      step="50"
                    />
                  </div>
                  <div className="text-sm text-gray-500 whitespace-nowrap">
                    Jahr: {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format((formData.salary || 0) * 12)}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location_id">Standort</Label>
                <Select
                  value={formData.location_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, location_id: value === 'none' ? null : value })}
                >
                  <SelectTrigger id="location_id">
                    <SelectValue placeholder="Standort wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Standort</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Eintrittsdatum</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="probation_period_months">Probezeit (Monate)</Label>
                <Input
                  id="probation_period_months"
                  type="number"
                  value={formData.probation_period_months || ''}
                  onChange={(e) => setFormData({ ...formData, probation_period_months: parseInt(e.target.value) || null })}
                  placeholder="6"
                  min="0"
                  max="24"
                />
                {formData.probation_period_months && formData.start_date && (
                  <p className="text-xs text-gray-500">
                    Probezeit endet am: {
                      new Date(
                        new Date(formData.start_date).setMonth(
                          new Date(formData.start_date).getMonth() + formData.probation_period_months
                        )
                      ).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })
                    }
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="work_phone">Arbeitstelefonnummer</Label>
                <Input
                  id="work_phone"
                  type="tel"
                  value={formData.work_phone || ''}
                  onChange={(e) => setFormData({ ...formData, work_phone: e.target.value })}
                  placeholder="+49 30 12345678"
                />
                <p className="text-xs text-gray-500">Firmentelefon (optional)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract_status">Vertragsstatus</Label>
                <Select
                  value={formData.contract_status || 'none'}
                  onValueChange={(value) => {
                    const updates: any = { contract_status: value === 'none' ? null : value };
                    if (value === 'unlimited' || value === 'none') {
                      updates.contract_end_date = null;
                    }
                    setFormData({ ...formData, ...updates });
                  }}
                >
                  <SelectTrigger id="contract_status">
                    <SelectValue placeholder="Bitte wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nicht angegeben</SelectItem>
                    <SelectItem value="unlimited">Unbefristet</SelectItem>
                    <SelectItem value="fixed_term">Befristet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.contract_status === 'fixed_term' && (
                <div className="space-y-2">
                  <Label htmlFor="contract_end_date">Befristet bis</Label>
                  <Input
                    id="contract_end_date"
                    type="date"
                    value={formData.contract_end_date || ''}
                    onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                  />
                  {formData.contract_end_date && (
                    <p className="text-xs text-gray-500">
                      Vertrag endet in {Math.floor(
                        (new Date(formData.contract_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      )} Tagen
                    </p>
                  )}
                </div>
              )}
              <div className="col-span-full space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Wiedereintrittsdatum</Label>
                  <button
                    type="button"
                    onClick={() => {
                      const currentDates = formData.re_entry_dates || [];
                      setFormData({ ...formData, re_entry_dates: [...currentDates, ''] });
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Wiedereintrittsdatum hinzufügen
                  </button>
                </div>
                {formData.re_entry_dates && formData.re_entry_dates.length > 0 ? (
                  <div className="space-y-2">
                    {formData.re_entry_dates.map((date: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={date || ''}
                          onChange={(e) => {
                            const newDates = [...(formData.re_entry_dates || [])];
                            newDates[index] = e.target.value;
                            setFormData({ ...formData, re_entry_dates: newDates });
                          }}
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newDates = [...(formData.re_entry_dates || [])];
                            newDates.splice(index, 1);
                            setFormData({ ...formData, re_entry_dates: newDates });
                          }}
                          className="text-red-600 hover:text-red-700 px-3 py-2 border border-red-200 rounded hover:bg-red-50"
                        >
                          Entfernen
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Keine Wiedereintritte erfasst</p>
                )}
              </div>
            </div>

            {/* Break Settings Section */}
            <div className="border-t pt-6">
              <h4 className="mb-4">Pausenregelung</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Tagesarbeitszeit</Label>
                  <Input
                    value={`${(formData.weekly_hours / 5).toFixed(1)} Stunden`}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">Basierend auf Wochenstunden (÷ 5 Tage)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="break_minutes">Pausendauer (Minuten)</Label>
                  <Input
                    id="break_minutes"
                    type="number"
                    value={formData.break_minutes}
                    onChange={(e) => setFormData({ ...formData, break_minutes: parseInt(e.target.value) || 0 })}
                    placeholder="30"
                    min="0"
                    max="480"
                  />
                  <p className="text-xs text-gray-500">Pausenzeit basierend auf Tagesarbeitszeit</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="break_auto">Pause Automatisch</Label>
                    <p className="text-xs text-gray-500">Pausen werden automatisch abgezogen</p>
                  </div>
                  <Switch
                    id="break_auto"
                    checked={formData.break_auto}
                    onCheckedChange={(checked) => {
                      setFormData({
                        ...formData,
                        break_auto: checked,
                        break_manual: checked ? false : formData.break_manual
                      });
                    }}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="break_manual">Pause Manuell</Label>
                    <p className="text-xs text-gray-500">Mitarbeiter erfasst Pausen manuell</p>
                  </div>
                  <Switch
                    id="break_manual"
                    checked={formData.break_manual}
                    onCheckedChange={(checked) => {
                      setFormData({
                        ...formData,
                        break_manual: checked,
                        break_auto: checked ? false : formData.break_auto
                      });
                    }}
                  />
                </div>
              </div>
              {!formData.break_auto && !formData.break_manual && (
                <Alert className="mt-4">
                  <AlertDescription>
                    Bitte wählen Sie eine Pausenregelung: Automatisch oder Manuell
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Work Time Model Section */}
            <div className="border-t pt-6">
              <h4 className="mb-4">Zeitmodell</h4>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="work_time_model">Arbeitszeitmodell</Label>
                  <Select
                    value={formData.work_time_model || 'none'}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      work_time_model: value === 'none' ? null : value
                    })}
                  >
                    <SelectTrigger id="work_time_model">
                      <SelectValue placeholder="Bitte wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nicht angegeben</SelectItem>
                      <SelectItem value="SCHICHTMODELL">Schichtmodell</SelectItem>
                      <SelectItem value="GLEITZEIT">Gleitzeit</SelectItem>
                      <SelectItem value="BEREITSCHAFT">Bereitschaft</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Wählen Sie das Arbeitszeitmodell für diesen Mitarbeiter</p>
                </div>

                {formData.work_time_model === 'SCHICHTMODELL' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="shift_start_time">Schichtbeginn</Label>
                      <Input
                        id="shift_start_time"
                        type="time"
                        value={formData.shift_start_time}
                        onChange={(e) => setFormData({ ...formData, shift_start_time: e.target.value })}
                        placeholder="08:00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shift_end_time">Schichtende</Label>
                      <Input
                        id="shift_end_time"
                        type="time"
                        value={formData.shift_end_time}
                        onChange={(e) => setFormData({ ...formData, shift_end_time: e.target.value })}
                        placeholder="17:00"
                      />
                    </div>
                    <p className="text-xs text-gray-600 col-span-full">
                      ℹ️ Feste Arbeitszeiten für Schichtmodell
                    </p>
                  </div>
                )}

                {formData.work_time_model === 'GLEITZEIT' && (
                  <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <Label className="mb-3 block">Gleitzeitrahmen - Start</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="flextime_start_earliest" className="text-xs text-gray-600">Frühester Arbeitsbeginn</Label>
                          <Input
                            id="flextime_start_earliest"
                            type="time"
                            value={formData.flextime_start_earliest}
                            onChange={(e) => setFormData({ ...formData, flextime_start_earliest: e.target.value })}
                            placeholder="07:00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="flextime_start_latest" className="text-xs text-gray-600">Spätester Arbeitsbeginn</Label>
                          <Input
                            id="flextime_start_latest"
                            type="time"
                            value={formData.flextime_start_latest}
                            onChange={(e) => setFormData({ ...formData, flextime_start_latest: e.target.value })}
                            placeholder="09:00"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="mb-3 block">Gleitzeitrahmen - Ende</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="flextime_end_earliest" className="text-xs text-gray-600">Frühestes Arbeitsende</Label>
                          <Input
                            id="flextime_end_earliest"
                            type="time"
                            value={formData.flextime_end_earliest}
                            onChange={(e) => setFormData({ ...formData, flextime_end_earliest: e.target.value })}
                            placeholder="16:00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="flextime_end_latest" className="text-xs text-gray-600">Spätestes Arbeitsende</Label>
                          <Input
                            id="flextime_end_latest"
                            type="time"
                            value={formData.flextime_end_latest}
                            onChange={(e) => setFormData({ ...formData, flextime_end_latest: e.target.value })}
                            placeholder="18:00"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      ℹ️ Flexible Arbeitszeiten innerhalb des definierten Rahmens (z.B. Start 7-9 Uhr, Ende 16-18 Uhr)
                    </p>
                  </div>
                )}

                {formData.work_time_model === 'BEREITSCHAFT' && (
                  <Alert>
                    <AlertDescription>
                      Bereitschaft: Der Mitarbeiter ist in Bereitschaft und hat keine festen Arbeitszeiten.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* On-Call Section */}
            <div className="border-t pt-6">
              <h4 className="mb-4">Zusatz Zeitkonditionen</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="on_call">Rufbereitschaft</Label>
                    <p className="text-xs text-gray-500">Mitarbeiter ist für Rufbereitschaft eingeteilt</p>
                  </div>
                  <Switch
                    id="on_call"
                    checked={formData.on_call}
                    onCheckedChange={(checked) => setFormData({ ...formData, on_call: checked })}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  ℹ️ Rufbereitschaft kann jedem Mitarbeiter zugewiesen werden und ist unabhängig vom Zeitmodell
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
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
              <p className="text-sm text-gray-500">Personalnummer</p>
              <p className="font-medium">{user.employee_number || 'Nicht angegeben'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Arbeits-E-Mail</p>
              <p className="font-medium">{user.email || 'Nicht angegeben'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Position</p>
              <p className="font-medium">{user.position || 'Nicht angegeben'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Abteilung</p>
              <p className="font-medium">{user.department || 'Nicht angegeben'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Team(s)</p>
              <div className="flex flex-wrap gap-2">
                {userTeams && userTeams.length > 0 ? (
                  userTeams.map((teamId) => {
                    const team = teams.find(t => t.id === teamId);
                    const role = teamRoles[teamId];
                    return team ? (
                      <Badge key={teamId} variant={role === 'TEAMLEAD' ? 'default' : 'secondary'}>
                        {team.name} {role === 'TEAMLEAD' ? '(Teamlead)' : ''}
                      </Badge>
                    ) : null;
                  })
                ) : (
                  <p className="font-medium">Nicht angegeben</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Wochenstunden</p>
              <p className="font-medium">{user.weekly_hours || 40} Stunden</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Urlaubstage/Jahr</p>
              <p className="font-medium">{user.vacation_days || 30} Tage</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Beschäftigungsart</p>
              <p className="font-medium">{user.employment_type || 'Nicht angegeben'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Gehalt (Brutto/Monat)</p>
              <p className="font-medium">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(user.salary || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Standort</p>
              <p className="font-medium">{getLocationName(user.location_id)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Eintrittsdatum</p>
              <p className="font-medium">{user.start_date ? new Date(user.start_date).toLocaleDateString('de-DE') : 'Nicht angegeben'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Arbeitstelefonnummer</p>
              <p className="font-medium">{user.work_phone || 'Nicht angegeben'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pausenregelung</p>
              <p className="font-medium">
                {user.break_auto ? 'Automatisch' : user.break_manual ? 'Manuell' : 'Nicht festgelegt'} ({user.break_minutes || 30} Min.)
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Arbeitszeitmodell</p>
              <p className="font-medium">{user.work_time_model || 'Nicht angegeben'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Rufbereitschaft</p>
              <p className="font-medium">{user.on_call ? 'Ja' : 'Nein'}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
