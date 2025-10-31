/**
 * =====================================================
 * Dashboard Announcements Admin Screen
 * =====================================================
 * 
 * Manage dashboard announcements with rich content
 * - Create, edit, delete announcements
 * - Push to live / Remove from live
 * - View announcement history
 */

import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { Plus, Edit, Trash2, Eye, EyeOff, Megaphone, Loader2, Send, Edit3 } from '../../components/icons/BrowoKoIcons';
import { toast } from 'sonner@2.0.3';
import { getServices } from '../../services';
import { useAuthStore } from '../../stores/BrowoKo_authStore';
import type { Announcement, AnnouncementContent } from '../../services/BrowoKo_announcementService';
import AnnouncementContentEditor from '../../components/AnnouncementContentEditor';
import BrowoKo_DashboardAnnouncementCard from '../../components/BrowoKo_DashboardAnnouncementCard';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

export default function DashboardAnnouncementsScreen() {
  const { profile } = useAuthStore();

  // State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [videos, setVideos] = useState<Array<{ id: string; title: string }>>([]);
  const [benefits, setBenefits] = useState<Array<{ id: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<AnnouncementContent>({ blocks: [] });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('[DashboardAnnouncements] 🚀 Loading data...');
      
      // Get services instance - uses singleton client
      const services = getServices();
      console.log('[DashboardAnnouncements] ✅ Services loaded');
      
      // Load announcements
      const announcementsData = await services.announcement.getAll();
      console.log('[DashboardAnnouncements] ✅ Announcements loaded:', announcementsData.length);
      setAnnouncements(announcementsData);

      // Load videos for content editor
      try {
        const videosData = await services.learning.getAllVideos();
        console.log('[DashboardAnnouncements] ✅ Videos loaded:', videosData.length);
        setVideos(videosData.map((v: any) => ({ id: v.id, title: v.title })));
      } catch (err) {
        console.error('[DashboardAnnouncements] ⚠️ Error loading videos:', err);
      }

      // Load benefits for content editor (optional - table may not exist)
      try {
        const clientModule = await import('../../utils/supabase/client');
        const client = clientModule.supabase;
        
        if (!client || typeof client.from !== 'function') {
          console.warn('[DashboardAnnouncements] ⚠️ Invalid client for benefits - skipping');
          return;
        }
        
        const { data: benefitsData, error } = await client
          .from('benefits')
          .select('id, title')
          .order('title');
        
        if (error) {
          // Benefits table might not exist - that's OK, just skip it
          if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
            console.log('[DashboardAnnouncements] ℹ️ Benefits table not found - skipping (optional feature)');
          } else {
            console.warn('[DashboardAnnouncements] ⚠️ Error loading benefits:', error);
          }
        } else {
          console.log('[DashboardAnnouncements] ✅ Benefits loaded:', benefitsData?.length || 0);
          setBenefits(benefitsData || []);
        }
      } catch (err) {
        console.warn('[DashboardAnnouncements] ⚠️ Error loading benefits (non-critical):', err);
      }
      
      console.log('[DashboardAnnouncements] 🎉 All data loaded successfully!');
    } catch (error) {
      console.error('[DashboardAnnouncements] ❌ Error loading announcements:', error);
      toast.error('Fehler beim Laden der Mitteilungen');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setTitle('');
    setContent({ blocks: [] });
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setIsEditDialogOpen(true);
  };

  const handleCreate = async (pushLive: boolean = false) => {
    if (!title.trim()) {
      toast.error('Bitte gib einen Titel ein');
      return;
    }

    if (content.blocks.length === 0) {
      toast.error('Bitte füge mindestens einen Inhalt hinzu');
      return;
    }

    setSaving(true);
    try {
      const services = getServices();
      await services.announcement.create(
        {
          title,
          content,
          push_live: pushLive,
        },
        profile!.id,
        profile!.organization_id
      );

      toast.success(
        pushLive ? 'Mitteilung wurde live geschaltet!' : 'Mitteilung wurde erstellt',
        {
          description: pushLive
            ? 'Alle Mitarbeiter sehen die Mitteilung jetzt auf dem Dashboard'
            : 'Die Mitteilung kann später live geschaltet werden',
        }
      );

      setIsCreateDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Fehler beim Erstellen der Mitteilung');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedAnnouncement) return;

    if (!title.trim()) {
      toast.error('Bitte gib einen Titel ein');
      return;
    }

    setSaving(true);
    try {
      const services = getServices();
      await services.announcement.update(
        selectedAnnouncement.id,
        { title, content },
        profile!.id
      );

      toast.success('Mitteilung wurde aktualisiert');
      setIsEditDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error('Fehler beim Aktualisieren der Mitteilung');
    } finally {
      setSaving(false);
    }
  };

  const handlePushToLive = async (id: string) => {
    try {
      const services = getServices();
      await services.announcement.pushToLive(id, profile!.id);
      
      toast.success('Mitteilung ist jetzt live!', {
        description: 'Alle Mitarbeiter sehen die Mitteilung auf dem Dashboard',
      });
      loadData();
    } catch (error) {
      console.error('Error pushing to live:', error);
      toast.error('Fehler beim Live-Schalten');
    }
  };

  const handleRemoveFromLive = async (id: string) => {
    try {
      const services = getServices();
      await services.announcement.removeFromLive(id, profile!.id);
      
      toast.success('Mitteilung wurde entfernt', {
        description: 'Die Mitteilung ist nicht mehr auf dem Dashboard sichtbar',
      });
      loadData();
    } catch (error) {
      console.error('Error removing from live:', error);
      toast.error('Fehler beim Entfernen');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const services = getServices();
      await services.announcement.delete(id);
      
      toast.success('Mitteilung wurde gelöscht');
      setDeleteConfirm(null);
      loadData();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Megaphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dashboard-Mitteilungen</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Verwalte Mitteilungen, die auf dem Dashboard aller Mitarbeiter angezeigt werden
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Neue Mitteilung
        </Button>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Nur EINE Mitteilung</strong> kann gleichzeitig live sein. Wenn du eine neue Mitteilung live
              schaltest, wird die aktuelle automatisch ersetzt.
            </p>
          </div>
        </div>
      </Card>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card className="p-12 text-center">
            <Megaphone className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Noch keine Mitteilungen
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Erstelle deine erste Dashboard-Mitteilung
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Mitteilung erstellen
            </Button>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{announcement.title}</h3>
                    {announcement.is_live && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Live
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      Erstellt von {announcement.created_by_name}
                    </span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(announcement.created_at), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </span>
                    {announcement.pushed_live_at && (
                      <>
                        <span>•</span>
                        <span>
                          Live seit{' '}
                          {formatDistanceToNow(new Date(announcement.pushed_live_at), {
                            addSuffix: true,
                            locale: de,
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {announcement.is_live ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFromLive(announcement.id)}
                    >
                      <EyeOff className="w-4 h-4 mr-2" />
                      Remove from Live
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handlePushToLive(announcement.id)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Push to Live
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(announcement)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm(announcement.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Content Preview */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {announcement.content.blocks.length} Inhaltsblöcke
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neue Mitteilung erstellen</DialogTitle>
            <DialogDescription>
              Erstelle eine neue Dashboard-Mitteilung mit Rich Content
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit" className="gap-2">
                <Edit3 className="w-4 h-4" />
                Bearbeiten
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="w-4 h-4" />
                Vorschau
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Titel *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Wichtige Ankündigung: Neues Büro"
                />
              </div>

              <AnnouncementContentEditor
                content={content}
                onChange={setContent}
                availableVideos={videos}
                availableBenefits={benefits}
              />
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                    So wird die Mitteilung auf dem Dashboard angezeigt:
                  </p>
                  {title || content.blocks.length > 0 ? (
                    <BrowoKo_DashboardAnnouncementCard
                      announcement={{
                        id: 'preview',
                        organization_id: '',
                        title: title || 'Titel der Mitteilung',
                        content: content,
                        is_live: false,
                        pushed_live_at: null,
                        removed_from_live_at: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        created_by: profile?.id || '',
                        updated_by: profile?.id || '',
                        live_history: [],
                        created_by_profile: {
                          email: profile?.email || '',
                          last_name: profile?.last_name || '',
                          first_name: profile?.first_name || '',
                        },
                        created_by_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unbekannt',
                        created_by_email: profile?.email || '',
                      }}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <Megaphone className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Füge einen Titel und Inhalt hinzu, um die Vorschau zu sehen
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={saving}
            >
              Abbrechen
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCreate(false)}
              disabled={saving}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Erstellen
            </Button>
            <Button onClick={() => handleCreate(true)} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Send className="w-4 h-4 mr-2" />
              Push to Live
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mitteilung bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeite die Mitteilung. Änderungen werden sofort gespeichert.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit" className="gap-2">
                <Edit3 className="w-4 h-4" />
                Bearbeiten
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="w-4 h-4" />
                Vorschau
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Titel *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Wichtige Ankündigung: Neues Büro"
                />
              </div>

              <AnnouncementContentEditor
                content={content}
                onChange={setContent}
                availableVideos={videos}
                availableBenefits={benefits}
              />
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                    So wird die Mitteilung auf dem Dashboard angezeigt:
                  </p>
                  {title || content.blocks.length > 0 ? (
                    <BrowoKo_DashboardAnnouncementCard
                      announcement={{
                        id: 'preview',
                        organization_id: '',
                        title: title || 'Titel der Mitteilung',
                        content: content,
                        is_live: false,
                        pushed_live_at: null,
                        removed_from_live_at: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        created_by: profile?.id || '',
                        updated_by: profile?.id || '',
                        live_history: [],
                        created_by_profile: {
                          email: profile?.email || '',
                          last_name: profile?.last_name || '',
                          first_name: profile?.first_name || '',
                        },
                        created_by_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unbekannt',
                        created_by_email: profile?.email || '',
                      }}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <Megaphone className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Füge einen Titel und Inhalt hinzu, um die Vorschau zu sehen
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={saving}
            >
              Abbrechen
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mitteilung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Die Mitteilung wird dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
