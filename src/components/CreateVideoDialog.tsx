import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Video, Loader2 } from './icons/BrowoKoIcons';
import { toast } from 'sonner@2.0.3';
import sanitize from '../utils/security/BrowoKo_sanitization';
import { fetchYouTubeMetadata } from '../utils/youtubeHelper';

interface CreateVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateVideo: (video: {
    title: string;
    description: string;
    video_url: string;
    category: string;
    duration_seconds: number;
  }) => Promise<void>;
}

export default function CreateVideoDialog({ open, onOpenChange, onCreateVideo }: CreateVideoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    category: 'SKILLS',
    duration_minutes: 10,
  });

  // Extract YouTube Video ID from URL
  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

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
      
      // Auto-fill form with metadata
      setFormData(prev => ({
        ...prev,
        title: metadata.title,
        description: metadata.description.substring(0, 500), // Limit description length
        duration_minutes: Math.ceil(metadata.duration / 60), // Convert seconds to minutes (rounded up)
      }));

      toast.success('Video-Informationen geladen', {
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
          description: 'Bitte Titel und Dauer manuell eingeben',
        });
      }
    } finally {
      setFetchingMetadata(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ SANITIZE & VALIDATE URL
    const sanitizedUrl = sanitize.url(formData.video_url);
    
    if (!sanitizedUrl) {
      toast.error('Ungültige URL', {
        description: 'Bitte gib eine gültige YouTube URL ein',
      });
      return;
    }
    
    // Validate YouTube URL
    const videoId = extractYouTubeId(sanitizedUrl);
    if (!videoId) {
      toast.error('Ungültige YouTube URL', {
        description: 'Bitte gib eine gültige YouTube URL ein (z.B. https://www.youtube.com/watch?v=...)',
      });
      return;
    }

    // ✅ SANITIZE TEXT FIELDS
    const sanitizedTitle = sanitize.text(formData.title);
    const sanitizedDescription = sanitize.multiline(formData.description);
    
    // Validate required fields
    if (!sanitizedTitle) {
      toast.error('Titel erforderlich');
      return;
    }

    if (formData.duration_minutes <= 0) {
      toast.error('Dauer muss größer als 0 sein');
      return;
    }

    setLoading(true);
    try {
      // Convert minutes to seconds for database
      await onCreateVideo({
        title: sanitizedTitle,
        description: sanitizedDescription,
        video_url: sanitizedUrl,
        category: formData.category,
        duration_seconds: formData.duration_minutes * 60,
      });
      
      toast.success('Video erfolgreich erstellt', {
        description: `${formData.title} wurde hinzugefügt`,
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        video_url: '',
        category: 'SKILLS',
        duration_minutes: 10,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating video:', error);
      toast.error('Fehler beim Erstellen des Videos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Neues Schulungsvideo erstellen
          </DialogTitle>
          <DialogDescription>
            Füge ein neues YouTube-Video zum Lernzentrum hinzu. Gib eine gültige YouTube-URL ein.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="z.B. Einführung in GDPR"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Was lernt man in diesem Video?"
              rows={3}
            />
          </div>

          {/* YouTube URL */}
          <div className="space-y-2">
            <Label htmlFor="video_url">YouTube URL *</Label>
            <div className="relative">
              <Input
                id="video_url"
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
                : '✨ Video-Länge wird automatisch erkannt'}
            </p>
          </div>

          {/* Category and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="create-video-mandatory" value="MANDATORY">Pflicht</SelectItem>
                  <SelectItem key="create-video-compliance" value="COMPLIANCE">Compliance</SelectItem>
                  <SelectItem key="create-video-skills" value="SKILLS">Skills</SelectItem>
                  <SelectItem key="create-video-onboarding" value="ONBOARDING">Onboarding</SelectItem>
                  <SelectItem key="create-video-bonus" value="BONUS">Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Dauer (Minuten) *</Label>
              <Input
                id="duration_minutes"
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
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Video erstellen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
