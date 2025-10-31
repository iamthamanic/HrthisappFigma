import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { Trash2, Loader2, AlertTriangle } from './icons/BrowoKoIcons';
import { toast } from 'sonner@2.0.3';

interface Video {
  id: string;
  title: string;
}

interface DeleteVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: Video | null;
  onDeleteVideo: (videoId: string) => Promise<void>;
}

export default function DeleteVideoDialog({
  open,
  onOpenChange,
  video,
  onDeleteVideo,
}: DeleteVideoDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!video) return;

    setLoading(true);
    try {
      await onDeleteVideo(video.id);
      
      toast.success('Video gelöscht', {
        description: `${video.title} wurde erfolgreich entfernt`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Fehler beim Löschen des Videos');
    } finally {
      setLoading(false);
    }
  };

  if (!video) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Video wirklich löschen?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Möchtest du das Video <strong>"{video.title}"</strong> wirklich löschen?
            </p>
            <p className="text-red-600">
              ⚠️ Diese Aktion kann nicht rückgängig gemacht werden. Alle Fortschritte der Benutzer für dieses Video werden ebenfalls gelöscht.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Abbrechen
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird gelöscht...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Löschen
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
