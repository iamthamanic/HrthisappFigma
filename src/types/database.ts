// Database types for HRthis

export type UserRole = 'EMPLOYEE' | 'HR' | 'TEAMLEAD' | 'ADMIN' | 'SUPERADMIN';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'MINI_JOB' | 'INTERN' | 'OTHER';
export type LeaveType = 'VACATION' | 'SICK' | 'UNPAID_LEAVE';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type WorkTimeModel = 'SCHICHTMODELL' | 'GLEITZEIT' | 'BEREITSCHAFT';
export type DocumentCategory = 'LOHN' | 'VERTRAG' | 'SONSTIGES';
export type TrainingCategory = 'MANDATORY' | 'COMPLIANCE' | 'SKILLS' | 'ONBOARDING' | 'BONUS';
export type CoinTransactionType = 'EARNED' | 'SPENT';
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'leave' | 'benefit' | 'coin' | 'document' | 'achievement' | 'learning';
export type SubscriptionTier = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED';
export type Gender = 'male' | 'female' | 'diverse';
export type ContractStatus = 'unlimited' | 'fixed_term';

// v4.7.0 - Language Proficiency Levels (CEFR)
export type LanguageLevel = 
  | 'native'      // Muttersprache
  | 'C2'          // Annähernd muttersprachliche Kenntnisse
  | 'C1'          // Fachkundige Sprachkenntnisse
  | 'B2'          // Selbstständige Sprachkenntnisse
  | 'B1'          // Fortgeschrittene Sprachkenntnisse
  | 'A2'          // Grundlegende Kenntnisse
  | 'A1';         // Anfänger

// v4.7.0 - Emergency Contact Interface
export interface EmergencyContact {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
}

// v4.7.0 - Language Skill Interface
export interface LanguageSkill {
  language: string;  // e.g., "Deutsch", "English", "Français"
  level: LanguageLevel;
}

// Test Block Types (10 types for test builder)
export type TestBlockType = 
  | 'MULTIPLE_CHOICE'    // 1 richtige Antwort
  | 'MULTIPLE_SELECT'    // Mehrere richtige Antworten
  | 'TRUE_FALSE'         // Richtig/Falsch
  | 'SHORT_TEXT'         // Kurze Textantwort
  | 'LONG_TEXT'          // Essay/Paragraph
  | 'FILL_BLANKS'        // Lückentext
  | 'ORDERING'           // Reihenfolge sortieren
  | 'MATCHING'           // Zuordnen (Matching pairs)
  | 'SLIDER'             // Wert auf Skala wählen
  | 'FILE_UPLOAD';       // Datei hochladen

// Multi-tenancy: Organization
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  domain: string | null;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  max_users: number;
  settings: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Location (Standort)
export interface Location {
  id: string;
  organization_id: string;
  name: string;
  street_address: string;
  postal_code: string;
  city: string;
  country: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Department (Abteilung)
export interface Department {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  location_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // NEW: Organigram hierarchy fields
  parent_department_id: string | null;  // Parent department in hierarchy
  x_position: number | null;             // X coordinate for drag & drop
  y_position: number | null;             // Y coordinate for drag & drop
  is_location: boolean;                  // TRUE for location nodes (e.g., Berlin)
  primary_user_id: string | null;        // Primary responsible user
  backup_user_id: string | null;         // Backup responsible user
}

// Organigram Position
export interface OrganigramPosition {
  id: string;
  organization_id: string;
  department_id: string;
  name: string;
  specialization: string | null;
  primary_user_id: string | null;
  backup_user_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: UserRole;
  invited_by: string;
  token: string;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  organization_id: string | null;
  employee_number: string | null;
  position: string | null;
  department: string | null;
  employment_type: string | null;
  start_date: string | null;
  vacation_days: number;
  weekly_hours: number;
  salary: number | null;
  location_id: string | null;
  is_active: boolean;
  phone: string | null;
  address: any | null;
  birth_date: string | null;
  profile_picture_url: string | null;
  private_email: string | null;
  street_address: string | null;
  postal_code: string | null;
  city: string | null;
  iban: string | null;
  bic: string | null;
  shirt_size: string | null;
  pants_size: string | null;
  shoe_size: string | null;
  jacket_size: string | null;
  break_auto: boolean; // Legacy field (wird nicht mehr verwendet, siehe break_mode)
  break_manual: boolean; // Legacy field (wird nicht mehr verwendet, siehe break_mode)
  break_mode: 'auto' | 'manual'; // v4.9.1: Pausenmodus (auto oder manual)
  break_minutes: number;
  work_time_model: WorkTimeModel | null;
  shift_start_time: string | null;
  shift_end_time: string | null;
  flextime_start_earliest: string | null;
  flextime_start_latest: string | null;
  flextime_end_earliest: string | null;
  flextime_end_latest: string | null;
  on_call: boolean;
  // v4.6.0 - Extended fields
  gender: Gender | null;
  country: string | null;
  state: string | null;
  contract_status: ContractStatus | null;
  contract_end_date: string | null;
  re_entry_dates: string[] | null; // Array of ISO date strings
  // v4.7.0 - Additional fields
  probation_period_months: number | null; // Probezeit in Monaten
  work_phone: string | null; // Arbeitstelefonnummer
  emergency_contacts: EmergencyContact[] | null; // Array of emergency contacts
  language_skills: LanguageSkill[] | null; // Array of language skills
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  is_lead: boolean; // Deprecated - use role instead
  role: 'TEAMLEAD' | 'MEMBER';
  joined_at: string;
}

export interface TimeRecord {
  id: string;
  user_id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  break_minutes: number;
  total_hours: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  type: LeaveType;
  status: LeaveStatus;
  comment: string | null;
  total_days?: number | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  team_id: string | null;
  created_at: string;
  updated_at: string;
  // Extended fields (Migration 036)
  is_half_day?: boolean;
  file_url?: string | null; // Sick note document
  withdrawn_at?: string | null;
  cancelled_by?: string | null;
  cancelled_at?: string | null;
  cancellation_confirmed?: boolean;
  federal_state?: string | null;
  reminder_sent?: boolean;
  created_by?: string | null; // Who created (admin vs user)
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  category: DocumentCategory;
  file_url: string;
  mime_type: string | null;
  file_size: number | null;
  assigned_by: string | null;
  uploaded_at: string;
}

export interface VideoContent {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null; // Duration in seconds (from DB)
  category: TrainingCategory;
  is_mandatory: boolean;
  order_index: number;
  learning_objectives?: string[];
  completed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizContent {
  id: string;
  title: string;
  description: string | null;
  category: TrainingCategory;
  is_mandatory: boolean;
  duration: number; // in minutes
  passing_score: number; // percentage
  questions: any[]; // QuizQuestion[]
  xp_reward: number;
  coin_reward: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface LearningProgress {
  id: string;
  user_id: string;
  video_id: string;
  watched_seconds: number;
  completed: boolean;
  completed_at: string | null;
  last_watched_at: string;
}

export interface Quiz {
  id: string;
  video_id: string;
  title: string;
  description: string | null;
  passing_score: number;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  options: any;
  correct_answer: string;
  order_index: number;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  answers: any;
  completed_at: string;
}

export interface UserAvatar {
  id: string;
  user_id: string;
  skin_color: string;
  hair_color: string;
  background_color: string;
  accessories: string[];
  level: number;
  total_xp: number;
  created_at: string;
  updated_at: string;
}

export interface XPEvent {
  id: string;
  user_id: string;
  skill_id: string | null;
  xp_amount: number;
  description: string;
  source: string;
  metadata: any;
  created_at: string;
}

export interface CoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  type: CoinTransactionType;
  metadata: any;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  badge_color: string | null;
  xp_reward: number;
  coin_reward: number;
  requirement_type: string;
  requirement_value: any;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  available: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

// Extended types with relations
export interface UserWithAvatar extends User {
  avatar?: UserAvatar;
}

export interface LeaveRequestWithUser extends LeaveRequest {
  user?: User;
  approver?: User;
}

export interface LearningProgressWithVideo extends LearningProgress {
  video?: VideoContent;
}

export interface CoinBalance {
  total_earned: number;        // All time earned
  total_spent: number;         // All time spent
  current_balance: number;     // Current coins available
  yearly_earned: number;       // Coins earned THIS year (v3.10.0)
  yearly_spent: number;        // Coins spent THIS year (v3.10.0)
  current_year: number;        // Current year (e.g., 2025) (v3.10.0)
}

// Coin Achievements Types (v3.9.0)
export interface CoinAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  required_coins: number;
  unlock_type: 'ACCESS' | 'PRIVILEGE' | 'BENEFIT' | 'EVENT';
  unlock_description: string | null;
  category: 'MILESTONE' | 'EVENT' | 'EXCLUSIVE' | 'SEASONAL';
  badge_color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserCoinAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  coins_at_unlock: number;
  is_claimed: boolean;
  claimed_at: string | null;
  created_at: string;
}

export interface CoinAchievementWithProgress extends CoinAchievement {
  is_unlocked: boolean;
  unlocked_at: string | null;
  coins_at_unlock: number | null;
  is_claimed: boolean;
  claimed_at: string | null;
  current_balance: number;
  progress_percentage: number;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  search_config: SearchConfig;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export interface SearchConfig {
  searchQuery: string;
  statusFilter: 'all' | 'active' | 'inactive';
  roleFilter: string;
  teamRoleFilter?: string; // NEW: Team role filter (TEAMLEAD, MEMBER, NONE)
  departmentFilter: string;
  locationFilter: string;
  sortConfig?: {
    key: string;
    direction: 'asc' | 'desc';
  };
}

// =====================================================
// LEARNING TESTS SYSTEM (v4.4.0)
// =====================================================

export interface Test {
  id: string;
  organization_id: string;
  
  // Basic Info
  title: string;
  description: string | null;
  
  // Test Settings
  pass_percentage: number;      // e.g. 80 (%)
  reward_coins: number;          // Coins earned on pass
  max_attempts: number;          // 0 = unlimited
  time_limit_minutes: number | null;
  
  // Template System
  is_template: boolean;
  template_category: string | null;
  
  // Metadata
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
  is_active: boolean;
}

export interface TestBlock {
  id: string;
  test_id: string;
  
  // Block Info
  type: TestBlockType;
  title: string;
  description: string | null;  // Was dieser Baustein testet
  
  // Content (structure depends on type)
  content: TestBlockContent;
  
  // Settings
  points: number;
  is_required: boolean;
  time_limit_seconds: number | null;
  
  // Ordering
  position: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// Content structures for different block types
export type TestBlockContent = 
  | MultipleChoiceContent
  | MultipleSelectContent
  | TrueFalseContent
  | ShortTextContent
  | LongTextContent
  | FillBlanksContent
  | OrderingContent
  | MatchingContent
  | SliderContent
  | FileUploadContent;

export interface MultipleChoiceContent {
  question: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation?: string;
}

export interface MultipleSelectContent {
  question: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation?: string;
}

export interface TrueFalseContent {
  question: string;
  correctAnswer: boolean;
  explanation?: string;
}

export interface ShortTextContent {
  question: string;
  correctAnswers: string[];  // Multiple acceptable answers
  caseSensitive: boolean;
  explanation?: string;
}

export interface LongTextContent {
  question: string;
  minWords?: number;
  maxWords?: number;
  keywords?: string[];  // Required keywords for automatic scoring
  explanation?: string;
}

export interface FillBlanksContent {
  text: string;  // Text with [blank] placeholders
  blanks: Array<{
    id: string;
    position: number;
    correctAnswers: string[];
    caseSensitive: boolean;
  }>;
  explanation?: string;
}

export interface OrderingContent {
  question: string;
  items: Array<{
    id: string;
    text: string;
    correctPosition: number;
  }>;
  explanation?: string;
}

export interface MatchingContent {
  question: string;
  pairs: Array<{
    id: string;
    left: string;
    right: string;
  }>;
  explanation?: string;
}

export interface SliderContent {
  question: string;
  min: number;
  max: number;
  step: number;
  correctValue: number;
  tolerance?: number;  // Acceptable deviation
  unit?: string;
  explanation?: string;
}

export interface FileUploadContent {
  question: string;
  acceptedFileTypes: string[];  // e.g. ['image/*', 'application/pdf']
  maxFileSizeMB: number;
  explanation?: string;
}

export interface TestVideoAssignment {
  id: string;
  test_id: string;
  video_id: string;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
}

export interface TestAttempt {
  id: string;
  test_id: string;
  user_id: string;
  
  // Attempt Info
  attempt_number: number;
  
  // Answers
  answers: Array<{
    block_id: string;
    answer: any;
    is_correct: boolean;
    points_earned: number;
  }>;
  
  // Results
  total_points: number;
  max_points: number;
  percentage: number;
  passed: boolean;
  
  // Timing
  started_at: string;
  completed_at: string | null;
  time_taken_seconds: number | null;
  
  created_at: string;
}

export interface LearningUnit {
  video_id: string;
  video_title: string;
  video_category: string;
  video_duration: number;
  test_id: string;
  test_title: string;
  pass_percentage: number;
  reward_coins: number;
  is_active: boolean;
  assigned_at: string;
  organization_id: string;
}

// Extended Test with related data
export interface TestWithBlocks extends Test {
  blocks: TestBlock[];
  video_count?: number;
  attempt_count?: number;
}

// User Test Progress
export interface UserTestProgress {
  test_id: string;
  user_id: string;
  attempts_count: number;
  best_score: number;
  passed: boolean;
  last_attempt_at: string | null;
  can_retry: boolean;
}
