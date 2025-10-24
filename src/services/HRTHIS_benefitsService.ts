/**
 * ============================================
 * HRTHIS BENEFITS SERVICE
 * ============================================
 * Version: 3.8.0 - COIN SHOP INTEGRATION
 * Description: Service für Benefits Management (CRUD + Request/Approval + Coin Purchase)
 * ============================================
 */

import { supabase } from '../utils/supabase/client';
import type {
  Benefit,
  UserBenefit,
  UserBenefitWithDetails,
  BenefitWithUserStatus,
  BenefitWithPurchaseInfo,
  CoinBenefitPurchase,
  BenefitFormData,
  BenefitRequestData,
  BenefitApprovalData,
  BenefitCategory,
} from '../types/schemas/HRTHIS_benefitSchemas';

// ============================================
// BENEFITS CRUD
// ============================================

/**
 * Holt alle Benefits einer Organisation
 */
export async function getBenefits(organizationId: string): Promise<Benefit[]> {
  const { data, error } = await supabase
    .from('benefits')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('title');

  if (error) throw error;
  return data || [];
}

/**
 * Holt alle Benefits mit User-Request-Status
 */
export async function getBenefitsWithUserStatus(
  organizationId: string,
  userId: string
): Promise<BenefitWithUserStatus[]> {
  // Benefits holen
  const { data: benefits, error: benefitsError } = await supabase
    .from('benefits')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('title');

  if (benefitsError) throw benefitsError;
  if (!benefits) return [];

  // User Benefits holen
  const { data: userBenefits, error: userBenefitsError } = await supabase
    .from('user_benefits')
    .select('*')
    .eq('user_id', userId);

  if (userBenefitsError) throw userBenefitsError;

  // Combine
  return benefits.map((benefit) => {
    const userBenefit = userBenefits?.find((ub) => ub.benefit_id === benefit.id);
    return {
      ...benefit,
      user_benefit: userBenefit || null,
      has_requested: !!userBenefit,
      is_approved: userBenefit?.status === 'APPROVED',
      can_request: !userBenefit && benefit.is_active,
    };
  });
}

/**
 * Holt ein einzelnes Benefit
 */
export async function getBenefitById(benefitId: string): Promise<Benefit | null> {
  const { data, error } = await supabase
    .from('benefits')
    .select('*')
    .eq('id', benefitId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}

/**
 * Erstellt ein neues Benefit (nur ADMIN/HR/SUPERADMIN)
 */
export async function createBenefit(
  benefitData: BenefitFormData,
  organizationId: string,
  userId: string
): Promise<Benefit> {
  const { data, error } = await supabase
    .from('benefits')
    .insert({
      ...benefitData,
      organization_id: organizationId,
      created_by: userId,
      current_users: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Aktualisiert ein Benefit (nur ADMIN/HR/SUPERADMIN)
 */
export async function updateBenefit(
  benefitId: string,
  benefitData: Partial<BenefitFormData>
): Promise<Benefit> {
  const { data, error } = await supabase
    .from('benefits')
    .update(benefitData)
    .eq('id', benefitId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Löscht ein Benefit (nur ADMIN/HR/SUPERADMIN)
 */
export async function deleteBenefit(benefitId: string): Promise<void> {
  const { error } = await supabase.from('benefits').delete().eq('id', benefitId);

  if (error) throw error;
}

// ============================================
// USER BENEFITS (REQUEST/APPROVE)
// ============================================

/**
 * Holt alle Benefits eines Users
 */
export async function getUserBenefits(userId: string): Promise<UserBenefitWithDetails[]> {
  const { data, error } = await supabase
    .from('user_benefits')
    .select(
      `
      *,
      benefit:benefits(*),
      approver:users!user_benefits_approved_by_fkey(id, first_name, last_name, email)
    `
    )
    .eq('user_id', userId)
    .order('requested_at', { ascending: false });

  if (error) throw error;
  return (data || []) as UserBenefitWithDetails[];
}

/**
 * Holt alle ausstehenden Benefit-Requests (für Admins)
 */
export async function getPendingBenefitRequests(
  organizationId: string
): Promise<UserBenefitWithDetails[]> {
  // Erst alle User der Organisation holen
  const { data: orgUsers, error: usersError } = await supabase
    .from('users')
    .select('id')
    .eq('organization_id', organizationId);

  if (usersError) throw usersError;

  const userIds = orgUsers?.map((u) => u.id) || [];
  if (userIds.length === 0) return [];

  // Dann pending requests
  const { data, error } = await supabase
    .from('user_benefits')
    .select(
      `
      *,
      benefit:benefits(*),
      user:users!user_benefits_user_id_fkey(id, first_name, last_name, email, profile_picture),
      approver:users!user_benefits_approved_by_fkey(id, first_name, last_name, email)
    `
    )
    .in('user_id', userIds)
    .eq('status', 'PENDING')
    .order('requested_at', { ascending: false });

  if (error) throw error;
  return (data || []) as UserBenefitWithDetails[];
}

/**
 * Holt alle User Benefits einer Organisation (für Admins)
 */
export async function getAllUserBenefits(
  organizationId: string
): Promise<UserBenefitWithDetails[]> {
  // Erst alle User der Organisation holen
  const { data: orgUsers, error: usersError } = await supabase
    .from('users')
    .select('id')
    .eq('organization_id', organizationId);

  if (usersError) throw usersError;

  const userIds = orgUsers?.map((u) => u.id) || [];
  if (userIds.length === 0) return [];

  // Dann alle user_benefits
  const { data, error } = await supabase
    .from('user_benefits')
    .select(
      `
      *,
      benefit:benefits(*),
      user:users!user_benefits_user_id_fkey(id, first_name, last_name, email, profile_picture),
      approver:users!user_benefits_approved_by_fkey(id, first_name, last_name, email)
    `
    )
    .in('user_id', userIds)
    .order('requested_at', { ascending: false });

  if (error) throw error;
  return (data || []) as UserBenefitWithDetails[];
}

/**
 * User fordert ein Benefit an
 */
export async function requestBenefit(
  requestData: BenefitRequestData,
  userId: string
): Promise<UserBenefit> {
  const { data, error } = await supabase
    .from('user_benefits')
    .insert({
      user_id: userId,
      benefit_id: requestData.benefit_id,
      notes: requestData.notes || null,
      status: 'PENDING',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * User storniert eigenen Benefit-Request (nur PENDING)
 */
export async function cancelBenefitRequest(userBenefitId: string): Promise<void> {
  const { error } = await supabase
    .from('user_benefits')
    .update({ status: 'CANCELLED' })
    .eq('id', userBenefitId)
    .eq('status', 'PENDING'); // Nur PENDING kann storniert werden

  if (error) throw error;
}

/**
 * Admin genehmigt/lehnt Benefit-Request ab
 */
export async function approveBenefitRequest(
  approvalData: BenefitApprovalData,
  approverId: string
): Promise<UserBenefit> {
  const updateData: Partial<UserBenefit> = {
    status: approvalData.status,
    approved_by: approverId,
    approved_at: new Date().toISOString(),
    admin_notes: approvalData.admin_notes || null,
  };

  if (approvalData.status === 'REJECTED') {
    updateData.rejection_reason = approvalData.rejection_reason || null;
  }

  if (approvalData.status === 'APPROVED') {
    updateData.valid_from = approvalData.valid_from || null;
    updateData.valid_until = approvalData.valid_until || null;
  }

  const { data, error } = await supabase
    .from('user_benefits')
    .update(updateData)
    .eq('id', approvalData.user_benefit_id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// STATISTICS
// ============================================

/**
 * Holt Statistiken für ein Benefit
 */
export async function getBenefitStats(benefitId: string) {
  const { data, error } = await supabase
    .from('user_benefits')
    .select('status')
    .eq('benefit_id', benefitId);

  if (error) throw error;

  const stats = {
    total: data?.length || 0,
    pending: data?.filter((ub) => ub.status === 'PENDING').length || 0,
    approved: data?.filter((ub) => ub.status === 'APPROVED').length || 0,
    rejected: data?.filter((ub) => ub.status === 'REJECTED').length || 0,
    cancelled: data?.filter((ub) => ub.status === 'CANCELLED').length || 0,
  };

  return stats;
}

/**
 * Holt Benefits-Übersicht für Dashboard
 */
export async function getBenefitsDashboardStats(userId: string, organizationId: string) {
  const [userBenefits, allBenefits] = await Promise.all([
    getUserBenefits(userId),
    getBenefits(organizationId),
  ]);

  return {
    my_active: userBenefits.filter((ub) => ub.status === 'APPROVED').length,
    my_pending: userBenefits.filter((ub) => ub.status === 'PENDING').length,
    available: allBenefits.filter((b) => b.is_active).length,
  };
}

// ============================================
// SEARCH & FILTER
// ============================================

/**
 * Suche Benefits
 */
export async function searchBenefits(
  organizationId: string,
  query: string,
  category?: BenefitCategory
): Promise<Benefit[]> {
  let queryBuilder = supabase
    .from('benefits')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  if (query) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${query}%,short_description.ilike.%${query}%,description.ilike.%${query}%`
    );
  }

  if (category) {
    queryBuilder = queryBuilder.eq('category', category);
  }

  const { data, error } = await queryBuilder.order('title');

  if (error) throw error;
  return data || [];
}

// ============================================
// COIN SHOP INTEGRATION (v3.8.0)
// ============================================

/**
 * Helper: Berechnet Coin Balance eines Users
 */
async function calculateUserCoinBalance(userId: string): Promise<number> {
  const { data: transactions, error } = await supabase
    .from('coin_transactions')
    .select('amount, type')
    .eq('user_id', userId);

  if (error) throw error;

  return (transactions || []).reduce((balance, transaction) => {
    return balance + transaction.amount;
  }, 0);
}

/**
 * Holt Benefits mit Coin Purchase Info für Shop
 */
export async function getBenefitsWithPurchaseInfo(
  organizationId: string,
  userId: string
): Promise<BenefitWithPurchaseInfo[]> {
  // Benefits holen
  const benefits = await getBenefits(organizationId);

  // User Coin Balance holen
  const coinBalance = await calculateUserCoinBalance(userId);

  // User's bestehende Benefits holen
  const { data: userBenefits, error: userBenefitsError } = await supabase
    .from('user_benefits')
    .select('benefit_id, status')
    .eq('user_id', userId);

  if (userBenefitsError) throw userBenefitsError;

  // Enrich benefits mit Purchase Info
  return benefits.map((benefit) => {
    const existingBenefit = userBenefits?.find((ub) => ub.benefit_id === benefit.id);
    const hasBenefit = !!existingBenefit;
    const canAfford = coinBalance >= (benefit.coin_price || 0);

    // Prüfe Verfügbarkeit (max_users)
    const isAvailable =
      !benefit.max_users || benefit.current_users < benefit.max_users;

    // Kann mit Coins kaufen?
    const canPurchaseWithCoins =
      benefit.purchase_type !== 'REQUEST_ONLY' &&
      benefit.coin_price !== null &&
      benefit.coin_price > 0 &&
      !hasBenefit &&
      canAfford &&
      isAvailable &&
      benefit.is_active;

    // Kann per Antrag anfordern?
    const canRequest =
      benefit.purchase_type !== 'COINS_ONLY' &&
      !hasBenefit &&
      isAvailable &&
      benefit.is_active;

    return {
      ...benefit,
      user_coin_balance: coinBalance,
      can_purchase_with_coins: canPurchaseWithCoins,
      can_request: canRequest,
      has_benefit: hasBenefit,
      existing_status: existingBenefit?.status,
    };
  });
}

/**
 * Kauft ein Benefit mit Coins
 */
export async function purchaseBenefitWithCoins(
  benefitId: string,
  userId: string
): Promise<UserBenefit> {
  // 1. Load Benefit
  const benefit = await getBenefitById(benefitId);
  if (!benefit) {
    throw new Error('Benefit nicht gefunden');
  }

  if (!benefit.coin_price || benefit.coin_price <= 0) {
    throw new Error('Dieses Benefit kann nicht mit Coins gekauft werden');
  }

  if (!benefit.is_active) {
    throw new Error('Dieses Benefit ist nicht verfügbar');
  }

  // 2. Check User Coin Balance
  const balance = await calculateUserCoinBalance(userId);
  if (balance < benefit.coin_price) {
    throw new Error(
      `Nicht genügend Coins. Du hast ${balance} Coins, benötigt werden ${benefit.coin_price} Coins.`
    );
  }

  // 3. Check Availability (max_users)
  if (benefit.max_users && benefit.current_users >= benefit.max_users) {
    throw new Error('Dieses Benefit ist leider ausgebucht');
  }

  // 4. Check if user already has this benefit
  const { data: existingBenefit, error: existingError } = await supabase
    .from('user_benefits')
    .select('id, status')
    .eq('user_id', userId)
    .eq('benefit_id', benefitId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existingBenefit) {
    throw new Error('Du hast dieses Benefit bereits beantragt oder besitzt es schon');
  }

  // 5. Spend Coins (create transaction)
  const { data: transaction, error: coinError } = await supabase
    .from('coin_transactions')
    .insert({
      user_id: userId,
      amount: -benefit.coin_price,
      reason: `Benefit gekauft: ${benefit.title}`,
      type: 'SPENT',
      metadata: {
        benefit_id: benefitId,
        purchase_type: 'coin_shop',
      },
    })
    .select()
    .single();

  if (coinError) {
    throw new Error(`Fehler beim Coins ausgeben: ${coinError.message}`);
  }

  // 6. Determine Status
  // instant_approval nur wenn requires_approval = false
  const status =
    !benefit.requires_approval && benefit.instant_approval ? 'APPROVED' : 'PENDING';

  // 7. Create User Benefit
  const { data: userBenefit, error: benefitError } = await supabase
    .from('user_benefits')
    .insert({
      user_id: userId,
      benefit_id: benefitId,
      status: status,
      notes: `Gekauft für ${benefit.coin_price} Coins`,
      approved_at: status === 'APPROVED' ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (benefitError) {
    // Rollback: Refund coins
    await supabase.from('coin_transactions').insert({
      user_id: userId,
      amount: benefit.coin_price,
      reason: `Refund: Fehler beim Benefit-Kauf - ${benefit.title}`,
      type: 'EARNED',
      metadata: {
        refund: true,
        original_transaction_id: transaction.id,
        benefit_id: benefitId,
      },
    });

    throw new Error(`Fehler beim Benefit-Kauf: ${benefitError.message}`);
  }

  // 8. Log Purchase
  const { error: purchaseLogError } = await supabase
    .from('coin_benefit_purchases')
    .insert({
      user_id: userId,
      benefit_id: benefitId,
      coin_amount: benefit.coin_price,
      coin_transaction_id: transaction.id,
      user_benefit_id: userBenefit.id,
    });

  if (purchaseLogError) {
    console.error('Failed to log coin benefit purchase:', purchaseLogError);
    // Don't throw - purchase was successful
  }

  // 9. Update current_users count
  await supabase
    .from('benefits')
    .update({
      current_users: benefit.current_users + 1,
    })
    .eq('id', benefitId);

  return userBenefit;
}

/**
 * Holt Coin Purchase History eines Users
 */
export async function getUserCoinPurchases(
  userId: string
): Promise<CoinBenefitPurchase[]> {
  const { data, error } = await supabase
    .from('coin_benefit_purchases')
    .select('*')
    .eq('user_id', userId)
    .order('purchased_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
