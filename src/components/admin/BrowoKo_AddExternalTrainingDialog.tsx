/**
 * @file BrowoKo_AddExternalTrainingDialog.tsx
 * @domain ADMIN - Training Compliance Dashboard
 * @description Dialog to add/edit external trainings
 * @version v4.13.3
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { supabase } from '../../utils/supabase/client';
import { Upload } from '../icons/BrowoKoIcons';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: {
    id: string;
    user_id: string;
    training_name: string;
    category: string | null;
    provider: string | null;
    completed_at: string;
    expires_at: string | null;
    certificate_url: string | null;
    notes: string | null;
  } | null;
}

export function BrowoKo_AddExternalTrainingDialog({ open, onOpenChange, onSuccess, editData }: Props) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Form state
  const [userId, setUserId] = useState('');
  const [trainingName, setTrainingName] = useState('');
  const [category, setCategory] = useState('');
  const [provider, setProvider] = useState('');
  const [completedAt, setCompletedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');

  // Load users on mount
  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  // Populate form when editing
  useEffect(() => {
    if (editData) {
      setUserId(editData.user_id);
      setTrainingName(editData.training_name);
      setCategory(editData.category || '');
      setProvider(editData.provider || '');
      setCompletedAt(editData.completed_at);
      setExpiresAt(editData.expires_at || '');
      setNotes(editData.notes || '');
    } else {
      // Reset form
      setUserId('');
      setTrainingName('');
      setCategory('');
      setProvider('');
      setCompletedAt('');
      setExpiresAt('');
      setCertificateFile(null);
      setNotes('');
    }
  }, [editData, open]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Fehler beim Laden der Mitarbeiter');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!userId || !trainingName || !completedAt) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    setLoading(true);

    try {
      let certificateUrl = editData?.certificate_url || null;

      // Upload certificate if provided
      if (certificateFile) {
        const fileExt = certificateFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('training-certificates')
          .upload(fileName, certificateFile);

        if (uploadError) {
          console.error('Certificate upload error:', uploadError);
          toast.error('Fehler beim Hochladen des Zertifikats');
          setLoading(false);
          return;
        }

        // Get signed URL (private bucket!)
        const { data: urlData } = await supabase.storage
          .from('training-certificates')
          .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry

        certificateUrl = urlData?.signedUrl || null;
      }

      // Prepare data
      const trainingData = {
        user_id: userId,
        training_name: trainingName,
        category: category || null,
        provider: provider || null,
        completed_at: completedAt,
        expires_at: expiresAt || null,
        certificate_url: certificateUrl,
        notes: notes || null,
      };

      if (editData) {
        // Update
        const { error } = await supabase
          .from('external_trainings')
          .update(trainingData)
          .eq('id', editData.id);

        if (error) throw error;
        toast.success('Schulung aktualisiert');
      } else {
        // Create
        const { error } = await supabase
          .from('external_trainings')
          .insert(trainingData);

        if (error) throw error;
        toast.success('Schulung hinzugefügt');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving external training:', error);
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editData ? 'Schulung bearbeiten' : 'Externe Schulung hinzufügen'}
          </DialogTitle>
          <p className="text-sm text-gray-500">
            {editData 
              ? 'Bearbeiten Sie die externe Schulung für den Mitarbeiter.'
              : 'Fügen Sie eine externe Schulung hinzu (z.B. Erste Hilfe, Gabelstapler, Brandschutz).'}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user">
              Mitarbeiter <span className="text-red-500">*</span>
            </Label>
            <Select value={userId} onValueChange={setUserId} disabled={!!editData}>
              <SelectTrigger id="user">
                <SelectValue placeholder="Mitarbeiter wählen..." />
              </SelectTrigger>
              <SelectContent>
                {loadingUsers ? (
                  <SelectItem value="loading" disabled>Lade Mitarbeiter...</SelectItem>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Training Name */}
          <div className="space-y-2">
            <Label htmlFor="training_name">
              Schulungsname <span className="text-red-500">*</span>
            </Label>
            <Input
              id="training_name"
              placeholder="z.B. Erste Hilfe Kurs"
              value={trainingName}
              onChange={(e) => setTrainingName(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            <Input
              id="category"
              placeholder="z.B. Erste Hilfe, Gabelstapler, Brandschutz"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <p className="text-xs text-gray-500">Frei wählbar</p>
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider">Anbieter</Label>
            <Input
              id="provider"
              placeholder="z.B. DRK, TÜV, Feuerwehr"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Completed At */}
            <div className="space-y-2">
              <Label htmlFor="completed_at">
                Abgeschlossen am <span className="text-red-500">*</span>
              </Label>
              <Input
                id="completed_at"
                type="date"
                value={completedAt}
                onChange={(e) => setCompletedAt(e.target.value)}
              />
            </div>

            {/* Expires At */}
            <div className="space-y-2">
              <Label htmlFor="expires_at">Gültig bis</Label>
              <Input
                id="expires_at"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              <p className="text-xs text-gray-500">Für wiederkehrende Schulungen</p>
            </div>
          </div>

          {/* Certificate Upload */}
          <div className="space-y-2">
            <Label htmlFor="certificate">Zertifikat</Label>
            <div className="flex items-center gap-2">
              <Input
                id="certificate"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
              />
              <Button variant="outline" size="sm" disabled>
                <Upload className="w-4 h-4" />
              </Button>
            </div>
            {editData?.certificate_url && !certificateFile && (
              <p className="text-xs text-gray-500">
                Aktuelles Zertifikat vorhanden. Neue Datei hochladen zum Ersetzen.
              </p>
            )}
            <p className="text-xs text-gray-500">PDF, JPG oder PNG</p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              placeholder="Zusätzliche Informationen..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Speichern...' : editData ? 'Aktualisieren' : 'Hinzufügen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
