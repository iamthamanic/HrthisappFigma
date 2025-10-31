import { useState } from 'react';
import { Gift, Plus, Trophy } from '../../components/icons/BrowoKoIcons';
import { toast } from 'sonner@2.0.3';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import AdminBenefitsList from '../../components/admin/BrowoKo_AdminBenefitsList';
import BenefitDialog from '../../components/admin/BrowoKo_BenefitDialog';
import AchievementDialog from '../../components/admin/BrowoKo_AchievementDialog';
import AdminAchievementsList from '../../components/admin/BrowoKo_AdminAchievementsList';
import { useBenefitsManagement } from '../../hooks/BrowoKo_useBenefitsManagement';
import { useAchievementsManagement } from '../../hooks/BrowoKo_useAchievementsManagement';
import { Button } from '../../components/ui/button';

export default function BenefitsManagementScreen() {
  const [activeTab, setActiveTab] = useState<'benefits' | 'achievements'>('benefits');

  // Benefits Management
  const {
    benefits,
    loading: benefitsLoading,
    isDialogOpen: isBenefitDialogOpen,
    setIsDialogOpen: setIsBenefitDialogOpen,
    editingBenefit,
    formData: benefitFormData,
    handleOpenDialog: handleOpenBenefitDialog,
    handleCloseDialog: handleCloseBenefitDialog,
    handleSubmit: handleBenefitSubmit,
    handleDelete: handleBenefitDelete,
    setFormData: setBenefitFormData
  } = useBenefitsManagement();

  // Achievements Management
  const {
    achievements,
    loading: achievementsLoading,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Benefits & Achievements verwalten</h1>
        <p className="text-sm text-gray-500 mt-1">
          Erstelle und verwalte Mitarbeiter-Benefits und Coin Achievements
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="benefits" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Benefits
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Achievements
            </TabsTrigger>
          </TabsList>

          {/* Action Button */}
          <Button
            onClick={() => {
              if (activeTab === 'benefits') {
                handleOpenBenefitDialog();
              } else {
                handleOpenAchievementDialog();
              }
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'benefits' ? 'Benefit hinzufügen' : 'Achievement hinzufügen'}
          </Button>
        </div>

        {/* Benefits Tab */}
        <TabsContent value="benefits" className="mt-0">
          {benefitsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <AdminBenefitsList
              benefits={benefits}
              onEdit={handleOpenBenefitDialog}
              onDelete={handleBenefitDelete}
              onCreate={handleOpenBenefitDialog}
            />
          )}
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="mt-0">
          {achievementsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <AdminAchievementsList
              achievements={achievements}
              onEdit={handleOpenAchievementDialog}
              onDelete={handleAchievementDelete}
              onCreateNew={() => handleOpenAchievementDialog()}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <BenefitDialog
        open={isBenefitDialogOpen}
        onOpenChange={setIsBenefitDialogOpen}
        editing={editingBenefit}
        formData={benefitFormData}
        setFormData={setBenefitFormData}
        onSubmit={handleBenefitSubmit}
        onClose={handleCloseBenefitDialog}
      />

      <AchievementDialog
        open={isAchievementDialogOpen}
        onOpenChange={setIsAchievementDialogOpen}
        editing={editingAchievement}
        formData={achievementFormData}
        setFormData={setAchievementFormData}
        onSubmit={handleAchievementSubmit}
        onClose={handleCloseAchievementDialog}
      />
    </div>
  );
}
