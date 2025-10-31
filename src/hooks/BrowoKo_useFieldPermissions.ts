/**
 * @file BrowoKo_useFieldPermissions.ts
 * @domain BrowoKo - Field Permissions
 * @description Hook to determine which fields can be edited by users vs admins
 * @created v4.7.0
 */

import { useAuthStore } from '../stores/BrowoKo_authStore';

export interface FieldPermissions {
  canEditPersonalInfo: boolean;
  canEditAddress: boolean;
  canEditBankInfo: boolean;
  canEditClothingSizes: boolean;
  canEditEmploymentInfo: boolean;
  canEditWorkTimeModel: boolean;
  canEditBreakSettings: boolean;
  canEditEmergencyContacts: boolean;
  canEditLanguageSkills: boolean;
  isAdmin: boolean;
  isUser: boolean;
}

/**
 * Hook to determine field edit permissions
 * 
 * USER CAN EDIT:
 * - Persönliche Informationen (Geburtsdatum, Geschlecht)
 * - Adresse (Land, Bundesland, Straße, PLZ, Stadt)
 * - Bankverbindung (IBAN, BIC)
 * - Arbeitskleidung Größen (Hemd, Hose, Schuhe, Jacke)
 * - Notfallkontakte
 * - Sprachkenntnisse
 * 
 * ONLY ADMIN/HR/SUPERADMIN CAN EDIT:
 * - Arbeitsinformationen (Position, Abteilung, Stunden, Urlaub, Gehalt, etc.)
 * - Arbeitszeitmmodell
 * - Pauseneinstellungen
 * - Vertragsstatus
 * 
 * USER CAN VIEW ALL (Read-only)
 */
export function useFieldPermissions(): FieldPermissions {
  const { profile } = useAuthStore();
  
  const isAdmin = profile?.role === 'ADMIN' || 
                  profile?.role === 'HR' || 
                  profile?.role === 'SUPERADMIN';
  
  const isUser = profile?.role === 'USER' || profile?.role === 'EXTERN';

  return {
    // User can edit these sections
    canEditPersonalInfo: true, // Geburtsdatum, Geschlecht
    canEditAddress: true, // Land, Bundesland, Straße, PLZ, Stadt
    canEditBankInfo: true, // IBAN, BIC
    canEditClothingSizes: true, // Hemd, Hose, Schuhe, Jacke
    canEditEmergencyContacts: true, // Notfallkontakte
    canEditLanguageSkills: true, // Sprachkenntnisse
    
    // Only Admin can edit these
    canEditEmploymentInfo: isAdmin, // Position, Abteilung, Gehalt, etc.
    canEditWorkTimeModel: isAdmin, // Schichtmodell, Gleitzeit, etc.
    canEditBreakSettings: isAdmin, // Pause Auto/Manual
    
    // Flags
    isAdmin,
    isUser,
  };
}

/**
 * Helper function to check if a specific field can be edited
 */
export function canEditField(fieldName: string, permissions: FieldPermissions): boolean {
  // Personal Info fields
  const personalInfoFields = ['first_name', 'last_name', 'phone', 'private_email', 'birth_date', 'gender'];
  if (personalInfoFields.includes(fieldName)) {
    return permissions.canEditPersonalInfo;
  }

  // Address fields
  const addressFields = ['street_address', 'postal_code', 'city', 'country', 'state'];
  if (addressFields.includes(fieldName)) {
    return permissions.canEditAddress;
  }

  // Bank Info fields
  const bankInfoFields = ['iban', 'bic'];
  if (bankInfoFields.includes(fieldName)) {
    return permissions.canEditBankInfo;
  }

  // Clothing Sizes fields
  const clothingSizesFields = ['shirt_size', 'pants_size', 'shoe_size', 'jacket_size'];
  if (clothingSizesFields.includes(fieldName)) {
    return permissions.canEditClothingSizes;
  }

  // Emergency Contacts
  if (fieldName === 'emergency_contacts') {
    return permissions.canEditEmergencyContacts;
  }

  // Language Skills
  if (fieldName === 'language_skills') {
    return permissions.canEditLanguageSkills;
  }

  // Employment Info fields (Admin only)
  const employmentInfoFields = [
    'position', 
    'department', 
    'employee_number', 
    'start_date', 
    'weekly_hours', 
    'vacation_days', 
    'employment_type', 
    'salary', 
    'location_id',
    'role',
    'is_active',
    'contract_status',
    'contract_end_date',
    're_entry_dates',
    'probation_period_months',
    'work_phone'
  ];
  if (employmentInfoFields.includes(fieldName)) {
    return permissions.canEditEmploymentInfo;
  }

  // Work Time Model fields (Admin only)
  const workTimeModelFields = [
    'work_time_model',
    'shift_start_time',
    'shift_end_time',
    'flextime_start_earliest',
    'flextime_start_latest',
    'flextime_end_earliest',
    'flextime_end_latest',
    'on_call'
  ];
  if (workTimeModelFields.includes(fieldName)) {
    return permissions.canEditWorkTimeModel;
  }

  // Break Settings fields (Admin only)
  const breakSettingsFields = ['break_auto', 'break_manual', 'break_minutes'];
  if (breakSettingsFields.includes(fieldName)) {
    return permissions.canEditBreakSettings;
  }

  // Default: Admin can edit everything
  return permissions.isAdmin;
}
