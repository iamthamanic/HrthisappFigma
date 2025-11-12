/**
 * @file BrowoKo_CreateShiftDialog.tsx
 * @version 3.0.0
 * @description Dialog zum Erstellen einer oder mehrerer Schichten mit umfassenden Validierungen
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarIcon, Plus, Trash2, AlertCircle, Clock } from './icons/BrowoKoIcons';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from './ui/utils';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  specialization?: string;
  location_id?: string;
  department?: string;
}

interface Location {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface ShiftData {
  user_id: string;
  date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  specialization?: string;
  location_id?: string;
  department_id?: string;
  notes?: string;
}

interface Shift {
  id: string;
  user_id: string;
  date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  location_id?: string;
  department_id?: string;
  specialization?: string;
  notes?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  user: User | null;
  selectedWeek: Date;
  locations: Location[];
  departments: Department[];
  specializations: string[];
  onCreateShift?: (shiftData: ShiftData) => Promise<void>;
  onCreateMultipleShifts?: (shiftsData: ShiftData[]) => Promise<void>;
  onUpdateShift?: (shiftId: string, shiftData: ShiftData) => Promise<void>;
  editShift?: Shift | null;
  getUserShiftsForWeek?: (userId: string, weekStart: Date) => Promise<Shift[]>;
  checkShiftOverlap?: (userId: string, date: string, startTime: string, endTime: string, existingShifts?: Shift[]) => { hasOverlap: boolean; overlappingShift?: Shift };
}

interface PendingShift {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  specialization: string;
  location: string;
  department: string;
  notes: string;
}

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minutes}`;
});

const getShiftType = (startTime: string): string => {
  const hour = parseInt(startTime.split(':')[0]);
  if (hour >= 5 && hour < 13) return 'MORNING';
  if (hour >= 13 && hour < 21) return 'AFTERNOON';
  return 'NIGHT';
};

/**
 * Berechnet die Dauer einer Schicht in Stunden
 */
const calculateShiftDuration = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;
  
  // Handle overnight shifts
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }
  
  return (endMinutes - startMinutes) / 60;
};

/**
 * Prüft ob zwei Schichten exakt identisch sind
 */
const isExactDuplicate = (
  date1: string,
  start1: string,
  end1: string,
  date2: string,
  start2: string,
  end2: string
): boolean => {
  return date1 === date2 && start1 === start2 && end1 === end2;
};

/**
 * Prüft ob sich zwei Zeitbereiche überschneiden
 */
const hasTimeOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  return (
    (start1 >= start2 && start1 < end2) ||
    (end1 > start2 && end1 <= end2) ||
    (start1 <= start2 && end1 >= end2)
  );
};

export function BrowoKo_CreateShiftDialog({
  open,
  onClose,
  user,
  selectedWeek,
  locations,
  departments,
  specializations,
  onCreateShift,
  onCreateMultipleShifts,
  onUpdateShift,
  editShift = null,
  getUserShiftsForWeek,
  checkShiftOverlap,
}: Props) {
  const isEditMode = !!editShift;
  
  // Current shift form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('none');
  const [selectedLocation, setSelectedLocation] = useState<string>('none');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('none');
  const [notes, setNotes] = useState('');
  
  // User's existing shifts for the week
  const [existingShifts, setExistingShifts] = useState<Shift[]>([]);
  
  // Multi-shift state
  const [pendingShifts, setPendingShifts] = useState<PendingShift[]>([]);
  const [loading, setLoading] = useState(false);

  // Validation state
  const [validationWarning, setValidationWarning] = useState<{
    type: 'duplicate' | 'overlap' | 'hours_8' | 'hours_10' | 'hours_12';
    message: string;
    details?: string;
    requiresConfirmation?: boolean;
  } | null>(null);
  const [pendingShiftAction, setPendingShiftAction] = useState<(() => void) | null>(null);

  // Prefill form when editing
  useEffect(() => {
    if (editShift && open) {
      setSelectedDate(new Date(editShift.date));
      setStartTime(editShift.start_time);
      setEndTime(editShift.end_time);
      setSelectedSpecialization(editShift.specialization || 'none');
      setSelectedLocation(editShift.location_id || 'none');
      setSelectedDepartment(editShift.department_id || 'none');
      setNotes(editShift.notes || '');
      setPendingShifts([]); // Clear pending shifts in edit mode
    } else if (!editShift && open) {
      // Reset to defaults for create mode
      setSelectedDate(new Date());
      setStartTime('08:00');
      setEndTime('17:00');
      setSelectedSpecialization('none');
      setSelectedLocation('none');
      setSelectedDepartment('none');
      setNotes('');
      setPendingShifts([]);
    }
  }, [editShift, open]);

  // Load existing shifts for the user when dialog opens
  useEffect(() => {
    if (open && user && getUserShiftsForWeek) {
      getUserShiftsForWeek(user.id, selectedWeek).then(shifts => {
        setExistingShifts(shifts);
      });
    }
  }, [open, user, selectedWeek, getUserShiftsForWeek]);

  if (!user) return null;

  // Add current form data to pending shifts
  const handleAddShift = () => {
    if (!selectedDate) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const duration = calculateShiftDuration(startTime, endTime);

    // 1. CHECK: Exakte Duplikate in bestehenden Schichten
    const exactDuplicateExisting = existingShifts.find(shift => 
      isExactDuplicate(shift.date, shift.start_time, shift.end_time, dateStr, startTime, endTime)
    );

    if (exactDuplicateExisting) {
      setValidationWarning({
        type: 'duplicate',
        message: '🚫 EXAKTES DUPLIKAT ERKANNT!',
        details: `Diese Person hat bereits eine identische Schicht:\n\n` +
          `📅 Datum: ${format(new Date(exactDuplicateExisting.date), 'dd.MM.yyyy', { locale: de })}\n` +
          `🕐 Zeit: ${exactDuplicateExisting.start_time} - ${exactDuplicateExisting.end_time}\n\n` +
          `Exakte Duplikate sind nicht erlaubt.`,
        requiresConfirmation: false
      });
      return;
    }

    // 2. CHECK: Exakte Duplikate in pending Schichten
    const exactDuplicatePending = pendingShifts.find(shift => 
      isExactDuplicate(
        format(shift.date, 'yyyy-MM-dd'),
        shift.startTime,
        shift.endTime,
        dateStr,
        startTime,
        endTime
      )
    );

    if (exactDuplicatePending) {
      setValidationWarning({
        type: 'duplicate',
        message: '🚫 EXAKTES DUPLIKAT ERKANNT!',
        details: `Diese Schicht wurde bereits hinzugefügt:\n\n` +
          `📅 Datum: ${format(exactDuplicatePending.date, 'dd.MM.yyyy', { locale: de })}\n` +
          `🕐 Zeit: ${exactDuplicatePending.startTime} - ${exactDuplicatePending.endTime}\n\n` +
          `Exakte Duplikate sind nicht erlaubt.`,
        requiresConfirmation: false
      });
      return;
    }

    // 3. CHECK: Zeitüberschneidungen mit bestehenden Schichten
    const overlapExisting = existingShifts.find(shift => {
      if (shift.date !== dateStr) return false;
      return hasTimeOverlap(startTime, endTime, shift.start_time, shift.end_time);
    });

    if (overlapExisting) {
      const actuallyAdd = () => {
        performActualAdd();
      };
      
      setValidationWarning({
        type: 'overlap',
        message: '⚠️ ZEITÜBERSCHNEIDUNG ERKANNT!',
        details: `Diese Schicht überschneidet sich mit einer bestehenden:\n\n` +
          `📅 Datum: ${format(new Date(overlapExisting.date), 'dd.MM.yyyy', { locale: de })}\n` +
          `🕐 Bestehend: ${overlapExisting.start_time} - ${overlapExisting.end_time}\n` +
          `🕐 Neu: ${startTime} - ${endTime}\n\n` +
          `Möchten Sie die Schicht trotzdem hinzufügen?`,
        requiresConfirmation: true
      });
      
      setPendingShiftAction(() => actuallyAdd);
      return;
    }

    // 4. CHECK: Zeitüberschneidungen mit pending Schichten
    const overlapPending = pendingShifts.find(shift => {
      if (format(shift.date, 'yyyy-MM-dd') !== dateStr) return false;
      return hasTimeOverlap(startTime, endTime, shift.startTime, shift.endTime);
    });

    if (overlapPending) {
      const actuallyAdd = () => {
        performActualAdd();
      };
      
      setValidationWarning({
        type: 'overlap',
        message: '⚠️ ZEITÜBERSCHNEIDUNG ERKANNT!',
        details: `Diese Schicht überschneidet sich mit einer bereits hinzugefügten:\n\n` +
          `📅 Datum: ${format(overlapPending.date, 'dd.MM.yyyy', { locale: de })}\n` +
          `🕐 Bestehend: ${overlapPending.startTime} - ${overlapPending.endTime}\n` +
          `🕐 Neu: ${startTime} - ${endTime}\n\n` +
          `Möchten Sie die Schicht trotzdem hinzufügen?`,
        requiresConfirmation: true
      });
      
      setPendingShiftAction(() => actuallyAdd);
      return;
    }

    // 5. CHECK: Schichtlänge über 12 Stunden (MUSS bestätigt werden)
    if (duration > 12) {
      const actuallyAdd = () => {
        performActualAdd();
      };
      
      setValidationWarning({
        type: 'hours_12',
        message: '🚨 SEHR LANGE SCHICHT!',
        details: `Die Schicht dauert ${duration.toFixed(1)} Stunden.\n\n` +
          `⚠️ Schichten über 12 Stunden müssen ausdrücklich bestätigt werden.\n\n` +
          `Bitte prüfen Sie:\n` +
          `• Arbeitsschutzbestimmungen\n` +
          `• Pausenregelungen\n` +
          `• Ruhezeiten\n\n` +
          `Möchten Sie diese sehr lange Schicht wirklich anlegen?`,
        requiresConfirmation: true
      });
      
      setPendingShiftAction(() => actuallyAdd);
      return;
    }

    // 6. CHECK: Schichtlänge über 10 Stunden (Warnung mit Auto-Accept)
    if (duration > 10) {
      const actuallyAdd = () => {
        performActualAdd();
      };
      
      setValidationWarning({
        type: 'hours_10',
        message: 'ℹ️ LANGE SCHICHT',
        details: `Die Schicht dauert ${duration.toFixed(1)} Stunden.\n\n` +
          `Hinweis: Bitte beachten Sie die gesetzlichen Pausenregelungen bei langen Schichten.\n\n` +
          `Möchten Sie fortfahren?`,
        requiresConfirmation: true
      });
      
      setPendingShiftAction(() => actuallyAdd);
      return;
    }

    // 7. CHECK: Schichtlänge über 8 Stunden (Info-Hinweis mit Auto-Accept)
    if (duration > 8) {
      const actuallyAdd = () => {
        performActualAdd();
      };
      
      setValidationWarning({
        type: 'hours_8',
        message: 'ℹ️ HINWEIS',
        details: `Die Schicht dauert ${duration.toFixed(1)} Stunden.\n\n` +
          `Hinweis: Bei Schichten über 8 Stunden sind gesetzliche Pausen zu beachten.\n\n` +
          `Möchten Sie fortfahren?`,
        requiresConfirmation: true
      });
      
      setPendingShiftAction(() => actuallyAdd);
      return;
    }

    // Alle Prüfungen erfolgreich - Schicht direkt hinzufügen
    performActualAdd();
  };

  // Hilfsfunktion: Schicht tatsächlich zur Liste hinzufügen
  const performActualAdd = () => {
    if (!selectedDate) return;

    const newShift: PendingShift = {
      id: Date.now().toString(),
      date: selectedDate,
      startTime,
      endTime,
      specialization: selectedSpecialization,
      location: selectedLocation,
      department: selectedDepartment,
      notes,
    };

    setPendingShifts((prev) => [...prev, newShift]);

    // Keep date selected, only reset time and other fields
    setStartTime('08:00');
    setEndTime('17:00');
    setSelectedSpecialization('none');
    setSelectedLocation('none');
    setSelectedDepartment('none');
    setNotes('');
    
    // Close any warning dialog
    setValidationWarning(null);
    setPendingShiftAction(null);
  };

  // Remove a pending shift
  const handleRemoveShift = (id: string) => {
    setPendingShifts((prev) => prev.filter((shift) => shift.id !== id));
  };

  // Submit all pending shifts
  const handleSubmitAll = async () => {
    // EDIT MODE: Update existing shift
    if (isEditMode && editShift) {
      if (!selectedDate) return;
      
      try {
        setLoading(true);
        
        const updatedShiftData: ShiftData = {
          user_id: user.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          shift_type: getShiftType(startTime),
          start_time: startTime,
          end_time: endTime,
          specialization: selectedSpecialization === 'none' ? user.specialization : selectedSpecialization,
          location_id: selectedLocation === 'none' ? user.location_id : selectedLocation,
          department_id: selectedDepartment === 'none' ? undefined : selectedDepartment,
          notes: notes || undefined,
        };
        
        if (onUpdateShift) {
          await onUpdateShift(editShift.id, updatedShiftData);
        }
        
        onClose();
      } catch (error) {
        console.error('Error updating shift:', error);
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // CREATE MODE: Create new shifts
    if (pendingShifts.length === 0 && !selectedDate) return;

    try {
      setLoading(true);

      // Collect all shifts (including current form if filled)
      const allShifts: ShiftData[] = [];

      // Add all pending shifts
      pendingShifts.forEach((shift) => {
        allShifts.push({
          user_id: user.id,
          date: format(shift.date, 'yyyy-MM-dd'),
          shift_type: getShiftType(shift.startTime),
          start_time: shift.startTime,
          end_time: shift.endTime,
          specialization: shift.specialization === 'none' ? user.specialization : shift.specialization,
          location_id: shift.location === 'none' ? user.location_id : shift.location,
          department_id: shift.department === 'none' ? undefined : shift.department,
          notes: shift.notes || undefined,
        });
      });

      // Add current form if date is selected
      if (selectedDate) {
        allShifts.push({
          user_id: user.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          shift_type: getShiftType(startTime),
          start_time: startTime,
          end_time: endTime,
          specialization: selectedSpecialization === 'none' ? user.specialization : selectedSpecialization,
          location_id: selectedLocation === 'none' ? user.location_id : selectedLocation,
          department_id: selectedDepartment === 'none' ? undefined : selectedDepartment,
          notes: notes || undefined,
        });
      }

      // Submit all shifts
      if (allShifts.length > 1 && onCreateMultipleShifts) {
        await onCreateMultipleShifts(allShifts);
      } else if (allShifts.length === 1 && onCreateShift) {
        await onCreateShift(allShifts[0]);
      }

      // Reset everything
      setPendingShifts([]);
      setSelectedDate(new Date());
      setStartTime('08:00');
      setEndTime('17:00');
      setSelectedSpecialization('none');
      setSelectedLocation('none');
      setSelectedDepartment('none');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error creating shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPendingShifts([]);
    setSelectedDate(new Date());
    setStartTime('08:00');
    setEndTime('17:00');
    setSelectedSpecialization('none');
    setSelectedLocation('none');
    setSelectedDepartment('none');
    setNotes('');
    onClose();
  };

  const getLocationName = (id: string) => {
    if (id === 'none') return 'Standard';
    return locations.find((l) => l.id === id)?.name || id;
  };

  const getDepartmentName = (id: string) => {
    if (id === 'none') return 'Standard';
    return departments.find((d) => d.id === id)?.name || id;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose} modal={false}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {isEditMode ? 'Schicht bearbeiten' : 'Schichten zuweisen'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? `Bearbeite die Schicht für ${user.first_name} ${user.last_name}`
              : `Erstelle eine oder mehrere Schichten für ${user.first_name} ${user.last_name}`}
            {user.specialization && ` (${user.specialization})`}
          </DialogDescription>
        </DialogHeader>

        {/* 2-SPALTEN LAYOUT: Formular LINKS, Liste RECHTS (nur im Create Mode) */}
        <div className={cn(
          "flex-1 overflow-hidden grid gap-0",
          isEditMode ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
        )}>
          {/* LINKE SPALTE: FORMULAR + BUTTON */}
          <div className={cn("flex flex-col", !isEditMode && "border-r")}>
            <ScrollArea className="flex-1 px-6 pr-4">
            <div className="space-y-4">
              {/* Datum */}
              <div>
                <Label>Datum</Label>
                <Popover modal={false}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left',
                        !selectedDate && 'text-gray-500'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP', { locale: de }) : 'Datum auswählen'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[250]" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      locale={de}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Zeitraum */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Von</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto z-[250]" position="popper" sideOffset={5}>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Bis</Label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto z-[250]" position="popper" sideOffset={5}>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Schichtdauer-Anzeige mit Warnungen */}
              {(() => {
                const duration = calculateShiftDuration(startTime, endTime);
                
                if (duration > 12) {
                  return (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <span className="font-semibold">Sehr lange Schicht: {duration.toFixed(1)} Stunden</span>
                        <br />
                        Schichten über 12 Stunden erfordern eine Bestätigung!
                      </AlertDescription>
                    </Alert>
                  );
                } else if (duration > 10) {
                  return (
                    <Alert className="bg-orange-50 border-orange-200">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <span className="font-semibold">Lange Schicht: {duration.toFixed(1)} Stunden</span>
                        <br />
                        Bitte Pausenregelungen beachten.
                      </AlertDescription>
                    </Alert>
                  );
                } else if (duration > 8) {
                  return (
                    <Alert className="bg-blue-50 border-blue-200">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        <span className="font-semibold">Schichtdauer: {duration.toFixed(1)} Stunden</span>
                        <br />
                        Gesetzliche Pausen beachten.
                      </AlertDescription>
                    </Alert>
                  );
                } else {
                  return (
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Schichtdauer: {duration.toFixed(1)} Stunden</span>
                    </div>
                  );
                }
              })()}

              {/* Standort */}
              <div>
                <Label>Standort (optional)</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Standort auswählen" />
                  </SelectTrigger>
                  <SelectContent className="z-[250]" position="popper" sideOffset={5}>
                    <SelectItem value="none">Standard</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Abteilung */}
              <div>
                <Label>Abteilung (optional)</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Abteilung auswählen" />
                  </SelectTrigger>
                  <SelectContent className="z-[250]" position="popper" sideOffset={5}>
                    <SelectItem value="none">Standard</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Spezialisierung */}
              <div>
                <Label>Spezialisierung (optional)</Label>
                <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                  <SelectTrigger>
                    <SelectValue placeholder="Spezialisierung auswählen" />
                  </SelectTrigger>
                  <SelectContent className="z-[250]" position="popper" sideOffset={5}>
                    <SelectItem value="none">Standard ({user.specialization || 'Keine'})</SelectItem>
                    {specializations.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notizen */}
              <div>
                <Label>Notizen (optional)</Label>
                <textarea
                  className="w-full min-h-[60px] px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="z.B. Vertretung für..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            </ScrollArea>

            {/* BLAUER BUTTON - STICKY AM ENDE DER LINKEN SPALTE (nur im Create Mode) */}
            {!isEditMode && (
              <div className="flex-shrink-0 border-t-2 border-blue-200 bg-blue-50 py-4 px-6">
                <Button
                  type="button"
                  variant="default"
                  className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-base font-semibold shadow-lg"
                  onClick={handleAddShift}
                  disabled={!selectedDate}
                >
                  <Plus className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="truncate">
                    {pendingShifts.length > 0 ? 'Weitere hinzufügen' : 'Zur Liste hinzufügen'}
                  </span>
                </Button>
              </div>
            )}
          </div>

          {/* RECHTE SPALTE: SCHICHTENLISTE (scrollbar!) - nur im Create Mode */}
          {!isEditMode && (
            <div className="flex flex-col bg-gradient-to-br from-green-50 to-emerald-50 h-full min-h-0">
              {/* BESTEHENDE SCHICHTEN DIESER WOCHE */}
              {existingShifts.length > 0 && (
                <div className="flex-shrink-0 mb-4 px-6 pt-4">
                  <div className="mb-2 pb-2 border-b border-blue-200">
                    <span className="text-sm font-bold text-blue-800">
                      📅 {existingShifts.length} Schicht{existingShifts.length !== 1 && 'en'} diese Woche
                    </span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-visible pr-2">
                    {existingShifts.map((shift) => {
                      const shiftDuration = calculateShiftDuration(shift.start_time, shift.end_time);
                      const isLongShift = shiftDuration > 10;
                      const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
                      const isDuplicateDate = shift.date === dateStr && 
                        isExactDuplicate(shift.date, shift.start_time, shift.end_time, dateStr, startTime, endTime);
                      const hasOverlapWithCurrent = shift.date === dateStr && 
                        hasTimeOverlap(startTime, endTime, shift.start_time, shift.end_time);

                      return (
                        <div
                          key={shift.id}
                          className={cn(
                            "p-2 rounded border text-xs",
                            isDuplicateDate && "bg-red-100 border-red-400 ring-2 ring-red-300",
                            !isDuplicateDate && hasOverlapWithCurrent && "bg-orange-100 border-orange-400 ring-1 ring-orange-300",
                            !isDuplicateDate && !hasOverlapWithCurrent && "bg-blue-50 border-blue-200"
                          )}
                        >
                          <div className="font-semibold text-blue-900 flex items-center justify-between">
                            <span>{format(new Date(shift.date), 'dd.MM.yyyy (EEE)', { locale: de })}</span>
                            {isDuplicateDate && <span className="text-red-600 text-xs">🚫 DUPLIKAT</span>}
                            {!isDuplicateDate && hasOverlapWithCurrent && <span className="text-orange-600 text-xs">⚠️ ÜBERLAPP</span>}
                          </div>
                          <div className="text-blue-700 flex items-center gap-2">
                            🕐 {shift.start_time} - {shift.end_time}
                            {isLongShift && <span className="text-orange-600">({shiftDuration.toFixed(1)}h)</span>}
                          </div>
                          {shift.notes && (
                            <div className="text-blue-600 italic mt-1">
                              💬 {shift.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SCROLLBARER BEREICH FÜR SCHICHTEN */}
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-visible px-6">
                {/* HINZUGEFÜGTE SCHICHTEN (PENDING) */}
                {pendingShifts.length === 0 && existingShifts.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div className="space-y-3">
                      <div className="text-5xl">📋</div>
                      <div className="text-sm text-gray-600">
                        <p className="font-semibold mb-1">Noch keine Schichten</p>
                        <p className="text-xs">Fülle das Formular aus und klicke auf "Hinzufügen"</p>
                      </div>
                    </div>
                  </div>
              ) : pendingShifts.length === 0 && existingShifts.length > 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div className="space-y-3">
                      <div className="text-5xl">➕</div>
                      <div className="text-sm text-gray-600">
                        <p className="font-semibold mb-1">Keine neuen Schichten hinzugefügt</p>
                        <p className="text-xs">Fülle das Formular aus und klicke auf "Hinzufügen"</p>
                      </div>
                    </div>
                  </div>
              ) : (
                <>
                  <div className="flex-shrink-0 mb-4 pb-3 border-b border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-green-800">
                        ✅ {pendingShifts.length} Schicht{pendingShifts.length !== 1 && 'en'} hinzugefügt
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 pr-2 pb-4">
                    {pendingShifts.map((shift) => (
                      <div
                        key={shift.id}
                        className="flex items-start justify-between p-3 bg-white rounded-lg border-2 border-green-300 shadow-md hover:shadow-lg transition-shadow"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="font-semibold text-gray-900">
                            {format(shift.date, 'dd.MM.yyyy', { locale: de })}
                          </div>
                          <div className="text-sm text-gray-700">
                            🕐 {shift.startTime} - {shift.endTime}
                          </div>
                          <div className="text-xs text-gray-600">
                            📍 {getLocationName(shift.location)}
                          </div>
                          <div className="text-xs text-gray-600">
                            🏢 {getDepartmentName(shift.department)}
                          </div>
                          {shift.notes && (
                            <div className="text-xs text-gray-500 italic mt-1">
                              💬 {shift.notes}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveShift(shift.id)}
                          className="flex-shrink-0 ml-2 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
              </div>

              {/* "SCHICHT HINZUFÜGEN" BUTTON - Fest am Ende der rechten Spalte */}
              <div className="flex-shrink-0 px-6 pb-4 pt-3 border-t-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
                <Button
                  type="button"
                  variant="default"
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold shadow-md"
                  onClick={handleAddShift}
                  disabled={!selectedDate}
                >
                  <Plus className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="truncate">Schicht hinzufügen</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t-2 px-6 py-4 bg-white">
          <div className="w-full flex items-center justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              disabled={loading}
              className="min-w-[120px]"
            >
              Abbrechen
            </Button>
            <Button 
              onClick={handleSubmitAll} 
              disabled={loading || (!isEditMode && pendingShifts.length === 0 && !selectedDate) || (isEditMode && !selectedDate)}
              className="bg-green-600 hover:bg-green-700 min-w-[180px] h-11 font-semibold"
            >
              {loading
                ? (isEditMode ? 'Wird aktualisiert...' : 'Wird erstellt...')
                : isEditMode
                ? 'Schicht aktualisieren'
                : pendingShifts.length > 0 || selectedDate
                ? `${pendingShifts.length + (selectedDate ? 1 : 0)} Schicht${(pendingShifts.length + (selectedDate ? 1 : 0)) !== 1 ? 'en' : ''} erstellen`
                : 'Erstellen'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Validation Warning AlertDialog */}
      <AlertDialog open={!!validationWarning} onOpenChange={(open) => {
        if (!open) {
          setValidationWarning(null);
          setPendingShiftAction(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {validationWarning?.type === 'duplicate' && <AlertCircle className="h-5 w-5 text-red-600" />}
              {validationWarning?.type === 'overlap' && <AlertCircle className="h-5 w-5 text-orange-600" />}
              {(validationWarning?.type === 'hours_8' || validationWarning?.type === 'hours_10') && <Clock className="h-5 w-5 text-blue-600" />}
              {validationWarning?.type === 'hours_12' && <AlertCircle className="h-5 w-5 text-red-600" />}
              {validationWarning?.message}
            </AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line text-left">
              {validationWarning?.details}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {validationWarning?.requiresConfirmation ? (
              <>
                <AlertDialogCancel onClick={() => {
                  setValidationWarning(null);
                  setPendingShiftAction(null);
                }}>
                  Abbrechen
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    if (pendingShiftAction) {
                      pendingShiftAction();
                    }
                  }}
                  className={cn(
                    validationWarning?.type === 'hours_12' && "bg-red-600 hover:bg-red-700",
                    validationWarning?.type === 'overlap' && "bg-orange-600 hover:bg-orange-700"
                  )}
                >
                  {validationWarning?.type === 'hours_12' ? 'Ja, trotzdem erstellen' : 'Fortfahren'}
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction 
                onClick={() => {
                  setValidationWarning(null);
                  setPendingShiftAction(null);
                }}
                className="bg-gray-600 hover:bg-gray-700"
              >
                OK
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
