/**
 * AdminRequestLeaveDialog Component
 * 
 * Admin-Panel für Urlaubsanträge:
 * - Nur für ADMIN/HR/TEAMLEAD
 * - Kann Anträge für ANDERE Mitarbeiter erstellen
 * - Gleiche Validierung wie normale Requests
 * - Direkt als APPROVED erstellen (optional)
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Calendar, Upload, AlertCircle, Info, Umbrella, Heart, UserPlus } from './icons/BrowoKoIcons';
import { Alert, AlertDescription } from './ui/alert';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import { useAdminStore } from '../stores/BrowoKo_adminStore';
import { useLeaveManagement } from '../hooks/BrowoKo_useLeaveManagement';
import { useBusinessDays } from '../hooks/useBusinessDays';
import { FEDERAL_STATES } from '../hooks/useGermanHolidays';
import { LeaveType } from '../types/database';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';

interface AdminRequestLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AdminRequestLeaveDialog({
  open,
  onOpenChange,
  onSuccess,
}: AdminRequestLeaveDialogProps) {
  const { profile } = useAuthStore();
  const { users } = useAdminStore();

  // Form state
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [leaveType, setLeaveType] = useState<LeaveType>('VACATION');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [comment, setComment] = useState('');
  const [federalState, setFederalState] = useState<string>('');
  const [autoApprove, setAutoApprove] = useState(true); // Default: Auto-approve admin requests
  const [sickNoteFile, setSickNoteFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Get federal state from user location
  useEffect(() => {
    if (selectedUserId) {
      const user = users.find(u => u.id === selectedUserId);
      // TODO: Get federal state from location
      setFederalState('NW'); // Default to NRW for now
    }
  }, [selectedUserId, users]);

  const { quota, createLeaveRequest, loading: submitting } = useLeaveManagement(
    selectedUserId,
    federalState
  );

  const { businessDays, isWeekend, isHoliday } = useBusinessDays(
    startDate || null,
    endDate || null,
    { includeHolidays: true, federalState }
  );

  // Calculate actual days
  const calculatedDays = isHalfDay ? 0.5 : businessDays;

  // Check if dates include weekend or holiday
  const includesWeekend = startDate && endDate && (() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);
    while (current <= end) {
      if (isWeekend(current)) return true;
      current.setDate(current.getDate() + 1);
    }
    return false;
  })();

  const includesHoliday = startDate && endDate && (() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);
    while (current <= end) {
      if (isHoliday(current)) return true;
      current.setDate(current.getDate() + 1);
    }
    return false;
  })();

  // Validation
  // UNPAID_LEAVE does NOT affect vacation quota - only check quota for VACATION
  const isQuotaExceeded = leaveType === 'VACATION' && quota && calculatedDays > quota.availableDays;
  const canSubmit = selectedUserId && startDate && endDate && !isQuotaExceeded;

  // Reset form
  const resetForm = () => {
    setSelectedUserId('');
    setLeaveType('VACATION');
    setStartDate('');
    setEndDate('');
    setIsHalfDay(false);
    setComment('');
    setSickNoteFile(null);
    setAutoApprove(true);
  };

  // Upload sick note
  const uploadSickNote = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const fileName = `sick-notes/${selectedUserId}/${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        toast.error('Fehler beim Hochladen der Krankmeldung');
        return null;
      }

      return fileName;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Fehler beim Hochladen der Krankmeldung');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      // Upload sick note if provided
      let sickNoteUrl: string | null = null;
      if (sickNoteFile && leaveType === 'SICK') {
        sickNoteUrl = await uploadSickNote(sickNoteFile);
        if (!sickNoteUrl) return; // Upload failed
      }

      // Create request
      const success = await createLeaveRequest({
        leaveType,
        startDate,
        endDate,
        isHalfDay,
        comment,
        sickNoteUrl,
        // Admin can choose to auto-approve
        status: autoApprove ? 'APPROVED' : 'PENDING',
      });

      if (success) {
        toast.success(
          autoApprove 
            ? 'Urlaubsantrag wurde genehmigt und erstellt' 
            : 'Urlaubsantrag wurde erstellt'
        );
        resetForm();
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error creating leave request:', error);
      toast.error('Fehler beim Erstellen des Antrags');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="form-card max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Urlaubsantrag für Mitarbeiter erstellen
          </DialogTitle>
          <DialogDescription>
            Erstellen Sie einen Urlaubsantrag für einen Mitarbeiter
          </DialogDescription>
        </DialogHeader>

        <div className="form-grid">
          {/* Select Employee */}
          <div className="form-field">
            <Label className="form-label">Mitarbeiter *</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Mitarbeiter auswählen" />
              </SelectTrigger>
              <SelectContent>
                {users
                  .filter(u => u.is_active)
                  .map(user => (
                    <SelectItem key={`admin-leave-user-${user.id}`} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Leave Type */}
          <div className="form-field">
            <Label className="form-label">Art der Abwesenheit</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant={leaveType === 'VACATION' ? 'default' : 'outline'}
                className="w-full min-h-[80px] px-3 py-3 flex flex-col gap-2 items-center justify-center whitespace-normal"
                onClick={() => setLeaveType('VACATION')}
              >
                <Umbrella className="w-6 h-6 flex-shrink-0" />
                <span className="text-sm text-center leading-snug">Urlaub</span>
              </Button>
              <Button
                type="button"
                variant={leaveType === 'SICK' ? 'default' : 'outline'}
                className="w-full min-h-[80px] px-3 py-3 flex flex-col gap-2 items-center justify-center whitespace-normal"
                onClick={() => setLeaveType('SICK')}
              >
                <Heart className="w-6 h-6 flex-shrink-0" />
                <span className="text-sm text-center leading-snug">Krankmeldung</span>
              </Button>
              <Button
                type="button"
                variant={leaveType === 'UNPAID_LEAVE' ? 'default' : 'outline'}
                className="w-full min-h-[80px] px-3 py-3 flex flex-col gap-2 items-center justify-center whitespace-normal"
                onClick={() => setLeaveType('UNPAID_LEAVE')}
              >
                <Calendar className="w-6 h-6 flex-shrink-0" />
                <span className="text-sm text-center leading-snug">Unbezahlte Abwesenheit</span>
              </Button>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <Label className="form-label">Startdatum</Label>
              <Input
                type="date"
                className="form-input [&::-webkit-calendar-picker-indicator]:brightness-0"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="form-field">
              <Label className="form-label">Enddatum</Label>
              <Input
                type="date"
                className="form-input [&::-webkit-calendar-picker-indicator]:brightness-0"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Half Day Option */}
          {startDate === endDate && startDate && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <Label htmlFor="half-day" className="cursor-pointer">
                Halber Tag
              </Label>
              <Switch
                id="half-day"
                checked={isHalfDay}
                onCheckedChange={setIsHalfDay}
              />
            </div>
          )}

          {/* Auto-Approve Option */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <Label htmlFor="auto-approve" className="cursor-pointer">
                Sofort genehmigen
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Antrag wird direkt als genehmigt erstellt
              </p>
            </div>
            <Switch
              id="auto-approve"
              checked={autoApprove}
              onCheckedChange={setAutoApprove}
            />
          </div>

          {/* Calculated Days Info */}
          {startDate && endDate && selectedUserId && (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p>
                    <strong>Tage:</strong> {calculatedDays} Arbeitstag{calculatedDays !== 1 ? 'e' : ''}
                    {includesWeekend && ' (Wochenenden ausgeschlossen)'}
                    {includesHoliday && ' (Feiertage ausgeschlossen)'}
                  </p>
                  {leaveType === 'VACATION' && quota && (
                    <p>
                      <strong>Verfügbar:</strong> {quota.availableDays} von {quota.totalDays} Tagen
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Quota Exceeded Warning */}
          {isQuotaExceeded && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Der Mitarbeiter hat nicht genügend Urlaubstage verfügbar.
              </AlertDescription>
            </Alert>
          )}

          {/* Comment */}
          <div className="form-field">
            <Label className="form-label">Kommentar (optional)</Label>
            <Textarea
              className="form-input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Zusätzliche Informationen..."
              rows={3}
            />
          </div>

          {/* Sick Note Upload */}
          {leaveType === 'SICK' && (
            <div className="form-field">
              <Label className="form-label">Krankmeldung hochladen (optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  className="form-input"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSickNoteFile(file);
                  }}
                />
                {sickNoteFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSickNoteFile(null)}
                  >
                    Entfernen
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                PDF, JPG oder PNG (max. 10 MB)
              </p>
            </div>
          )}
        </div>

        <div className="form-footer">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting || uploading}
          >
            {submitting || uploading ? 'Wird erstellt...' : 
             autoApprove ? 'Genehmigen & Erstellen' : 'Antrag erstellen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}