/**
 * ============================================
 * BrowoKo BENEFIT SCHEMAS & TYPES
 * ============================================
 * Version: 3.8.0 - COIN SHOP INTEGRATION
 * Description: TypeScript Types und Zod Schemas für Benefits System + Coin Shop
 * ============================================
 */

import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

/**
 * Benefit Kategorien (7 Standard-Kategorien)
 */
export const BENEFIT_CATEGORIES = [
  'Health',      // 🏥 Gesundheit (Fitnessstudio, Massagen, etc.)
  'Mobility',    // 🚗 Mobilität (Firmenwagen, Jobticket, etc.)
  'Finance',     // 💰 Finanziell (Altersvorsorge, VWL, etc.)
  'Food',        // 🍎 Verpflegung (Essenszuschuss, Obstkorb, etc.)
  'Learning',    // 📚 Weiterbildung (Kurse, Konferenzen, etc.)
  'Lifestyle',   // 🏖️ Freizeit (Extra Urlaub, Sabbatical, etc.)
  'Work-Life',   // 🏠 Work-Life (Homeoffice-Budget, Kinderbetreuung, etc.)
] as const;

export type BenefitCategory = typeof BENEFIT_CATEGORIES[number];

/**
 * User Benefit Status
 */
export const USER_BENEFIT_STATUS = [
  'PENDING',    // Antrag gestellt, wartet auf Genehmigung
  'APPROVED',   // Genehmigt und aktiv
  'ACTIVE',     // Aktiv (Legacy - gleich wie APPROVED)
  'REJECTED',   // Abgelehnt
  'CANCELLED',  // Vom User storniert
] as const;

export type UserBenefitStatus = typeof USER_BENEFIT_STATUS[number];

/**
 * Benefit Purchase Type (NEW in v3.8.0)
 */
export const BENEFIT_PURCHASE_TYPES = [
  'COINS_ONLY',    // Nur mit Coins kaufbar
  'REQUEST_ONLY',  // Nur per Antrag (aktuelles System)
  'BOTH',          // User kann wählen: Coins ODER Antrag
] as const;

export type BenefitPurchaseType = typeof BENEFIT_PURCHASE_TYPES[number];

// ============================================
// CATEGORY METADATA (für UI)
// ============================================

export interface BenefitCategoryMeta {
  id: BenefitCategory;
  label: string;
  icon: string; // Lucide Icon Name
  color: string; // Tailwind color class
}

export const BENEFIT_CATEGORY_META: Record<BenefitCategory, BenefitCategoryMeta> = {
  Health: {
    id: 'Health',
    label: 'Gesundheit',
    icon: 'Heart',
    color: 'text-red-600',
  },
  Mobility: {
    id: 'Mobility',
    label: 'Mobilität',
    icon: 'Car',
    color: 'text-blue-600',
  },
  Finance: {
    id: 'Finance',
    label: 'Finanziell',
    icon: 'DollarSign',
    color: 'text-green-600',
  },
  Food: {
    id: 'Food',
    label: 'Verpflegung',
    icon: 'UtensilsCrossed',
    color: 'text-orange-600',
  },
  Learning: {
    id: 'Learning',
    label: 'Weiterbildung',
    icon: 'GraduationCap',
    color: 'text-purple-600',
  },
  Lifestyle: {
    id: 'Lifestyle',
    label: 'Freizeit',
    icon: 'Palmtree',
    color: 'text-pink-600',
  },
  'Work-Life': {
    id: 'Work-Life',
    label: 'Work-Life',
    icon: 'Home',
    color: 'text-indigo-600',
  },
};

// ============================================
// DATABASE TYPES
// ============================================

/**
 * Benefit aus der Datenbank
 */
export interface Benefit {
  id: string;
  organization_id: string;
  
  // Content
  title: string;
  description: string;
  short_description: string;
  
  // Kategorisierung
  category: BenefitCategory;
  icon: string; // Lucide Icon Name
  
  // Limits & Verfügbarkeit
  max_users: number | null;
  current_users: number;
  is_active: boolean;
  
  // Optional
  value: number | null; // EUR-Wert
  eligibility_months: number; // Mindest-Betriebszugehörigkeit
  
  // Coin Shop Integration (NEW in v3.8.0)
  coin_price: number | null;               // NULL = nicht mit Coins kaufbar
  purchase_type: BenefitPurchaseType;      // Art des Erwerbs
  requires_approval: boolean;              // Auch Coin-Käufe brauchen Approval?
  instant_approval: boolean;               // Sofort approved nach Kauf?
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/**
 * User Benefit Relationship
 */
export interface UserBenefit {
  id: string;
  user_id: string;
  benefit_id: string;
  
  // Status
  status: UserBenefitStatus;
  
  // Approval
  requested_at: string;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  
  // Notizen
  notes: string | null;
  admin_notes: string | null;
  
  // Gültigkeit
  valid_from: string | null;
  valid_until: string | null;
}

/**
 * Extended User Benefit mit Benefit-Daten
 */
export interface UserBenefitWithDetails extends UserBenefit {
  benefit: Benefit;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_picture?: string;
  };
  approver?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

/**
 * Benefit mit User-Request-Status
 */
export interface BenefitWithUserStatus extends Benefit {
  user_benefit?: UserBenefit | null;
  has_requested: boolean;
  is_approved: boolean;
  can_request: boolean; // Basierend auf eligibility, max_users, etc.
}

/**
 * Benefit mit Purchase Info (NEW in v3.8.0)
 */
export interface BenefitWithPurchaseInfo extends Benefit {
  user_coin_balance: number;          // User's aktuelle Coins
  can_purchase_with_coins: boolean;   // Hat User genug Coins + Benefit kaufbar?
  can_request: boolean;               // Kann per Antrag angefordert werden?
  has_benefit: boolean;               // Hat User dieses Benefit bereits?
  existing_status?: UserBenefitStatus; // Status falls bereits vorhanden
}

/**
 * Coin Benefit Purchase (NEW in v3.8.0)
 */
export interface CoinBenefitPurchase {
  id: string;
  user_id: string;
  benefit_id: string;
  coin_amount: number;
  coin_transaction_id: string | null;
  user_benefit_id: string | null;
  purchased_at: string;
}

// ============================================
// ZOD SCHEMAS
// ============================================

/**
 * Schema für Benefit erstellen/bearbeiten (EXTENDED in v3.8.0)
 */
export const benefitFormSchema = z.object({
  title: z.string().min(3, 'Titel muss mindestens 3 Zeichen lang sein').max(100),
  short_description: z.string().min(10, 'Kurzbeschreibung muss mindestens 10 Zeichen lang sein').max(200),
  description: z.string().min(20, 'Beschreibung muss mindestens 20 Zeichen lang sein').max(2000),
  category: z.enum(BENEFIT_CATEGORIES, {
    errorMap: () => ({ message: 'Bitte wähle eine Kategorie' }),
  }),
  icon: z.string().min(1, 'Bitte wähle ein Icon'),
  max_users: z.number().int().positive().nullable().optional(),
  value: z.number().positive().nullable().optional(),
  eligibility_months: z.number().int().min(0).max(36).default(0),
  is_active: z.boolean().default(true),
  
  // Coin Shop Fields (NEW in v3.8.0)
  coin_price: z.number().int().positive().nullable().optional(),
  purchase_type: z.enum(BENEFIT_PURCHASE_TYPES).default('REQUEST_ONLY'),
  requires_approval: z.boolean().default(true),
  instant_approval: z.boolean().default(false),
});

export type BenefitFormData = z.infer<typeof benefitFormSchema>;

/**
 * Schema für Benefit Request
 */
export const benefitRequestSchema = z.object({
  benefit_id: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export type BenefitRequestData = z.infer<typeof benefitRequestSchema>;

/**
 * Schema für Benefit Approval/Rejection
 */
export const benefitApprovalSchema = z.object({
  user_benefit_id: z.string().uuid(),
  status: z.enum(['APPROVED', 'REJECTED']),
  admin_notes: z.string().max(500).optional(),
  rejection_reason: z.string().max(500).optional(),
  valid_from: z.string().optional(), // ISO Date
  valid_until: z.string().optional(), // ISO Date
});

export type BenefitApprovalData = z.infer<typeof benefitApprovalSchema>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Prüft ob ein User ein Benefit anfordern kann
 */
export function canRequestBenefit(
  benefit: Benefit,
  userMonthsEmployed: number,
  existingRequest?: UserBenefit | null
): { can: boolean; reason?: string } {
  // Bereits angefordert?
  if (existingRequest) {
    if (existingRequest.status === 'PENDING') {
      return { can: false, reason: 'Antrag läuft bereits' };
    }
    if (existingRequest.status === 'APPROVED') {
      return { can: false, reason: 'Bereits aktiv' };
    }
  }

  // Nicht aktiv?
  if (!benefit.is_active) {
    return { can: false, reason: 'Benefit nicht verfügbar' };
  }

  // Limit erreicht?
  if (benefit.max_users !== null && benefit.current_users >= benefit.max_users) {
    return { can: false, reason: 'Keine Plätze mehr verfügbar' };
  }

  // Betriebszugehörigkeit?
  if (benefit.eligibility_months > 0 && userMonthsEmployed < benefit.eligibility_months) {
    return {
      can: false,
      reason: `Mindestens ${benefit.eligibility_months} Monate Betriebszugehörigkeit erforderlich`,
    };
  }

  return { can: true };
}

/**
 * Berechnet Betriebszugehörigkeit in Monaten
 */
export function getMonthsEmployed(joinDate: string): number {
  const join = new Date(joinDate);
  const now = new Date();
  const months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
  return Math.max(0, months);
}

/**
 * Formatiert Benefit-Status für UI
 */
export function formatBenefitStatus(status: UserBenefitStatus): {
  label: string;
  color: string;
} {
  const statusMap: Record<UserBenefitStatus, { label: string; color: string }> = {
    PENDING: { label: 'Ausstehend', color: 'bg-yellow-100 text-yellow-800' },
    APPROVED: { label: 'Aktiv', color: 'bg-green-100 text-green-800' },
    ACTIVE: { label: 'Aktiv', color: 'bg-green-100 text-green-800' },
    REJECTED: { label: 'Abgelehnt', color: 'bg-red-100 text-red-800' },
    CANCELLED: { label: 'Storniert', color: 'bg-gray-100 text-gray-800' },
  };

  return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
}

/**
 * Formatiert Verfügbarkeit für UI
 */
export function formatAvailability(benefit: Benefit): string {
  if (benefit.max_users === null) {
    return 'Unbegrenzt verfügbar';
  }
  const available = benefit.max_users - benefit.current_users;
  return `${available}/${benefit.max_users} verfügbar`;
}
