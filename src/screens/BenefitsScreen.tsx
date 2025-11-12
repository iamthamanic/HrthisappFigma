/**
 * ============================================
 * BENEFITS SCREEN (v3.9.2 - ACHIEVEMENT MANAGEMENT + COIN DISTRIBUTION)
 * ============================================
 * Version: 3.9.2
 * Description: Benefits System mit Coin-Shop + Achievements + Admin Tools
 * ============================================
 */

import { useState, useEffect } from 'react';
import { Search, Filter, ShoppingBag, Trophy, Plus, Coins } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import BrowoKo_BenefitBrowseCard from '../components/BrowoKo_BenefitBrowseCard';
import BrowoKo_MyBenefitsCard from '../components/BrowoKo_MyBenefitsCard';
import BrowoKo_BenefitRequestDialog from '../components/BrowoKo_BenefitRequestDialog';
import BrowoKo_BenefitPurchaseDialog from '../components/BrowoKo_BenefitPurchaseDialog';
import BrowoKo_BenefitApprovalDialog from '../components/BrowoKo_BenefitApprovalDialog';
import BrowoKo_AdminBenefitsList from '../components/admin/BrowoKo_AdminBenefitsList';
import BrowoKo_AdminApprovalQueue from '../components/admin/BrowoKo_AdminApprovalQueue';
import BrowoKo_BenefitDialog from '../components/admin/BrowoKo_BenefitDialog';
import BrowoKo_CoinWalletWidget from '../components/BrowoKo_CoinWalletWidget';
import BrowoKo_CoinAchievementCard from '../components/BrowoKo_CoinAchievementCard';
import AchievementDialog from '../components/admin/BrowoKo_AchievementDialog';
import CoinDistributionDialog from '../components/admin/BrowoKo_CoinDistributionDialog';
import LoadingState from '../components/LoadingState';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { useAchievementsManagement } from '../hooks/BrowoKo_useAchievementsManagement';
import type {
  Benefit,
  BenefitWithUserStatus,
  BenefitWithPurchaseInfo,
  UserBenefitWithDetails,
  BenefitFormData,
  BenefitCategory,
} from '../types/schemas/BrowoKo_benefitSchemas';
import type { CoinAchievementWithProgress } from '../types/database';
import { BENEFIT_CATEGORIES, BENEFIT_CATEGORY_META, canRequestBenefit, getMonthsEmployed } from '../types/schemas/BrowoKo_benefitSchemas';
import * as benefitsService from '../services/BrowoKo_benefitsService';
import * as coinAchievementsService from '../services/BrowoKo_coinAchievementsService';

export default function BenefitsScreen() {
  const { user, profile } = useAuthStore();
  const { loadCoinBalance } = useGamificationStore();
  const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'HR' || profile?.role === 'SUPERADMIN';

  // Achievements Management Hook (v3.9.2)
  const {
    achievements: adminAchievements,
    isDialogOpen: isAchievementDialogOpen,
    setIsDialogOpen: setIsAchievementDialogOpen,
    editingAchievement,
    formData: achievementFormData,
    handleOpenDialog: handleOpenAchievementDialog,
    handleCloseDialog: handleCloseAchievementDialog,
    handleSubmit: handleAchievementSubmit,
    handleDelete: handleAchievementDelete,
    setFormData: setAchievementFormData,
  } = useAchievementsManagement();

  // Coin Distribution Dialog (v3.9.2)
  const [coinDistributionDialogOpen, setCoinDistributionDialogOpen] = useState(false);

  // State
  const [loading, setLoading] = useState(true);
  const [benefits, setBenefits] = useState<BenefitWithPurchaseInfo[]>([]); // v3.8.0: Changed to PurchaseInfo
  const [myBenefits, setMyBenefits] = useState<UserBenefitWithDetails[]>([]);
  const [pendingRequests, setPendingRequests] = useState<UserBenefitWithDetails[]>([]);
  const [adminBenefits, setAdminBenefits] = useState<Benefit[]>([]);
  
  // Coin Achievements State (v3.9.0)
  const [achievements, setAchievements] = useState<CoinAchievementWithProgress[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<BenefitCategory | 'all'>('all');
  
  // My Benefits Filters (v3.9.0)
  const [myBenefitsSearch, setMyBenefitsSearch] = useState('');
  const [myBenefitsDateFrom, setMyBenefitsDateFrom] = useState('');
  const [myBenefitsDateTo, setMyBenefitsDateTo] = useState('');
  const [myBenefitsStatusFilter, setMyBenefitsStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');
  
  // Approvals Filters (v3.9.0)
  const [approvalsSearch, setApprovalsSearch] = useState('');
  const [approvalsDateFrom, setApprovalsDateFrom] = useState('');
  const [approvalsDateTo, setApprovalsDateTo] = useState('');

  // Dialogs
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | BenefitWithPurchaseInfo | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UserBenefitWithDetails | null>(null);
  const [approvalMode, setApprovalMode] = useState<'approve' | 'reject'>('approve');
  const [benefitDialogOpen, setBenefitDialogOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  
  // Coin Purchase Dialog (v3.8.0)
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedPurchaseBenefit, setSelectedPurchaseBenefit] = useState<BenefitWithPurchaseInfo | null>(null);

  // Load Data
  useEffect(() => {
    loadData();
  }, [user, profile]);

  const loadData = async () => {
    if (!user || !profile?.organization_id) return;

    setLoading(true);
    try {
      // v3.9.0: Load benefits, achievements, and check for new unlocks
      const [benefitsData, myBenefitsData, achievementsData] = await Promise.all([
        benefitsService.getBenefitsWithPurchaseInfo(profile.organization_id, user.id),
        benefitsService.getUserBenefits(user.id),
        coinAchievementsService.getCoinAchievementsWithProgress(user.id),
      ]);

      setBenefits(benefitsData);
      setMyBenefits(myBenefitsData);
      setAchievements(achievementsData);

      // Check for newly unlocked achievements
      const newUnlocks = await coinAchievementsService.checkAndUnlockAchievements(user.id);
      if (newUnlocks.length > 0) {
        // Reload achievements to show unlocked ones
        const updatedAchievements = await coinAchievementsService.getCoinAchievementsWithProgress(user.id);
        setAchievements(updatedAchievements);
        
        // Show toast for new unlocks
        newUnlocks.forEach((unlock) => {
          toast.success(`Achievement freigeschaltet: ${unlock.title}!`, {
            description: `Du hast ${unlock.required_coins} Coins erreicht!`,
          });
        });
      }

      // Admin: Load pending requests & all benefits
      if (isAdmin) {
        const [pendingData, adminBenefitsData] = await Promise.all([
          benefitsService.getPendingBenefitRequests(profile.organization_id),
          benefitsService.getBenefits(profile.organization_id),
        ]);
        setPendingRequests(pendingData);
        setAdminBenefits(adminBenefitsData);
      }
    } catch (error) {
      console.error('Error loading benefits:', error);
      toast.error('Fehler beim Laden der Benefits');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HANDLERS: REQUEST
  // ============================================

  const handleRequestClick = (benefitId: string) => {
    const benefit = benefits.find((b) => b.id === benefitId);
    if (!benefit) return;

    // Check eligibility
    const monthsEmployed = profile?.date_of_joining
      ? getMonthsEmployed(profile.date_of_joining)
      : 0;
    const eligibility = canRequestBenefit(benefit, monthsEmployed, benefit.user_benefit);

    if (!eligibility.can) {
      toast.error(eligibility.reason);
      return;
    }

    setSelectedBenefit(benefit);
    setRequestDialogOpen(true);
  };

  const handleRequest = async (notes: string) => {
    if (!selectedBenefit || !user) return;

    try {
      await benefitsService.requestBenefit(
        { benefit_id: selectedBenefit.id, notes },
        user.id
      );
      toast.success('Benefit-Anfrage erfolgreich gesendet!');
      loadData(); // Reload
    } catch (error: any) {
      console.error('Error requesting benefit:', error);
      if (error.code === '23505') {
        toast.error('Du hast dieses Benefit bereits angefordert');
      } else {
        toast.error('Fehler beim Anfordern des Benefits');
      }
    }
  };

  const handleCancelRequest = async (userBenefitId: string) => {
    try {
      await benefitsService.cancelBenefitRequest(userBenefitId);
      toast.success('Anfrage erfolgreich storniert');
      loadData();
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Fehler beim Stornieren der Anfrage');
    }
  };

  // ============================================
  // HANDLERS: COIN PURCHASE (v3.8.0)
  // ============================================

  const handlePurchaseClick = (benefitId: string, coinPrice: number) => {
    const benefit = benefits.find((b) => b.id === benefitId);
    if (!benefit) return;

    setSelectedPurchaseBenefit(benefit);
    setPurchaseDialogOpen(true);
  };

  const handlePurchaseConfirm = async () => {
    if (!selectedPurchaseBenefit || !user) return;

    try {
      await benefitsService.purchaseBenefitWithCoins(
        selectedPurchaseBenefit.id,
        user.id
      );

      const requiresApproval = selectedPurchaseBenefit.requires_approval;
      const instantApproval = selectedPurchaseBenefit.instant_approval;

      if (!requiresApproval && instantApproval) {
        toast.success('Benefit erfolgreich gekauft!', {
          description: 'Das Benefit steht dir sofort zur Verfügung.',
        });
      } else {
        toast.success('Benefit erfolgreich gekauft!', {
          description: 'Dein Kauf wartet auf Genehmigung durch einen Admin.',
        });
      }

      setPurchaseDialogOpen(false);
      setSelectedPurchaseBenefit(null);
      
      // Reload data AND coin balance in header widget
      await Promise.all([
        loadData(),
        loadCoinBalance(user.id), // Update header coin widget!
      ]);
    } catch (error: any) {
      console.error('Error purchasing benefit:', error);
      toast.error('Fehler beim Kauf', {
        description: error.message || 'Bitte versuche es später erneut.',
      });
    }
  };

  // ============================================
  // HANDLERS: APPROVAL (Admin)
  // ============================================

  const handleApproveClick = (request: UserBenefitWithDetails) => {
    setSelectedRequest(request);
    setApprovalMode('approve');
    setApprovalDialogOpen(true);
  };

  const handleRejectClick = (request: UserBenefitWithDetails) => {
    setSelectedRequest(request);
    setApprovalMode('reject');
    setApprovalDialogOpen(true);
  };

  const handleApprovalConfirm = async (adminNotes: string, rejectionReason?: string) => {
    if (!selectedRequest || !user) return;

    try {
      await benefitsService.approveBenefitRequest(
        {
          user_benefit_id: selectedRequest.id,
          status: approvalMode === 'approve' ? 'APPROVED' : 'REJECTED',
          admin_notes: adminNotes || undefined,
          rejection_reason: rejectionReason,
        },
        user.id
      );

      toast.success(
        approvalMode === 'approve'
          ? 'Benefit erfolgreich genehmigt!'
          : 'Benefit-Anfrage abgelehnt'
      );
      loadData();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Fehler beim Bearbeiten der Anfrage');
    }
  };

  // ============================================
  // HANDLERS: COIN ACHIEVEMENTS (v3.9.0)
  // ============================================

  const handleClaimAchievement = async (achievementId: string) => {
    if (!user) return;

    try {
      await coinAchievementsService.claimAchievement(user.id, achievementId);
      toast.success('Achievement erfolgreich eingelöst!');
      
      // Reload achievements
      const updatedAchievements = await coinAchievementsService.getCoinAchievementsWithProgress(user.id);
      setAchievements(updatedAchievements);
    } catch (error) {
      console.error('Error claiming achievement:', error);
      toast.error('Fehler beim Einlösen des Achievements');
    }
  };

  // ============================================
  // HANDLERS: COIN DISTRIBUTION (v3.9.2)
  // ============================================

  const handleCoinDistribution = async (data: { user_ids: string[]; amount: number; reason: string }) => {
    if (!user) return;

    try {
      const result = await coinAchievementsService.distributeCoinsToUsers({
        user_ids: data.user_ids,
        amount: data.amount,
        reason: data.reason,
        distributed_by: user.id,
      });

      const recipientText = result.count === 1 
        ? '1 Mitarbeiter' 
        : `${result.count} Mitarbeiter`;
      
      toast.success(`Coins erfolgreich verteilt!`, {
        description: `${data.amount} Coins an ${recipientText} vergeben.`,
      });
      
      // Reload data and coin balance
      await Promise.all([
        loadData(),
        loadCoinBalance(user.id),
      ]);
    } catch (error) {
      console.error('Error distributing coins:', error);
      toast.error('Fehler beim Verteilen der Coins');
      throw error; // Re-throw to let dialog handle it
    }
  };

  // ============================================
  // HANDLERS: ADMIN CRUD
  // ============================================

  const handleCreateBenefit = () => {
    setEditingBenefit(null);
    setBenefitDialogOpen(true);
  };

  const handleEditBenefit = (benefit: Benefit) => {
    setEditingBenefit(benefit);
    setBenefitDialogOpen(true);
  };

  const handleSaveBenefit = async (formData: BenefitFormData) => {
    if (!profile?.organization_id || !user) return;

    try {
      if (editingBenefit) {
        await benefitsService.updateBenefit(editingBenefit.id, formData);
        toast.success('Benefit erfolgreich aktualisiert!');
      } else {
        await benefitsService.createBenefit(formData, profile.organization_id, user.id);
        toast.success('Benefit erfolgreich erstellt!');
      }
      loadData();
    } catch (error) {
      console.error('Error saving benefit:', error);
      toast.error('Fehler beim Speichern des Benefits');
    }
  };

  const handleDeleteBenefit = async (benefitId: string) => {
    try {
      await benefitsService.deleteBenefit(benefitId);
      toast.success('Benefit erfolgreich gelöscht!');
      loadData();
    } catch (error) {
      console.error('Error deleting benefit:', error);
      toast.error('Fehler beim Löschen des Benefits');
    }
  };

  // ============================================
  // FILTERED BENEFITS
  // ============================================

  const filteredBenefits = benefits.filter((benefit) => {
    // Search
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      if (
        !benefit.title.toLowerCase().includes(search) &&
        !benefit.short_description.toLowerCase().includes(search)
      ) {
        return false;
      }
    }

    // Category
    if (categoryFilter !== 'all' && benefit.category !== categoryFilter) {
      return false;
    }

    return true;
  });

  // Filtered My Benefits (v3.9.0)
  const filteredMyBenefits = myBenefits.filter((userBenefit) => {
    // Search
    if (myBenefitsSearch) {
      const search = myBenefitsSearch.toLowerCase();
      if (
        !userBenefit.benefit_title.toLowerCase().includes(search) &&
        !userBenefit.benefit_short_description?.toLowerCase().includes(search)
      ) {
        return false;
      }
    }

    // Status Filter
    if (myBenefitsStatusFilter !== 'all' && userBenefit.status !== myBenefitsStatusFilter) {
      return false;
    }

    // Date Range
    if (myBenefitsDateFrom && new Date(userBenefit.requested_at) < new Date(myBenefitsDateFrom)) {
      return false;
    }
    if (myBenefitsDateTo && new Date(userBenefit.requested_at) > new Date(myBenefitsDateTo)) {
      return false;
    }

    return true;
  });

  // Filtered Pending Requests (Admin) (v3.9.0)
  const filteredPendingRequests = pendingRequests.filter((request) => {
    // Search
    if (approvalsSearch) {
      const search = approvalsSearch.toLowerCase();
      if (
        !request.benefit_title.toLowerCase().includes(search) &&
        !request.user_name?.toLowerCase().includes(search) &&
        !request.user_email?.toLowerCase().includes(search)
      ) {
        return false;
      }
    }

    // Date Range
    if (approvalsDateFrom && new Date(request.requested_at) < new Date(approvalsDateFrom)) {
      return false;
    }
    if (approvalsDateTo && new Date(request.requested_at) > new Date(approvalsDateTo)) {
      return false;
    }

    return true;
  });

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return <LoadingState loading={true} type="spinner" />;
  }

  return (
    <div className="min-h-screen pt-20 md:pt-6 px-4 md:px-6">
      {/* ✅ MAX-WIDTH CONTAINER */}
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with Coin Wallet - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Benefits</h1>
          <p className="text-sm text-gray-500 mt-1">
            Entdecke und verwalte deine Mitarbeiter-Vorteile
          </p>
        </div>
        {/* Coin Wallet Widget - only visible on Benefits screen! */}
        <div className="shrink-0">
          <BrowoKo_CoinWalletWidget />
        </div>
      </div>

      {/* Tabs (v3.8.0: "Shop" statt "Benefits durchsuchen") */}
      <Tabs defaultValue="browse" className="w-full">
        <div className="overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="w-full sm:w-auto inline-flex min-w-full sm:min-w-0">
            <TabsTrigger value="browse" className="flex-shrink-0">
              <ShoppingBag className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Shop</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex-shrink-0">
              <Trophy className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Achievements</span>
              {achievements.filter((a) => a.is_unlocked && !a.is_claimed).length > 0 && (
                <Badge className="ml-1 sm:ml-2 bg-orange-600 hover:bg-orange-600 border-0 text-xs">
                  {achievements.filter((a) => a.is_unlocked && !a.is_claimed).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="my-benefits" className="flex-shrink-0">
              <span className="text-xs sm:text-sm">Meine</span>
              {myBenefits.filter((b) => b.status === 'APPROVED').length > 0 && (
                <Badge className="ml-1 sm:ml-2 bg-green-600 hover:bg-green-600 border-0 text-xs">
                  {myBenefits.filter((b) => b.status === 'APPROVED').length}
                </Badge>
              )}
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="management" className="flex-shrink-0">
                  <span className="text-xs sm:text-sm">Admin</span>
                </TabsTrigger>
                <TabsTrigger value="approvals" className="flex-shrink-0">
                  <span className="text-xs sm:text-sm">Approve</span>
                  {pendingRequests.length > 0 && (
                    <Badge className="ml-1 sm:ml-2 bg-yellow-600 hover:bg-yellow-600 border-0 text-xs">
                      {pendingRequests.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        {/* TAB: Browse Benefits */}
        <TabsContent value="browse" className="space-y-4 md:space-y-6">
          {/* Filters - Responsive */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Benefits durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={(v: any) => setCategoryFilter(v)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {BENEFIT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {BENEFIT_CATEGORY_META[cat].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grid */}
          {filteredBenefits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Keine Benefits gefunden</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBenefits.map((benefit) => (
                <BrowoKo_BenefitBrowseCard
                  key={benefit.id}
                  benefit={benefit}
                  onRequest={handleRequestClick}
                  onPurchase={handlePurchaseClick}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB: Coin Achievements (v3.9.0) */}
        <TabsContent value="achievements" className="space-y-6">
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Gesamt</p>
              <p className="text-2xl font-bold text-gray-900">{achievements.length}</p>
              <p className="text-xs text-gray-500">Achievements</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Freigeschaltet</p>
              <p className="text-2xl font-bold text-green-700">
                {achievements.filter((a) => a.is_unlocked).length}
              </p>
              <p className="text-xs text-gray-500">
                {Math.round((achievements.filter((a) => a.is_unlocked).length / achievements.length) * 100)}%
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Eingelöst</p>
              <p className="text-2xl font-bold text-blue-700">
                {achievements.filter((a) => a.is_claimed).length}
              </p>
              <p className="text-xs text-gray-500">von {achievements.filter((a) => a.is_unlocked).length}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Nächstes Ziel</p>
              <p className="text-xl font-bold text-purple-700">
                {achievements.find((a) => !a.is_unlocked)?.required_coins.toLocaleString('de-DE') || '—'}
              </p>
              <p className="text-xs text-gray-500">Coins erforderlich</p>
            </div>
          </div>

          {/* Achievements Grid */}
          {achievements.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Keine Achievements verfügbar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <BrowoKo_CoinAchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  onClaim={handleClaimAchievement}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB: My Benefits - Responsive */}
        <TabsContent value="my-benefits" className="space-y-4 md:space-y-6">
          {/* Filters - Responsive */}
          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-4 md:gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Benefits durchsuchen..."
                  value={myBenefitsSearch}
                  onChange={(e) => setMyBenefitsSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={myBenefitsStatusFilter} onValueChange={(v: any) => setMyBenefitsStatusFilter(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="PENDING">Ausstehend</SelectItem>
                <SelectItem value="APPROVED">Genehmigt</SelectItem>
                <SelectItem value="REJECTED">Abgelehnt</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range - Stack on mobile */}
            <div className="grid grid-cols-2 gap-2 md:flex md:gap-2">
              <Input
                type="date"
                placeholder="Von"
                value={myBenefitsDateFrom}
                onChange={(e) => setMyBenefitsDateFrom(e.target.value)}
                className="flex-1"
              />
              <Input
                type="date"
                placeholder="Bis"
                value={myBenefitsDateTo}
                onChange={(e) => setMyBenefitsDateTo(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Results Count - Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-sm text-gray-500">
            <span>
              {filteredMyBenefits.length} von {myBenefits.length} Benefits
            </span>
            {(myBenefitsSearch || myBenefitsStatusFilter !== 'all' || myBenefitsDateFrom || myBenefitsDateTo) && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => {
                  setMyBenefitsSearch('');
                  setMyBenefitsStatusFilter('all');
                  setMyBenefitsDateFrom('');
                  setMyBenefitsDateTo('');
                }}
              >
                Filter zurücksetzen
              </Button>
            )}
          </div>

          {/* Benefits List */}
          {filteredMyBenefits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {myBenefits.length === 0
                  ? 'Du hast noch keine Benefits angefordert'
                  : 'Keine Benefits gefunden mit den aktuellen Filtern'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMyBenefits.map((userBenefit) => (
                <BrowoKo_MyBenefitsCard
                  key={userBenefit.id}
                  userBenefit={userBenefit}
                  onCancel={handleCancelRequest}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB: Admin Management (v3.9.2: + Achievement & Coin Distribution) */}
        {isAdmin && (
          <TabsContent value="management" className="space-y-4 md:space-y-6">
            {/* Admin Action Buttons - Responsive */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <Button onClick={handleCreateBenefit} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Benefit hinzufügen
              </Button>
              <Button onClick={() => handleOpenAchievementDialog()} className="w-full sm:w-auto">
                <Trophy className="w-4 h-4 mr-2" />
                Neues Achievement erstellen
              </Button>
              <Button onClick={() => setCoinDistributionDialogOpen(true)} className="w-full sm:w-auto">
                <Coins className="w-4 h-4 mr-2" />
                Coins verteilen
              </Button>
            </div>

            {/* Benefits List */}
            <BrowoKo_AdminBenefitsList
              benefits={adminBenefits}
              onEdit={handleEditBenefit}
              onDelete={handleDeleteBenefit}
              onCreate={handleCreateBenefit}
            />
          </TabsContent>
        )}

        {/* TAB: Admin Approvals - Responsive */}
        {isAdmin && (
          <TabsContent value="approvals" className="space-y-4 md:space-y-6">
            {/* Filters - Responsive */}
            <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Benefit, User, oder E-Mail durchsuchen..."
                    value={approvalsSearch}
                    onChange={(e) => setApprovalsSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Date Range - Stack on mobile */}
              <div className="grid grid-cols-2 gap-2 md:flex md:gap-2">
                <Input
                  type="date"
                  placeholder="Von"
                  value={approvalsDateFrom}
                  onChange={(e) => setApprovalsDateFrom(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="date"
                  placeholder="Bis"
                  value={approvalsDateTo}
                  onChange={(e) => setApprovalsDateTo(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Results Count - Responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-sm text-gray-500">
              <span>
                {filteredPendingRequests.length} von {pendingRequests.length} Anfragen
              </span>
              {(approvalsSearch || approvalsDateFrom || approvalsDateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setApprovalsSearch('');
                    setApprovalsDateFrom('');
                    setApprovalsDateTo('');
                  }}
                >
                  Filter zurücksetzen
                </Button>
              )}
            </div>

            {/* Approval Queue */}
            <BrowoKo_AdminApprovalQueue
              requests={filteredPendingRequests}
              onApprove={handleApproveClick}
              onReject={handleRejectClick}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Dialogs */}
      <BrowoKo_BenefitRequestDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        benefit={selectedBenefit}
        onRequest={handleRequest}
      />

      {/* Coin Purchase Dialog (v3.8.0) */}
      <BrowoKo_BenefitPurchaseDialog
        benefit={selectedPurchaseBenefit}
        open={purchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
        onConfirm={handlePurchaseConfirm}
      />

      <BrowoKo_BenefitApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        request={selectedRequest}
        mode={approvalMode}
        onConfirm={handleApprovalConfirm}
      />

      {isAdmin && (
        <BrowoKo_BenefitDialog
          open={benefitDialogOpen}
          onOpenChange={setBenefitDialogOpen}
          onSave={handleSaveBenefit}
          editingBenefit={editingBenefit}
        />
      )}

      {/* Achievement Dialog (v3.9.2) */}
      {isAdmin && (
        <AchievementDialog
          open={isAchievementDialogOpen}
          onOpenChange={setIsAchievementDialogOpen}
          editing={editingAchievement}
          formData={achievementFormData}
          setFormData={setAchievementFormData}
          onSubmit={handleAchievementSubmit}
          onClose={handleCloseAchievementDialog}
        />
      )}

      {/* Coin Distribution Dialog (v3.9.2) */}
      {isAdmin && profile?.organization_id && (
        <CoinDistributionDialog
          open={coinDistributionDialogOpen}
          onOpenChange={setCoinDistributionDialogOpen}
          onDistribute={handleCoinDistribution}
          organizationId={profile.organization_id}
        />
      )}
      </div> {/* ✅ Close max-width container */}
    </div>
  );
}
