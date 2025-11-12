/**
 * TESTS LIST COMPONENT (v4.13.1)
 * ===============================
 * Displays list of tests with filtering and actions
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, Search } from './icons/BrowoKoIcons';
import { BrowoKo_TestCard } from './BrowoKo_TestCard';
import { BrowoKo_CreateTestDialog } from './BrowoKo_CreateTestDialog';
import { toast } from 'sonner@2.0.3';
import { LearningService } from '../services/BrowoKo_learningService';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import { supabase } from '../utils/supabase/client';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import type { Test } from '../types/schemas/BrowoKo_learningSchemas';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

export function BrowoKo_TestsList() {
  const { profile } = useAuthStore(); // ✅ Use profile instead of user!
  const learningService = useMemo(() => new LearningService(supabase), []); // ✅ Pass supabase client!
  const navigate = useNavigate(); // ✅ For navigation to Test Builder

  const [tests, setTests] = useState<Test[]>([]);
  const [filteredTests, setFilteredTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tests with timeout
  const loadTests = async () => {
    console.log('🔄 [loadTests] Starting...', { 
      hasProfile: !!profile, 
      orgId: profile?.organization_id 
    });
    
    if (!profile?.organization_id) {
      console.warn('⚠️ [loadTests] No organization_id - skipping');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Timeout after 10 seconds
    const timeoutId = setTimeout(() => {
      console.error('⏱️ [loadTests] TIMEOUT after 10 seconds');
      setLoading(false);
      setError('Zeitüberschreitung: Netzwerkverbindung unterbrochen. Bitte prüfe deine Internetverbindung.');
      toast.error('Netzwerkfehler: Verbindung zu Supabase fehlgeschlagen');
    }, 10000);
    
    try {
      console.log('📡 [loadTests] Calling learningService.getAllTests...');
      const data = await learningService.getAllTests({
        organization_id: profile.organization_id,
      });
      console.log('✅ [loadTests] Success! Got data:', data);
      
      clearTimeout(timeoutId);
      setTests(data);
      setFilteredTests(data);
      setError(null);
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('❌ [loadTests] Error:', error);
      
      // Network error detection
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        setError('Netzwerkfehler: Keine Verbindung zu Supabase. Bitte prüfe deine Internetverbindung.');
        toast.error('Netzwerkfehler: Bitte Internetverbindung prüfen');
      } else {
        setError(`Fehler beim Laden: ${error.message || 'Unbekannter Fehler'}`);
        toast.error('Fehler beim Laden der Tests');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.organization_id) {
      loadTests();
    }
  }, [profile?.organization_id]);

  // Filter tests
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTests(tests);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = tests.filter(
      (test) =>
        test.title.toLowerCase().includes(query) ||
        test.description?.toLowerCase().includes(query) ||
        test.template_category?.toLowerCase().includes(query)
    );
    setFilteredTests(filtered);
  }, [searchQuery, tests]);

  // Handle delete
  const handleDelete = async () => {
    if (!testToDelete) return;

    setDeleting(true);
    try {
      await learningService.deleteTest(testToDelete.id!);
      toast.success('Test erfolgreich gelöscht');
      
      // Remove from list
      setTests((prev) => prev.filter((t) => t.id !== testToDelete.id));
      setTestToDelete(null);
    } catch (error: any) {
      console.error('Error deleting test:', error);
      toast.error('Fehler beim Löschen des Tests');
    } finally {
      setDeleting(false);
    }
  };

  // Handle duplicate
  const handleDuplicate = async (test: Test) => {
    try {
      const duplicatedTest = await learningService.createTest({
        title: `${test.title} (Kopie)`,
        description: test.description,
        pass_percentage: test.pass_percentage,
        reward_coins: test.reward_coins,
        max_attempts: test.max_attempts,
        time_limit_minutes: test.time_limit_minutes,
        is_template: test.is_template,
        template_category: test.template_category,
        organization_id: user?.organization_id,
      });

      toast.success('Test erfolgreich dupliziert! 🎉');
      
      // Add to list
      setTests((prev) => [duplicatedTest, ...prev]);
    } catch (error: any) {
      console.error('Error duplicating test:', error);
      toast.error('Fehler beim Duplizieren des Tests');
    }
  };

  // Wait for profile and organization_id to load
  if (!profile || !profile.organization_id) {
    console.log('⏳ [BrowoKo_TestsList] Waiting for profile & organization_id...', { 
      hasProfile: !!profile, 
      hasOrgId: !!(profile?.organization_id) 
    });
    return <LoadingState loading={true} type="skeleton" skeletonType="card" />;
  }

  if (loading) {
    return <LoadingState loading={true} type="skeleton" skeletonType="card" />;
  }

  // Network Error State
  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">Verbindungsfehler</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="space-y-2 text-sm text-red-600 mb-4">
            <p>• Prüfe deine Internetverbindung</p>
            <p>• Stelle sicher, dass Supabase erreichbar ist</p>
            <p>• Versuche die Seite neu zu laden</p>
          </div>
          <Button onClick={loadTests} variant="outline" className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tests</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {tests.length} {tests.length === 1 ? 'Test' : 'Tests'} erstellt
          </p>
        </div>
        
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Test erstellen
        </Button>
      </div>

      {/* Search */}
      {tests.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Tests durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Empty State */}
      {tests.length === 0 && (
        <EmptyState
          icon={Plus}
          title="Noch keine Tests"
          description="Erstelle deinen ersten Test, um zu beginnen."
          actionLabel="Test erstellen"
          onAction={() => setIsCreateDialogOpen(true)}
        />
      )}

      {/* No Results */}
      {tests.length > 0 && filteredTests.length === 0 && (
        <EmptyState
          icon={Search}
          title="Keine Ergebnisse"
          description={`Keine Tests gefunden für "${searchQuery}"`}
        />
      )}

      {/* Tests Grid */}
      {filteredTests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTests.map((test) => (
            <BrowoKo_TestCard
              key={test.id}
              test={test}
              onEdit={(test) => {
                // ✅ Navigate to Test Builder for editing
                console.log('🔧 [TestsList] Navigating to Test Builder:', test.id);
                navigate(`/admin/lernen/test-builder/${test.id}`);
              }}
              onDelete={(test) => setTestToDelete(test)}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <BrowoKo_CreateTestDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onTestCreated={(newTest) => {
          setTests((prev) => [newTest, ...prev]);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!testToDelete} onOpenChange={(open) => !open && setTestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Test löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher, dass du den Test "{testToDelete?.title}" löschen möchtest?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Lösche...' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}