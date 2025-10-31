/**
 * @file BrowoKo_useTeamMemberForm.ts
 * @domain BrowoKo - Team Member Details Form
 * @description Custom hook for team member form state and handlers
 * @created Phase 3D - Hooks Migration
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';
import { useAdminStore } from '../stores/BrowoKo_adminStore';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import { supabase } from '../utils/supabase/client';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  private_email?: string;
  street_address?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  state?: string;
  iban?: string;
  bic?: string;
  shirt_size?: string;
  pants_size?: string;
  shoe_size?: string;
  jacket_size?: string;
  department?: string;
  position?: string;
  employee_number?: string;
  start_date?: string;
  birth_date?: string;
  gender?: string;
  weekly_hours?: number;
  vacation_days?: number;
  employment_type?: string;
  salary?: number;
  location_id?: string | null;
  role: string;
  is_active?: boolean;
  break_auto?: boolean;
  break_manual?: boolean;
  break_minutes?: number;
  work_time_model?: string | null;
  shift_start_time?: string;
  shift_end_time?: string;
  flextime_start_earliest?: string;
  flextime_start_latest?: string;
  flextime_end_earliest?: string;
  flextime_end_latest?: string;
  on_call?: boolean;
  contract_status?: string | null;
  contract_end_date?: string | null;
  re_entry_dates?: string[] | null;
  // v4.7.0
  probation_period_months?: number | null;
  work_phone?: string | null;
  emergency_contacts?: any[] | null;
  language_skills?: any[] | null;
}

export function useTeamMemberForm(user: User | undefined, initialTeamIds: string[]) {
  const { updateUser, loadUsers } = useAdminStore();
  const { profile, refreshProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(initialTeamIds);

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    private_email: user?.private_email || '',
    street_address: user?.street_address || '',
    postal_code: user?.postal_code || '',
    city: user?.city || '',
    country: user?.country || '',
    state: user?.state || '',
    birth_date: user?.birth_date || '',
    gender: user?.gender || '',
    iban: user?.iban || '',
    bic: user?.bic || '',
    shirt_size: user?.shirt_size || '',
    pants_size: user?.pants_size || '',
    shoe_size: user?.shoe_size || '',
    jacket_size: user?.jacket_size || '',
    department: user?.department || '',
    position: user?.position || '',
    employee_number: user?.employee_number || '',
    start_date: user?.start_date || '',
    weekly_hours: user?.weekly_hours || 40,
    vacation_days: user?.vacation_days || 30,
    employment_type: user?.employment_type || '',
    salary: user?.salary || 0,
    location_id: user?.location_id || null,
    role: user?.role || 'USER',
    is_active: user?.is_active ?? true,
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
    contract_status: user?.contract_status || null,
    contract_end_date: user?.contract_end_date || null,
    re_entry_dates: user?.re_entry_dates || [],
    // v4.7.0
    probation_period_months: user?.probation_period_months || null,
    work_phone: user?.work_phone || '',
    emergency_contacts: user?.emergency_contacts || [],
    language_skills: user?.language_skills || [],
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone || '',
        private_email: user.private_email || '',
        street_address: user.street_address || '',
        postal_code: user.postal_code || '',
        city: user.city || '',
        iban: user.iban || '',
        bic: user.bic || '',
        shirt_size: user.shirt_size || '',
        pants_size: user.pants_size || '',
        shoe_size: user.shoe_size || '',
        jacket_size: user.jacket_size || '',
        department: user.department || '',
        position: user.position || '',
        employee_number: user.employee_number || '',
        start_date: user.start_date || '',
        weekly_hours: user.weekly_hours || 40,
        vacation_days: user.vacation_days || 30,
        employment_type: user.employment_type || '',
        salary: user.salary || 0,
        location_id: user.location_id || null,
        role: user.role,
        is_active: user.is_active ?? true,
        break_auto: user.break_auto ?? false,
        break_manual: user.break_manual ?? false,
        break_minutes: user.break_minutes || 30,
        work_time_model: user.work_time_model || null,
        shift_start_time: user.shift_start_time || '',
        shift_end_time: user.shift_end_time || '',
        flextime_start_earliest: user.flextime_start_earliest || '',
        flextime_start_latest: user.flextime_start_latest || '',
        flextime_end_earliest: user.flextime_end_earliest || '',
        flextime_end_latest: user.flextime_end_latest || '',
        on_call: user.on_call ?? false,
        country: user.country || '',
        state: user.state || '',
        birth_date: user.birth_date || '',
        gender: user.gender || '',
        contract_status: user.contract_status || null,
        contract_end_date: user.contract_end_date || null,
        re_entry_dates: user.re_entry_dates || [],
        // v4.7.0
        probation_period_months: user.probation_period_months || null,
        work_phone: user.work_phone || '',
        emergency_contacts: user.emergency_contacts || [],
        language_skills: user.language_skills || [],
      });
    }
  }, [user]);

  // Update selectedTeamIds when initialTeamIds changes
  useEffect(() => {
    setSelectedTeamIds(initialTeamIds);
  }, [initialTeamIds]);

  // Save team assignments
  const saveTeamAssignments = async (userId: string, userTeams: string[]) => {
    // Find teams to add and remove
    const teamsToAdd = selectedTeamIds.filter(teamId => !userTeams.includes(teamId));
    const teamsToRemove = userTeams.filter(teamId => !selectedTeamIds.includes(teamId));

    // Remove user from teams
    if (teamsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('team_members')
        .delete()
        .eq('user_id', userId)
        .in('team_id', teamsToRemove);

      if (deleteError) throw deleteError;
    }

    // Add user to teams (with MEMBER role by default)
    if (teamsToAdd.length > 0) {
      const { error: insertError } = await supabase
        .from('team_members')
        .insert(
          teamsToAdd.map(teamId => ({
            user_id: userId,
            team_id: teamId,
            role: 'MEMBER', // Default to MEMBER, can be changed in Team dialog
            is_lead: false,
            joined_at: new Date().toISOString()
          }))
        );

      if (insertError) throw insertError;
    }
  };

  // Handle save (without role change)
  const handleSave = async (onTeamReload: () => Promise<void>) => {
    if (!user) return;

    setSaving(true);
    try {
      // Don't update role here - it's handled separately
      const { role, ...dataWithoutRole } = formData;
      await updateUser(user.id, dataWithoutRole);

      // Update team assignments
      await saveTeamAssignments(user.id, initialTeamIds);

      toast.success('Mitarbeiter erfolgreich aktualisiert!');
      setIsEditing(false);
      await loadUsers();
      await onTeamReload(); // Reload team assignments

      // If user is editing their own profile, refresh the auth store
      if (user.id === profile?.id) {
        await refreshProfile();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Fehler beim Aktualisieren des Mitarbeiters');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (user) {
      // Reset team selection
      setSelectedTeamIds(initialTeamIds);

      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone || '',
        private_email: user.private_email || '',
        street_address: user.street_address || '',
        postal_code: user.postal_code || '',
        city: user.city || '',
        iban: user.iban || '',
        bic: user.bic || '',
        shirt_size: user.shirt_size || '',
        pants_size: user.pants_size || '',
        shoe_size: user.shoe_size || '',
        jacket_size: user.jacket_size || '',
        department: user.department || '',
        position: user.position || '',
        employee_number: user.employee_number || '',
        start_date: user.start_date || '',
        weekly_hours: user.weekly_hours || 40,
        vacation_days: user.vacation_days || 30,
        employment_type: user.employment_type || '',
        salary: user.salary || 0,
        location_id: user.location_id || null,
        role: user.role,
        is_active: user.is_active ?? true,
        break_auto: user.break_auto ?? false,
        break_manual: user.break_manual ?? false,
        break_minutes: user.break_minutes || 30,
        work_time_model: user.work_time_model || null,
        shift_start_time: user.shift_start_time || '',
        shift_end_time: user.shift_end_time || '',
        flextime_start_earliest: user.flextime_start_earliest || '',
        flextime_start_latest: user.flextime_start_latest || '',
        flextime_end_earliest: user.flextime_end_earliest || '',
        flextime_end_latest: user.flextime_end_latest || '',
        on_call: user.on_call ?? false,
      });
    }
    setIsEditing(false);
  };

  return {
    isEditing,
    setIsEditing,
    saving,
    formData,
    setFormData,
    selectedTeamIds,
    setSelectedTeamIds,
    handleSave,
    handleCancel,
  };
}
