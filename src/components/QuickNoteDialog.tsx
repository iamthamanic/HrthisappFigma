import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { FileText, Loader2 } from './icons/BrowoKoIcons';
import { User } from '../types/database';
import sanitize from '../utils/security/BrowoKo_sanitization';

interface QuickNoteDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, noteText: string, isPrivate: boolean) => Promise<void>;
}

export default function QuickNoteDialog({
  user,
  isOpen,
  onClose,
  onSave,
}: QuickNoteDialogProps) {
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  const handleSave = async () => {
    if (!user || !noteText.trim()) return;

    // ✅ SANITIZE NOTE TEXT
    const sanitizedNote = sanitize.multiline(noteText);
    
    if (!sanitizedNote) {
      return;
    }

    setSaving(true);
    try {
      await onSave(user.id, sanitizedNote, isPrivate);
      handleClose();
    } catch (error) {
      console.error('Save note error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setNoteText('');
    setIsPrivate(true);
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="form-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Notiz hinzufügen
          </DialogTitle>
          <DialogDescription>
            Notiz für {user.first_name} {user.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="form-grid">
          {/* Note Text */}
          <div className="form-field">
            <Label htmlFor="note" className="form-label">Notiz *</Label>
            <Textarea
              id="note"
              className="form-input resize-none"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Schreibe eine Notiz über diesen Mitarbeiter..."
              rows={6}
              disabled={saving}
            />
            <p className="text-xs text-gray-500">
              {noteText.length} Zeichen
            </p>
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="is_private" className="cursor-pointer">
                Private Notiz
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Nur für Admins sichtbar
              </p>
            </div>
            <Switch
              id="is_private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              disabled={saving}
            />
          </div>

          {/* Info */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-900">
              <strong>Hinweis:</strong> Diese Notiz wird im Profil des Mitarbeiters gespeichert und ist für alle Admins einsehbar.
            </p>
          </div>
        </div>

        <div className="form-footer">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving || !noteText.trim()}
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Notiz speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}