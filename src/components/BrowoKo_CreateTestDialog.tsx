/**
 * CREATE TEST DIALOG COMPONENT (v4.13.2)
 * =======================================
 * STEP 1 OF 3-STEP WIZARD: Nur Titel, Beschreibung & Video-Verknüpfung
 * Step 2: Test Builder (Blocks hinzufügen)
 * Step 3: Settings Panel (Bestehensschwelle, XP, Versuche, Zeitlimit)
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { LearningService } from '../services/BrowoKo_learningService';
import { supabase } from '../utils/supabase/client';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import type { CreateTestData } from '../types/schemas/BrowoKo_learningSchemas';

interface BrowoKo_CreateTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTestCreated?: (test: any) => void;
}

export function BrowoKo_CreateTestDialog({
  open,
  onOpenChange,
  onTestCreated,
}: BrowoKo_CreateTestDialogProps) {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const learningService = useMemo(() => new LearningService(supabase), []);

  // ✅ SIMPLIFIED: Only basic info + optional video link
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Video list
  const [videos, setVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [assignedVideoIds, setAssignedVideoIds] = useState<Set<string>>(new Set());

  // Load videos and assignments on mount
  useEffect(() => {
    if (open) {
      loadVideos();
      // Reset selected video when dialog opens
      setSelectedVideoId(null);
    }
  }, [open]);

  const loadVideos = async () => {
    if (!profile?.organization_id) {
      console.warn('⚠️ No organization_id found, cannot load videos');
      return;
    }
    
    setLoadingVideos(true);
    try {
      console.log('🔍 [CreateTestDialog] Loading videos for org:', profile.organization_id);
      
      // Load all videos
      const videoList = await learningService.getVideos(profile.organization_id);
      console.log('✅ [CreateTestDialog] Videos loaded:', videoList.length);
      
      // Load video IDs that are assigned to EXISTING tests (with JOIN to verify test exists)
      const { data: assignments, error: assignError } = await supabase
        .from('test_video_assignments')
        .select('video_id, test_id, tests!inner(id)'); // INNER JOIN automatically filters out orphaned assignments
      
      console.log('🔍 [CreateTestDialog] Assignment query result:', { assignments, assignError });
      console.log('🔍 [CreateTestDialog] Assignments data:', JSON.stringify(assignments, null, 2));
      
      if (assignError) {
        console.warn('⚠️ Could not load video assignments:', assignError);
        // Clear assigned videos on error
        setAssignedVideoIds(new Set());
      } else {
        const assignedIds = new Set(assignments?.map(a => a.video_id) || []);
        setAssignedVideoIds(assignedIds);
        console.log('✅ [CreateTestDialog] Assigned video IDs (with existing tests):', assignedIds.size);
        console.log('✅ [CreateTestDialog] Assigned videos:', Array.from(assignedIds));
        
        // ⚠️ DEBUG: Show which tests these assignments belong to
        if (assignments && assignments.length > 0) {
          console.warn('⚠️ [CreateTestDialog] THESE ASSIGNMENTS STILL EXIST:');
          assignments.forEach(a => {
            console.warn(`   - Video: ${a.video_id}, Test: ${a.test_id}`, a);
          });
        }
      }
      
      setVideos(videoList);
    } catch (error) {
      console.error('❌ Error loading videos:', error);
      // Don't show error toast - video selection is optional
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Bitte gib einen Titel ein');
      return;
    }

    setLoading(true);

    try {
      // ✅ STEP 1: Create test with defaults - settings will be configured in Test Builder
      const testData: CreateTestData = {
        title: title.trim(),
        description: description.trim() || undefined,
        pass_percentage: 80, // Default - can be changed in Test Builder
        reward_coins: 0, // Default - can be changed in Test Builder (XP not Coins!)
        max_attempts: 3, // Default - can be changed in Test Builder
        time_limit_minutes: undefined, // Default - can be changed in Test Builder
        is_template: false,
        organization_id: profile?.organization_id,
      };

      const newTest = await learningService.createTest(testData);
      
      // ✅ STEP 2: Link video if selected
      if (selectedVideoId) {
        try {
          await learningService.linkTestToVideo(newTest.id, selectedVideoId);
          console.log('✅ Video successfully linked to test');
        } catch (error: any) {
          console.error('❌ Error linking video:', error);
          
          // Show user-friendly error message
          if (error.code === 'ALREADY_ASSIGNED') {
            toast.error('Das ausgewählte Video ist bereits einem anderen Test zugewiesen');
          } else {
            toast.error('Video konnte nicht verknüpft werden: ' + (error.message || 'Unbekannter Fehler'));
          }
          
          // Continue anyway - test was created successfully
        }
      }
      
      toast.success('Test erstellt! Jetzt Blocks hinzufügen 🎯');
      
      // Reset form
      setTitle('');
      setDescription('');
      setSelectedVideoId(null);
      
      // Close dialog
      onOpenChange(false);
      
      // ✅ Navigate to Test Builder (STEP 2 of Wizard)
      navigate(`/admin/lernen/test-builder/${newTest.id}`);
      
      // Callback
      if (onTestCreated) {
        onTestCreated(newTest);
      }
    } catch (error: any) {
      console.error('Error creating test:', error);
      toast.error(error.message || 'Fehler beim Erstellen des Tests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Test erstellen</DialogTitle>
          <DialogDescription>
            Schritt 1 von 3: Grundlegende Informationen eingeben
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Titel <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Onboarding Test"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibe den Inhalt des Tests..."
              rows={3}
            />
          </div>

          {/* Video Selection (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="video">
              Video verknüpfen <span className="text-gray-400">(Optional)</span>
            </Label>
            <Select
              value={selectedVideoId || 'none'}
              onValueChange={(value) => {
                console.log('📹 Video selected:', value);
                setSelectedVideoId(value === 'none' ? null : value);
              }}
              onOpenChange={(open) => {
                console.log('🔽 [CreateTestDialog] Dropdown opened:', open);
                console.log('🔽 [CreateTestDialog] Videos available:', videos.length);
              }}
              disabled={loadingVideos}
            >
              <SelectTrigger id="video" className="w-full">
                <SelectValue placeholder={loadingVideos ? 'Lade Videos...' : 'Kein Video'} />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                <SelectItem value="none">Kein Video</SelectItem>
                {loadingVideos ? (
                  <SelectItem value="loading" disabled>
                    Lade Videos...
                  </SelectItem>
                ) : videos.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    Keine Videos verfügbar
                  </SelectItem>
                ) : (
                  <>
                    {console.log('🎬 [CreateTestDialog] Rendering videos:', videos)}
                    {videos.map((video) => {
                      const isAssigned = assignedVideoIds.has(video.id);
                      console.log('🎬 [CreateTestDialog] Video:', video.id, video.title, 'assigned:', isAssigned);
                      return (
                        <SelectItem 
                          key={video.id} 
                          value={video.id}
                          disabled={isAssigned}
                        >
                          📹 {video.title || 'Unbenanntes Video'}
                          {isAssigned && <span className="ml-2 text-xs text-gray-400">(bereits zugewiesen)</span>}
                        </SelectItem>
                      );
                    })}
                  </>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Ein verknüpftes Video kann vor dem Test angezeigt werden
              {videos.length > 0 && ` • ${videos.length} Video${videos.length === 1 ? '' : 's'} verfügbar`}
            </p>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Nächste Schritte:</span>
              <br />
              Nach dem Erstellen kannst du Fragen hinzufügen und Einstellungen wie Bestehensschwelle, XP-Belohnung und Zeitlimit konfigurieren.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Erstelle...' : 'Weiter →'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
