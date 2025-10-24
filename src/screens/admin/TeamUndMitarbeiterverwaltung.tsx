import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { AlertTriangle, Users, Plus, Download } from '../../components/icons/HRTHISIcons';
import { useAdminStore } from '../../stores/HRTHIS_adminStore';
import { useAuthStore } from '../../stores/HRTHIS_authStore';
import { useTeamManagement } from '../../hooks/HRTHIS_useTeamManagement';
import { useEmployeeFiltering } from '../../hooks/HRTHIS_useEmployeeFiltering';
import LoadingState from '../../components/LoadingState';
import ExportDialog from '../../components/ExportDialog';
import QuickEditDialog from '../../components/QuickEditDialog';
import QuickUploadDocumentDialog from '../../components/QuickUploadDocumentDialog';
import QuickNoteDialog from '../../components/QuickNoteDialog';
import QuickAwardCoinsDialog from '../../components/QuickAwardCoinsDialog';
import BulkActionsBar from '../../components/BulkActionsBar';
import BulkEditDialog from '../../components/BulkEditDialog';
import BulkDocumentUploadDialog from '../../components/BulkDocumentUploadDialog';
import SavedSearchesDropdown from '../../components/SavedSearchesDropdown';
import EmployeesList from '../../components/admin/HRTHIS_EmployeesList';
import TeamsList from '../../components/admin/HRTHIS_TeamsList';
import TeamDialog from '../../components/admin/HRTHIS_TeamDialog';
import { exportToCSV, exportToExcel, formatUserDataForExport } from '../../utils/exportUtils';
import { toast } from 'sonner@2.0.3';
import type { BulkActionType } from '../../components/BulkActionsBar';
import type { QuickActionType } from '../../components/QuickActionsMenu';
import type { User, Team } from '../../types/database';

/**
 * TEAM UND MITARBEITERVERWALTUNG SCREEN
 * =======================================
 * Main orchestrator for team and employee management
 * 
 * REFACTORED: Phase 2 File Splitting
 * From: 1710 lines → ~280 lines (84% reduction)
 */

export default function TeamUndMitarbeiterverwaltung() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { 
    users, 
    loadUsers, 
    locations, 
    loadLocations, 
    departments, 
    loadDepartments,
    savedSearches,
    loadSavedSearches,
    createSavedSearch,
    deleteSavedSearch,
    loading,
    updateUser,
    createUserNote,
    uploadUserDocument,
    awardCoins
  } = useAdminStore();

  // Team Management Hook
  const teamManagement = useTeamManagement(profile?.organization_id || null);
  
  // Employee Filtering Hook
  const employeeFiltering = useEmployeeFiltering(
    users,
    locations,
    teamManagement.userTeamMemberships
  );

  // UI States
  const [activeTab, setActiveTab] = useState<'employees' | 'teams'>('employees');
  const [showMigrationAlert, setShowMigrationAlert] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  // Bulk Actions States
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [bulkEditType, setBulkEditType] = useState<'location' | 'department' | null>(null);
  
  // Quick Actions States
  const [quickEditUser, setQuickEditUser] = useState<User | null>(null);
  const [quickUploadUser, setQuickUploadUser] = useState<User | null>(null);
  const [quickNoteUser, setQuickNoteUser] = useState<User | null>(null);
  const [quickAwardUser, setQuickAwardUser] = useState<User | null>(null);
  
  // Bulk Document Upload State
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);
  
  // Team Dialog States
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamDialogData, setTeamDialogData] = useState<{
    name: string;
    description: string;
    leads: string[];
    members: string[];
    tags: Record<string, 'PRIMARY' | 'BACKUP' | 'BACKUP_BACKUP'>;
  }>({ name: '', description: '', leads: [], members: [], tags: {} });

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadUsers();
        await loadLocations().catch(err => console.warn('Failed to load locations:', err));
        await loadDepartments().catch(err => console.warn('Failed to load departments:', err));
        await loadSavedSearches();
        await teamManagement.loadTeams();
        await teamManagement.loadUserTeamMemberships();
      } catch (error: any) {
        // Check if departments table is missing
        if (error?.code === 'PGRST205' || error?.message?.includes('departments')) {
          setShowMigrationAlert(true);
        }
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - teamManagement functions are stable

  // Team Dialog Handlers
  const handleOpenTeamDialog = async (team?: Team) => {
    if (team) {
      // Editing existing team
      setEditingTeam(team);
      const { leads, regularMembers, tags } = await teamManagement.loadTeamMembers(team.id);
      setTeamDialogData({
        name: team.name,
        description: team.description || '',
        leads,
        members: regularMembers,
        tags,
      });
    } else {
      // Creating new team
      setEditingTeam(null);
      const { leads, tags } = teamManagement.getDefaultTeamLeads(users);
      setTeamDialogData({
        name: '',
        description: '',
        leads,
        members: [],
        tags,
      });
    }
    setTeamDialogOpen(true);
  };

  const handleSaveTeam = async (
    name: string,
    description: string,
    teamLeads: string[],
    members: string[],
    tags: Record<string, 'PRIMARY' | 'BACKUP' | 'BACKUP_BACKUP'>
  ) => {
    if (editingTeam) {
      await teamManagement.updateTeam(editingTeam.id, name, description, teamLeads, members, tags);
    } else {
      await teamManagement.createTeam(name, description, teamLeads, members, tags);
    }
    
    await teamManagement.loadTeams();
    await loadUsers(); // Reload users to show updated roles
    await teamManagement.loadUserTeamMemberships(); // Reload team memberships
  };

  // Export Handler
  const handleExport = (format: 'csv' | 'excel', columns: string[], filename: string) => {
    try {
      const formattedData = formatUserDataForExport(employeeFiltering.sortedUsers, locations);
      
      // Filter to only selected columns
      const filteredData = formattedData.map(row => {
        const filtered: any = {};
        columns.forEach(col => {
          filtered[col] = row[col as keyof typeof row];
        });
        return filtered;
      });

      // Create column headers
      const EXPORT_COLUMNS_MAP: any = {
        'employee_number': 'Personalnummer',
        'first_name': 'Vorname',
        'last_name': 'Nachname',
        'email': 'E-Mail (Arbeit)',
        'private_email': 'E-Mail (Privat)',
        'phone': 'Telefon',
        'position': 'Position',
        'department': 'Abteilung',
        'location': 'Standort',
        'employment_type': 'Beschäftigungsart',
        'weekly_hours': 'Wochenstunden',
        'vacation_days': 'Urlaubstage',
        'start_date': 'Eintrittsdatum',
        'role': 'Rolle',
        'is_active': 'Status',
        'street_address': 'Straße',
        'postal_code': 'PLZ',
        'city': 'Stadt',
        'shirt_size': 'T-Shirt Größe',
        'pants_size': 'Hosen Größe',
        'shoe_size': 'Schuh Größe',
        'jacket_size': 'Jacken Größe',
      };

      const columnHeaders = columns.map(key => ({
        key,
        label: EXPORT_COLUMNS_MAP[key] || key
      }));

      // Export based on format
      if (format === 'csv') {
        exportToCSV(filteredData, columnHeaders, filename);
        toast.success(`${employeeFiltering.sortedUsers.length} Mitarbeiter als CSV exportiert`);
      } else {
        exportToExcel(filteredData, columnHeaders, filename, 'Mitarbeiter');
        toast.success(`${employeeFiltering.sortedUsers.length} Mitarbeiter als Excel exportiert`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Fehler beim Exportieren der Daten');
    }
  };

  // Quick Actions Handlers
  const handleQuickAction = (action: QuickActionType, user: User) => {
    switch (action) {
      case 'upload-document':
        setQuickUploadUser(user);
        break;
      case 'quick-edit':
        setQuickEditUser(user);
        break;
      case 'add-note':
        setQuickNoteUser(user);
        break;
      case 'award-coins':
        setQuickAwardUser(user);
        break;
      case 'view-avatar':
        navigate(`/avatar?userId=${user.id}`);
        break;
      case 'view-details':
        navigate(`/admin/team-und-mitarbeiterverwaltung/user/${user.id}`);
        break;
      default:
        break;
    }
  };

  const handleQuickEdit = async (userId: string, updates: Partial<User>) => {
    try {
      await updateUser(userId, updates);
      toast.success('Mitarbeiter erfolgreich aktualisiert');
    } catch (error) {
      console.error('Quick edit error:', error);
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const handleUploadDocument = async (userId: string, file: File, category: any, title: string) => {
    try {
      await uploadUserDocument(userId, file, category, title);
      toast.success('Dokument erfolgreich hochgeladen');
    } catch (error) {
      console.error('Document upload error:', error);
      toast.error('Fehler beim Hochladen');
    }
  };

  const handleBulkUploadDocument = async (
    file: File,
    title: string,
    category: 'VERTRAG' | 'ZERTIFIKAT' | 'LOHN' | 'SONSTIGES',
    userIds: string[]
  ) => {
    try {
      // Upload document to each selected user
      let successCount = 0;
      let errorCount = 0;

      for (const userId of userIds) {
        try {
          await uploadUserDocument(userId, file, category, title);
          successCount++;
        } catch (error) {
          console.error(`Failed to upload document to user ${userId}:`, error);
          errorCount++;
        }
      }

      // Show result
      if (errorCount === 0) {
        toast.success(`📄 Dokument erfolgreich an ${successCount} Mitarbeiter gesendet!`);
      } else if (successCount > 0) {
        toast.warning(
          `⚠️ Dokument an ${successCount} Mitarbeiter gesendet, ${errorCount} fehlgeschlagen`
        );
      } else {
        toast.error('❌ Fehler beim Hochladen des Dokuments');
      }

      // Close dialog and clear selection
      setBulkUploadDialogOpen(false);
      setSelectedUsers([]);
      
      // Reload users to reflect changes
      await loadUsers();
    } catch (error) {
      console.error('Bulk document upload error:', error);
      toast.error('Fehler beim Hochladen des Dokuments');
    }
  };

  const handleSaveNote = async (userId: string, noteText: string, isPrivate: boolean) => {
    try {
      await createUserNote(userId, noteText, isPrivate);
      toast.success('Notiz erfolgreich gespeichert');
    } catch (error) {
      console.error('Save note error:', error);
      toast.error('Fehler beim Speichern der Notiz');
    }
  };

  const handleAwardCoins = async (userId: string, amount: number, reason: string) => {
    try {
      await awardCoins(userId, amount, reason);
      toast.success(`${amount} Coins erfolgreich vergeben!`);
    } catch (error) {
      console.error('Award coins error:', error);
      toast.error('Fehler beim Vergeben der Coins');
    }
  };

  // Saved Searches Handlers
  const handleApplySavedSearch = (config: any) => {
    employeeFiltering.applySearchConfig(config);
    toast.success('Gespeicherte Suche angewendet');
  };

  const handleSaveCurrentSearch = async (name: string, description: string, isGlobal: boolean) => {
    try {
      await createSavedSearch(name, description, employeeFiltering.getCurrentSearchConfig(), isGlobal);
      toast.success('Suche erfolgreich gespeichert');
    } catch (error) {
      console.error('Save search error:', error);
      toast.error('Fehler beim Speichern der Suche');
    }
  };

  const handleDeleteSavedSearch = async (searchId: string) => {
    try {
      await deleteSavedSearch(searchId);
      toast.success('Gespeicherte Suche gelöscht');
    } catch (error) {
      console.error('Delete saved search error:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  // Bulk Actions Handlers
  const handleToggleUserSelection = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedUsers(employeeFiltering.sortedUsers);
  };

  const handleClearSelection = () => {
    setSelectedUsers([]);
  };

  const handleBulkAction = async (action: BulkActionType) => {
    if (selectedUsers.length === 0) return;

    switch (action) {
      case 'activate':
        if (confirm(`${selectedUsers.length} Mitarbeiter aktivieren?`)) {
          try {
            for (const user of selectedUsers) {
              await updateUser(user.id, { is_active: true });
            }
            toast.success(`${selectedUsers.length} Mitarbeiter aktiviert`);
            setSelectedUsers([]);
            await loadUsers();
          } catch (error) {
            console.error('Bulk activate error:', error);
            toast.error('Fehler beim Aktivieren');
          }
        }
        break;

      case 'deactivate':
        if (confirm(`${selectedUsers.length} Mitarbeiter deaktivieren?`)) {
          try {
            for (const user of selectedUsers) {
              await updateUser(user.id, { is_active: false });
            }
            toast.success(`${selectedUsers.length} Mitarbeiter deaktiviert`);
            setSelectedUsers([]);
            await loadUsers();
          } catch (error) {
            console.error('Bulk deactivate error:', error);
            toast.error('Fehler beim Deaktivieren');
          }
        }
        break;

      case 'delete':
        toast.error('Löschen ist deaktiviert. Nutze stattdessen "Deaktivieren".');
        break;

      case 'send-email':
        const emails = selectedUsers.map(u => u.email).join(',');
        window.location.href = `mailto:${emails}`;
        break;

      case 'change-location':
        setBulkEditType('location');
        break;

      case 'change-department':
        setBulkEditType('department');
        break;

      case 'upload-document':
        // Open bulk document upload dialog
        setBulkUploadDialogOpen(true);
        break;

      default:
        break;
    }
  };

  const handleBulkEdit = async (updates: Partial<User>) => {
    try {
      for (const user of selectedUsers) {
        await updateUser(user.id, updates);
      }
      toast.success(`${selectedUsers.length} Mitarbeiter aktualisiert`);
      setSelectedUsers([]);
      setBulkEditType(null);
      await loadUsers();
    } catch (error) {
      console.error('Bulk edit error:', error);
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'SUPERADMIN';

  if (loading) {
    return <LoadingState loading={true} type="spinner" />;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6 pb-20 md:pb-6">
        {/* Migration Alert */}
        {showMigrationAlert && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Datenbank-Migration erforderlich!</strong>
              <br />
              Die Departments-Tabelle wurde noch nicht erstellt. Bitte öffne die Datei{' '}
              <code className="bg-black/10 px-2 py-1 rounded">SQL_DEPARTMENTS_MIGRATION.md</code> und führe die SQL-Migration in deiner Supabase-Datenbank aus.
              <br />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowMigrationAlert(false)}
                className="mt-2"
              >
                Verstanden
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Header - Responsive */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Team & Mitarbeiterverwaltung</h1>
            <p className="text-sm text-gray-500 mt-1">
              Verwalte Teams und Mitarbeiter
            </p>
          </div>
          {/* Desktop: Horizontal Buttons, Mobile: Grid */}
          <div className="flex flex-col sm:flex-row gap-2">
            {activeTab === 'employees' && (
              <>
                <SavedSearchesDropdown
                  savedSearches={savedSearches}
                  currentConfig={employeeFiltering.getCurrentSearchConfig()}
                  onApplySearch={handleApplySavedSearch}
                  onSaveSearch={handleSaveCurrentSearch}
                  onDeleteSearch={handleDeleteSavedSearch}
                  isAdmin={isAdmin}
                />
                <Button 
                  variant="outline" 
                  onClick={() => setShowExportDialog(true)}
                  className="gap-2 w-full sm:w-auto"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportieren</span>
                  <span className="sm:hidden">Export</span>
                </Button>
                <Button 
                  onClick={() => navigate('/admin/team-und-mitarbeiterverwaltung/add-employee')}
                  className="w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Mitarbeiter hinzufügen</span>
                  <span className="sm:hidden">Hinzufügen</span>
                </Button>
              </>
            )}
            {activeTab === 'teams' && (
              <Button 
                onClick={() => handleOpenTeamDialog()}
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Team erstellen
              </Button>
            )}
          </div>
        </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'employees' | 'teams')} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="employees">
            <Users className="w-4 h-4 mr-2" />
            Mitarbeiter
          </TabsTrigger>
          <TabsTrigger value="teams">
            <Users className="w-4 h-4 mr-2" />
            Teams
          </TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-6 mt-6">
          <EmployeesList
            users={users}
            sortedUsers={employeeFiltering.sortedUsers}
            locations={locations}
            departments={departments}
            savedSearches={savedSearches}
            userTeamMemberships={teamManagement.userTeamMemberships}
            searchQuery={employeeFiltering.searchQuery}
            setSearchQuery={employeeFiltering.setSearchQuery}
            statusFilter={employeeFiltering.statusFilter}
            setStatusFilter={employeeFiltering.setStatusFilter}
            roleFilter={employeeFiltering.roleFilter}
            setRoleFilter={employeeFiltering.setRoleFilter}
            teamRoleFilter={employeeFiltering.teamRoleFilter}
            setTeamRoleFilter={employeeFiltering.setTeamRoleFilter}
            departmentFilter={employeeFiltering.departmentFilter}
            setDepartmentFilter={employeeFiltering.setDepartmentFilter}
            locationFilter={employeeFiltering.locationFilter}
            setLocationFilter={employeeFiltering.setLocationFilter}
            sortConfig={employeeFiltering.sortConfig}
            setSortConfig={employeeFiltering.setSortConfig}
            selectedUsers={selectedUsers}
            onToggleUserSelection={handleToggleUserSelection}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onQuickAction={handleQuickAction}
            onAddEmployee={() => navigate('/admin/team-und-mitarbeiterverwaltung/add-employee')}
            onExport={() => setShowExportDialog(true)}
            onResetFilters={employeeFiltering.resetFilters}
            onApplySavedSearch={handleApplySavedSearch}
            onSaveCurrentSearch={handleSaveCurrentSearch}
            onDeleteSavedSearch={handleDeleteSavedSearch}
            isAdmin={isAdmin}
            hasActiveFilters={employeeFiltering.hasActiveFilters}
          />

          {/* Export Dialog */}
          <ExportDialog
            isOpen={showExportDialog}
            onClose={() => setShowExportDialog(false)}
            data={employeeFiltering.sortedUsers}
            locations={locations}
            departments={departments}
            onExport={handleExport}
          />

          {/* Quick Edit Dialog */}
          <QuickEditDialog
            user={quickEditUser}
            isOpen={!!quickEditUser}
            onClose={() => setQuickEditUser(null)}
            onSave={handleQuickEdit}
            departments={departments}
            locations={locations}
          />

          {/* Quick Upload Document Dialog */}
          <QuickUploadDocumentDialog
            user={quickUploadUser}
            isOpen={!!quickUploadUser}
            onClose={() => setQuickUploadUser(null)}
            onUpload={handleUploadDocument}
          />

          {/* Quick Note Dialog */}
          <QuickNoteDialog
            user={quickNoteUser}
            isOpen={!!quickNoteUser}
            onClose={() => setQuickNoteUser(null)}
            onSave={handleSaveNote}
          />

          {/* Quick Award Coins Dialog */}
          <QuickAwardCoinsDialog
            user={quickAwardUser}
            isOpen={!!quickAwardUser}
            onClose={() => setQuickAwardUser(null)}
            onAward={handleAwardCoins}
          />

          {/* Bulk Actions Bar */}
          <BulkActionsBar
            selectedUsers={selectedUsers}
            onClearSelection={handleClearSelection}
            onBulkAction={handleBulkAction}
          />

          {/* Bulk Edit Dialog */}
          <BulkEditDialog
            isOpen={!!bulkEditType}
            onClose={() => setBulkEditType(null)}
            editType={bulkEditType}
            selectedUsers={selectedUsers}
            locations={locations}
            departments={departments}
            onSave={handleBulkEdit}
          />

          {/* Bulk Document Upload Dialog */}
          <BulkDocumentUploadDialog
            open={bulkUploadDialogOpen}
            onOpenChange={setBulkUploadDialogOpen}
            selectedUsers={selectedUsers}
            onUpload={handleBulkUploadDocument}
            uploading={false}
          />
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-6 mt-6">
          <TeamsList
            teams={teamManagement.teams}
            teamMemberCounts={teamManagement.teamMemberCounts}
            loading={teamManagement.loadingTeams}
            onCreateTeam={() => handleOpenTeamDialog()}
            onEditTeam={(team) => handleOpenTeamDialog(team)}
            onDeleteTeam={teamManagement.deleteTeam}
          />
        </TabsContent>
      </Tabs>

        {/* Team Create/Edit Dialog */}
        <TeamDialog
          isOpen={teamDialogOpen}
          onClose={() => setTeamDialogOpen(false)}
          onSave={handleSaveTeam}
          editingTeam={editingTeam}
          users={users}
          initialData={teamDialogData}
        />
      </div>
    </div>
  );
}
