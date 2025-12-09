import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Edit, Loader2 } from './icons/BrowoKoIcons';
import { toast } from 'sonner@2.0.3';
import sanitize from '../utils/security/BrowoKo_sanitization';
import { fetchYouTubeMetadata, extractYouTubeId } from '../utils/youtubeHelper';

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  category: string;
  duration_seconds: number;
}

interface EditVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: Video | null;
  onUpdateVideo: (videoId: string, updates: Partial<Omit<Video, 'id'>>) => Promise<void>;
}

export default function EditVideoDialog({ open, onOpenChange, video, onUpdateVideo }: EditVideoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    category: 'SKILLS',
    duration_minutes: 10,
  });

  // Update form when video changes
  useEffect(() => {
    if (video) {
      setFormData({
        title: video.title,
        description: video.description || '',
        video_url: video.video_url,
        category: video.category,
        duration_minutes: Math.round((video.duration_seconds || 0) / 60),
      });
    }
  }, [video]);

  // Auto-fetch YouTube metadata when URL changes
  const handleUrlChange = async (url: string) => {
    setFormData({ ...formData, video_url: url });

    // Only fetch if URL looks like a YouTube URL
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return; // Not a valid YouTube URL yet
    }

    setFetchingMetadata(true);
    try {
      const metadata = await fetchYouTubeMetadata(url);
      
      // Auto-fill duration (keep existing title/description for edits)
      setFormData(prev => ({
        ...prev,
        duration_minutes: Math.ceil(metadata.duration / 60), // Convert seconds to minutes (rounded up)
      }));

      toast.success('Video-Länge aktualisiert', {
        description: `Dauer: ${Math.floor(metadata.duration / 60)}:${String(metadata.duration % 60).padStart(2, '0')} Minuten`,
      });
    } catch (error: any) {
      console.error('Error fetching YouTube metadata:', error);
      
      // Show helpful error message
      if (error.message?.includes('API key')) {
        toast.error('YouTube API nicht konfiguriert', {
          description: 'Bitte Administrator kontaktieren - YouTube API Key fehlt',
        });
      } else {
        toast.warning('Metadaten konnten nicht geladen werden', {
          description: 'Bitte Dauer manuell eingeben',
        });
      }
    } finally {
      setFetchingMetadata(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!video) return;

    // ✅ SANITIZE TEXT FIELDS
    const sanitizedTitle = sanitize.text(formData.title);
    const sanitizedDescription = sanitize.multiline(formData.description);
    const sanitizedUrl = sanitize.url(formData.video_url);
    
    // Validate required fields
    if (!sanitizedTitle) {
      toast.error('Titel erforderlich');
      return;
    }
    
    if (!sanitizedUrl) {
      toast.error('Ungültige Video URL');
      return;
    }

    if (formData.duration_minutes <= 0) {
      toast.error('Dauer muss größer als 0 sein');
      return;
    }

    setLoading(true);
    try {
      // Convert minutes to seconds for database
      await onUpdateVideo(video.id, {
        title: sanitizedTitle,
        description: sanitizedDescription,
        video_url: sanitizedUrl,
        category: formData.category,
        duration_seconds: formData.duration_minutes * 60,
      });
      
      toast.success('Video aktualisiert', {
        description: `${formData.title} wurde erfolgreich bearbeitet`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating video:', error);
      toast.error('Fehler beim Aktualisieren des Videos');
    } finally {
      setLoading(false);
    }
  };

  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="form-card max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Video bearbeiten
          </DialogTitle>
          <DialogDescription>
            Bearbeite die Video-Details. Alle Änderungen werden sofort gespeichert.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="form-grid">
          {/* Title */}
          <div className="form-field">
            <Label htmlFor="title" className="form-label">Titel *</Label>
            <Input
              id="title"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="z.B. Einführung in GDPR"
              required
            />
          </div>

          {/* Description */}
          <div className="form-field">
            <Label htmlFor="description" className="form-label">Beschreibung</Label>
            <Textarea
              id="description"
              className="form-input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Was lernt man in diesem Video?"
              rows={3}
            />
          </div>

          {/* YouTube URL */}
          <div className="form-field">
            <Label htmlFor="video_url" className="form-label">YouTube URL *</Label>
            <div className="relative">
              <Input
                id="video_url"
                className="form-input"
                value={formData.video_url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                disabled={fetchingMetadata}
              />
              {fetchingMetadata && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {fetchingMetadata 
                ? '⏳ Lade Video-Informationen...' 
                : '✨ Video-Länge wird automatisch aktualisiert'}
            </p>
          </div>

          {/* Category and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <Label htmlFor="category" className="form-label">Kategorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="edit-video-mandatory" value="MANDATORY">Pflicht</SelectItem>
                  <SelectItem key="edit-video-compliance" value="COMPLIANCE">Compliance</SelectItem>
                  <SelectItem key="edit-video-skills" value="SKILLS">Skills</SelectItem>
                  <SelectItem key="edit-video-onboarding" value="ONBOARDING">Onboarding</SelectItem>
                  <SelectItem key="edit-video-bonus" value="BONUS">Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="form-field">
              <Label htmlFor="duration_minutes" className="form-label">Dauer (Minuten) *</Label>
              <Input
                id="duration_minutes"
                className="form-input"
                type="number"
                min="1"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                required
                disabled={fetchingMetadata}
              />
              <p className="text-xs text-gray-500">
                {fetchingMetadata ? 'Wird automatisch geladen...' : 'Automatisch erkannt (kann angepasst werden)'}
              </p>
            </div>
          </div>

          <div className="form-footer">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}