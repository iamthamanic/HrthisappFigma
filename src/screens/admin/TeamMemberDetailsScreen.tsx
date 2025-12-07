/**
 * @file TeamMemberDetailsScreen.tsx (FULLY REFACTORED ✅ 100%)
 * @domain HR - Team Member Details
 * @description Comprehensive team member details with 4 tabs
 * 
 * REFACTORING PHASE 2 - PRIORITY 2 COMPLETE! 🎉
 * 
 * ORIGINAL SIZE: ~1300 lines
 * REFACTORED SIZE: ~250 lines (orchestration only)
 * REDUCTION: 81% 🔥
 * 
 * EXTRACTED TO:
 * 
 * HOOKS (2):
 * - HRTHIS_useTeamMemberDetails.ts (~190 lines) - Data loading (learning, logs, teams)
 * - HRTHIS_useTeamMemberForm.ts (~210 lines) - Form state and handlers
 * 
 * COMPONENTS (7):
 * - HRTHIS_PersonalInfoCard.tsx (~90 lines) - Personal information form
 * - HRTHIS_AddressCard.tsx (~80 lines) - Address form
 * - HRTHIS_BankInfoCard.tsx (~60 lines) - Bank details form
 * - HRTHIS_ClothingSizesCard.tsx (~80 lines) - Clothing sizes form
 * - HRTHIS_EmploymentInfoCard.tsx (~600 lines) - Employment, breaks, work time model, on-call
 * - HRTHIS_TeamMemberLearningTab.tsx (~220 lines) - Videos & quizzes progress
 * - HRTHIS_TeamMemberLogsTab.tsx (~130 lines) - Time records & leave requests
 * 
 * ALL TABS FULLY IMPLEMENTED:
 * - ✅ Employee Data Tab - 5 modular form cards
 * - ✅ Learning Progress Tab - Extracted to component
 * - ✅ Logs Tab - Extracted to component
 * - ✅ Permissions Tab - Uses PermissionsEditor
 * 
 * COMPLEXITY BREAKDOWN:
 * - 81% reduction in main screen complexity 🔥
 * - State management extracted to hooks
 * - Data loading logic separated
 * - Form handlers centralized
 * - All tabs modularized into reusable components
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, User, Shield, Upload } from '../../components/icons/BrowoKoIcons';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useAdminStore } from '../../stores/BrowoKo_adminStore';
import { useAuthStore } from '../../stores/BrowoKo_authStore';
import { useLearningStore } from '../../stores/BrowoKo_learningStore';
import PermissionsEditor from '../../components/PermissionsEditor';
import { useRoleManagement } from '../../hooks/useRoleManagement';
import { UserRole } from '../../hooks/usePermissions';
import { useTeamMemberDetails } from '../../hooks/BrowoKo_useTeamMemberDetails';

import { PersonalInfoCard } from '../../components/admin/BrowoKo_PersonalInfoCard';
import { AddressCard } from '../../components/admin/BrowoKo_AddressCard';
import { BankInfoCard } from '../../components/admin/BrowoKo_BankInfoCard';
import { ClothingSizesCard } from '../../components/admin/BrowoKo_ClothingSizesCard';
import { EmploymentInfoCard } from '../../components/admin/BrowoKo_EmploymentInfoCard';
import { EmergencyContactCard } from '../../components/admin/BrowoKo_EmergencyContactCard';
import { LanguageSkillsCard } from '../../components/admin/BrowoKo_LanguageSkillsCard';
import { TeamMemberLearningTab } from '../../components/admin/BrowoKo_TeamMemberLearningTab';
import { TeamMemberLogsTab } from '../../components/admin/BrowoKo_TeamMemberLogsTab';
import { TeamMemberPerformanceReviewsTab } from '../../components/admin/BrowoKo_TeamMemberPerformanceReviewsTab';
import { DocumentsTabContent } from '../../components/BrowoKo_DocumentsTabContent';
import { ImageCropDialog } from '../../components/ImageCropDialog';
import { EditWarningDialog } from '../../components/BrowoKo_EditWarningDialog';
import { useCardEditing } from '../../hooks/BrowoKo_useCardEditing';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../../utils/supabase/client';

export default function TeamMemberDetailsScreen() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { users, locations, loadLocations, departments, loadDepartments, loadUsers } = useAdminStore();
  const { profile } = useAuthStore();
  const { videos, quizzes, loadVideos, loadQuizzes } = useLearningStore();

  const user = users.find(u => u.id === userId);

  // Custom hooks - ⚡ REFACTORING: State management extracted
  const teamMemberDetails = useTeamMemberDetails(userId);

  // v4.8.0: Card-Level Editing
  const cardEditing = useCardEditing();
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  // v4.7.3: Profile Picture Upload State
  const [showImageCropDialog, setShowImageCropDialog] = useState(false);
  const [tempImageForCrop, setTempImageForCrop] = useState<string | undefined>(undefined);

  // Role management hook
  const {
    changeUserRole,
  } = useRoleManagement();

  // Load locations, departments, and learning content on mount
  useEffect(() => {
    loadLocations().catch(err => console.warn('Failed to load locations:', err));
    loadDepartments().catch(err => console.warn('Failed to load departments:', err));
    loadVideos();
    loadQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - functions are stable from Zustand stores

  // Handle role change separately
  const handleRoleChange = async (newRole: string) => {
    if (!user || !profile) return;

    const result = await changeUserRole(user.id, newRole as UserRole, profile.role as UserRole);

    if (result.success) {
      await loadUsers();
    }
  };

  // v4.8.0: Card editing handler
  const handleCardEditStart = (cardId: string) => {
    const allowed = cardEditing.startEditing(cardId);
    if (!allowed) {
      setShowWarningDialog(true);
      return false;
    }
    return true;
  };

  // v4.7.3: Profile Picture Upload Handlers
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte wähle eine Bilddatei aus');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bild ist zu groß (max. 5MB)');
      return;
    }

    // Read file and show crop dialog
    const reader = new FileReader();
    reader.onload = (e) => {
      setTempImageForCrop(e.target?.result as string);
      setShowImageCropDialog(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCroppedImage = async (croppedImage: string) => {
    if (!user) return;

    try {
      // Convert base64 to blob
      const response = await fetch(croppedImage);
      const blob = await response.blob();

      // Upload to storage
      const fileName = `${user.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_picture: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('Profilbild erfolgreich aktualisiert');
      
      // Reload users to show updated profile picture
      await loadUsers();

    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      toast.error(`Fehler beim Hochladen: ${error.message}`);
    } finally {
      setShowImageCropDialog(false);
      setTempImageForCrop(undefined);
    }
  };

  // Get location name (only helper function needed in main screen)
  const getLocationName = (locationId: string | null) => {
    if (!locationId) return 'Nicht angegeben';
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : 'Nicht angegeben';
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate('/admin/team-und-mitarbeiterverwaltung')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück
        </Button>
        <Card>
          <CardContent className="p-12 text-center text-gray-400">
            <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Mitarbeiter nicht gefunden</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 md:pt-6 px-4 md:px-6">
      {/* ✅ MAX-WIDTH CONTAINER */}
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 pb-20 md:pb-0">
      {/* Compact Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10">
        {/* Back Button */}
        <Button variant="outline" onClick={() => navigate('/admin/team-und-mitarbeiterverwaltung')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Zurück zur Team und Mitarbeiterverwaltung</span>
          <span className="sm:hidden">Zurück</span>
        </Button>

        {/* Info Badge */}
        <div className="text-sm text-gray-500">
          Mitarbeiterdetails • {user.first_name} {user.last_name}
        </div>
      </div>

      {/* Tabs - v4.7.3: Renamed to "Personalakte (Admin)" */}
      <Tabs defaultValue="personalakte" className="space-y-4 md:space-y-6">
        {/* Desktop: 6-column grid in one row */}
        <TabsList className="hidden md:grid w-full grid-cols-6 h-auto">
          <TabsTrigger value="personalakte">
            <User className="w-4 h-4 mr-2" />
            Personalakte (Admin)
          </TabsTrigger>
          <TabsTrigger value="lernfortschritt">Lernfortschritt</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="gespraeche">Gespräche</TabsTrigger>
          <TabsTrigger value="permissions">Berechtigungen</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
        </TabsList>

        {/* Mobile: 3 columns, wrap to 2 rows */}
        <TabsList className="md:hidden grid grid-cols-3 gap-2 h-auto p-2 bg-gray-100">
          <TabsTrigger value="personalakte" className="flex flex-col items-center gap-1 py-3 text-xs">
            <span>Akte</span>
          </TabsTrigger>
          <TabsTrigger value="lernfortschritt" className="flex flex-col items-center gap-1 py-3 text-xs">
            <span>Lernen</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex flex-col items-center gap-1 py-3 text-xs">
            <span>Logs</span>
          </TabsTrigger>
          <TabsTrigger value="gespraeche" className="flex flex-col items-center gap-1 py-3 text-xs">
            <span>Gespräche</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex flex-col items-center gap-1 py-3 text-xs">
            <span>Rechte</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex flex-col items-center gap-1 py-3 text-xs">
            <span>Docs</span>
          </TabsTrigger>
        </TabsList>

        {/* Personalakte (Admin) Tab - v4.7.3: Restructured like PersonalSettings */}
        <TabsContent value="personalakte" className="space-y-6">
          {/* Profile Picture Card - Always editable for Admin */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage 
                    src={user.profile_picture || undefined} 
                    alt={`${user.first_name} ${user.last_name}`} 
                  />
                  <AvatarFallback className="text-2xl">
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Profilbild</h3>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="admin-profile-picture-upload"
                  />
                  <label htmlFor="admin-profile-picture-upload">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Bild hochladen
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Empfohlen: Quadratisches Bild, mindestens 400x400px
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 1: PERSÖNLICHE INFORMATIONEN */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Persönliche Informationen</h2>

            <PersonalInfoCard
              user={user}
              canEdit={cardEditing.canEdit('personal_info')}
              onEditStart={() => handleCardEditStart('personal_info')}
              onEditEnd={cardEditing.stopEditing}
              onDataUpdated={loadUsers}
            />

            <AddressCard
              user={user}
              canEdit={cardEditing.canEdit('address')}
              onEditStart={() => handleCardEditStart('address')}
              onEditEnd={cardEditing.stopEditing}
              onDataUpdated={loadUsers}
            />

            <BankInfoCard
              user={user}
              canEdit={cardEditing.canEdit('bank_info')}
              onEditStart={() => handleCardEditStart('bank_info')}
              onEditEnd={cardEditing.stopEditing}
              onDataUpdated={loadUsers}
            />

            <ClothingSizesCard
              user={user}
              canEdit={cardEditing.canEdit('clothing_sizes')}
              onEditStart={() => handleCardEditStart('clothing_sizes')}
              onEditEnd={cardEditing.stopEditing}
              onDataUpdated={loadUsers}
            />

            <EmergencyContactCard
              user={user}
              canEdit={cardEditing.canEdit('emergency_contact')}
              onEditStart={() => handleCardEditStart('emergency_contact')}
              onEditEnd={cardEditing.stopEditing}
              onDataUpdated={loadUsers}
            />

            <LanguageSkillsCard
              user={user}
              canEdit={cardEditing.canEdit('language_skills')}
              onEditStart={() => handleCardEditStart('language_skills')}
              onEditEnd={cardEditing.stopEditing}
              onDataUpdated={loadUsers}
            />
          </div>

          {/* SECTION 2: ARBEITSINFORMATIONEN */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Arbeitsinformationen</h2>

            <EmploymentInfoCard
              user={user}
              teams={teamMemberDetails.teams}
              locations={locations}
              departments={departments}
              userTeams={teamMemberDetails.userTeams}
              teamRoles={teamMemberDetails.teamRoles}
              canEdit={!cardEditing.isAnyCardEditing}
              onEditStart={cardEditing.startEditing}
              onEditEnd={cardEditing.stopEditing}
              onDataUpdated={loadUsers}
            />
          </div>
        </TabsContent>

        {/* Learning Progress Tab */}
        <TabsContent value="lernfortschritt">
          <TeamMemberLearningTab
            learningProgress={teamMemberDetails.learningProgress}
            quizAttempts={teamMemberDetails.quizAttempts}
            loadingProgress={teamMemberDetails.loadingProgress}
            videos={videos}
            quizzes={quizzes}
          />
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <TeamMemberLogsTab
            userId={user.id}
            userName={`${user.first_name} ${user.last_name}`}
          />
        </TabsContent>

        {/* Performance Reviews / Gespräche Tab */}
        <TabsContent value="gespraeche">
          <TeamMemberPerformanceReviewsTab
            userId={user.id}
            userName={`${user.first_name} ${user.last_name}`}
          />
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Rolle & Berechtigungen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PermissionsEditor
                userId={user.id}
                currentRole={user.role as UserRole}
                onRoleChange={handleRoleChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab - v4.4.1 - COMPLETE with all features! */}
        <TabsContent value="documents" className="space-y-6">
          <DocumentsTabContent 
            userId={user.id}
            userName={`${user.first_name} ${user.last_name}`}
            canUpload={true} // Admin/HR can upload documents
          />
        </TabsContent>
      </Tabs>

      {/* v4.7.3: Image Crop Dialog */}
      <ImageCropDialog
        open={showImageCropDialog}
        onOpenChange={setShowImageCropDialog}
        imageSrc={tempImageForCrop}
        onCropComplete={handleCroppedImage}
      />

      {/* v4.8.0: Warning Dialog */}
      <EditWarningDialog
        open={showWarningDialog}
        onOpenChange={setShowWarningDialog}
        currentCardName={cardEditing.currentCardName}
      />
      </div> {/* ✅ Close max-width container */}
    </div>
  );
}