/**
 * @file types/positions.ts
 * @description TypeScript types for Positions Management System
 */

export type PositionLevel = 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
export type PositionStatus = 'ACTIVE' | 'INACTIVE' | 'RECRUITING';
export type SalaryCurrency = 'EUR' | 'USD' | 'GBP' | 'CHF';
export type SalaryPeriod = 'yearly' | 'monthly';
export type ExperienceLevel = '0-2' | '2-5' | '5+' | '10+';
export type EducationLevel = 'None' | 'Apprenticeship' | 'Bachelor' | 'Master' | 'PhD';

/**
 * Anforderungen (Requirements) - Strukturiert
 */
export interface PositionRequirements {
  skills: string[]; // z.B. ["React", "TypeScript", "Node.js"]
  experience: ExperienceLevel | null;
  education: EducationLevel | null;
  certifications: string[]; // z.B. ["PMP", "Scrum Master"]
}

/**
 * Position (Stelle/Jobposition)
 */
export interface Position {
  id: string;
  organization_id: string;
  
  // Basis
  name: string;
  description: string | null; // Rich-Text HTML from Tiptap
  level: PositionLevel | null;
  
  // Verantwortlichkeiten
  responsibilities: string | null; // Rich-Text HTML from Tiptap
  
  // Anforderungen
  requirements: PositionRequirements;
  
  // Gehalt
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: SalaryCurrency;
  salary_period: SalaryPeriod;
  
  // Hierarchie
  reports_to_position_id: string | null;
  
  // Recruiting
  status: PositionStatus;
  open_positions: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Position mit zusätzlichen Daten (für UI)
 */
export interface PositionWithRelations extends Position {
  departments?: { id: string; name: string }[];
  locations?: { id: string; name: string }[];
  employee_count?: number;
  reports_to_position_name?: string | null;
}

/**
 * Position Department (Many-to-Many)
 */
export interface PositionDepartment {
  id: string;
  position_id: string;
  department_id: string;
  created_at: string;
}

/**
 * Position Location (Many-to-Many)
 */
export interface PositionLocation {
  id: string;
  position_id: string;
  location_id: string;
  created_at: string;
}

/**
 * Form Data für Create/Update Position Dialog
 */
export interface PositionFormData {
  // Tab 1: Basis
  name: string;
  level: PositionLevel | null;
  department_ids: string[];
  location_ids: string[];
  
  // Tab 2: Beschreibung
  description: string;
  responsibilities: string;
  
  // Tab 3: Anforderungen
  requirements: PositionRequirements;
  
  // Tab 4: Gehalt & Recruiting
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: SalaryCurrency;
  salary_period: SalaryPeriod;
  reports_to_position_id: string | null;
  status: PositionStatus;
  open_positions: number;
}

/**
 * Default values für neue Position
 */
export const DEFAULT_POSITION_FORM_DATA: PositionFormData = {
  name: '',
  level: null,
  department_ids: [],
  location_ids: [],
  description: '',
  responsibilities: '',
  requirements: {
    skills: [],
    experience: null,
    education: null,
    certifications: [],
  },
  salary_min: null,
  salary_max: null,
  salary_currency: 'EUR',
  salary_period: 'yearly',
  reports_to_position_id: null,
  status: 'ACTIVE',
  open_positions: 0,
};

/**
 * Level Labels (für Dropdown)
 */
export const POSITION_LEVEL_LABELS: Record<PositionLevel, string> = {
  JUNIOR: 'Junior',
  MID: 'Mid-Level',
  SENIOR: 'Senior',
  LEAD: 'Lead / Manager',
  EXECUTIVE: 'Executive',
};

/**
 * Status Labels (für Dropdown)
 */
export const POSITION_STATUS_LABELS: Record<PositionStatus, string> = {
  ACTIVE: 'Aktiv',
  INACTIVE: 'Inaktiv',
  RECRUITING: 'Recruiting',
};

/**
 * Experience Level Labels (für Dropdown)
 */
export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  '0-2': '0-2 Jahre',
  '2-5': '2-5 Jahre',
  '5+': '5+ Jahre',
  '10+': '10+ Jahre',
};

/**
 * Education Level Labels (für Dropdown)
 */
export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  'None': 'Keine formale Ausbildung',
  'Apprenticeship': 'Ausbildung / Lehre',
  'Bachelor': 'Bachelor',
  'Master': 'Master',
  'PhD': 'Promotion / PhD',
};
