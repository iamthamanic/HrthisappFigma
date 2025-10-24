# 🎯 HRTHIS - 12-WOCHEN IMPLEMENTIERUNGS-ROADMAP

**Start**: Jetzt  
**Ende**: 12 Wochen  
**Modus**: Vollgas, Phase für Phase  

---

## 📊 TIMELINE ÜBERSICHT

```
Woche 1-3:   PHASE 1 - Arbeitszeitkonto & Überstunden
Woche 4-7:   PHASE 2 - Schichtplanung (KRITISCH!)
Woche 8-12:  PHASE 3 - Payroll (Auto SV/Steuer)
Optional:    PHASE 4 - Dokumentenbuilder
```

---

## 🔥 PHASE 1: ARBEITSZEITKONTO & ÜBERSTUNDEN (3 Wochen)

### **ZIEL**: Zeiterfassung von "Nice to Have" zu "Business Critical"

---

### **WOCHE 1: DB-Schema & Backend**

#### **Tag 1-2: DB-Schema erstellen**

**Neue Tabellen:**

```sql
-- /supabase/migrations/060_time_account_system.sql

-- 1. TIME ACCOUNTS (Arbeitszeitkonten)
CREATE TABLE IF NOT EXISTS time_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL, -- 1-12
  year INTEGER NOT NULL,  -- 2025
  
  -- Stunden
  soll_stunden DECIMAL(10,2) DEFAULT 0, -- Sollarbeitszeit
  ist_stunden DECIMAL(10,2) DEFAULT 0,  -- Tatsächliche Arbeitszeit
  saldo DECIMAL(10,2) DEFAULT 0,        -- Saldo (Ist - Soll)
  
  -- Überstunden
  ueberstunden DECIMAL(10,2) DEFAULT 0,     -- Positive Überstunden
  ueberstunden_abbau DECIMAL(10,2) DEFAULT 0, -- Abgebaute Überstunden (Freizeitausgleich)
  ueberstunden_auszahlung DECIMAL(10,2) DEFAULT 0, -- Ausgezahlte Überstunden
  
  -- Übertrag
  carry_over_from_previous DECIMAL(10,2) DEFAULT 0, -- Saldo vom Vormonat
  
  -- Metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_month_year UNIQUE(user_id, month, year)
);

-- Indexes
CREATE INDEX idx_time_accounts_user_id ON time_accounts(user_id);
CREATE INDEX idx_time_accounts_year_month ON time_accounts(year, month);

-- RLS
ALTER TABLE time_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time accounts"
  ON time_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "HR/SUPERADMIN can view all time accounts"
  ON time_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('HR', 'SUPERADMIN')
    )
  );

CREATE POLICY "System can insert/update time accounts"
  ON time_accounts FOR ALL
  USING (true);

-- 2. TIME CORRECTIONS (Zeitkorrekturen)
CREATE TABLE IF NOT EXISTS time_corrections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Welche Session?
  session_id UUID REFERENCES time_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Alte vs. Neue Zeiten
  old_start TIMESTAMP WITH TIME ZONE NOT NULL,
  old_end TIMESTAMP WITH TIME ZONE,
  new_start TIMESTAMP WITH TIME ZONE NOT NULL,
  new_end TIMESTAMP WITH TIME ZONE,
  
  -- Begründung
  reason TEXT,
  
  -- Workflow
  requested_by UUID REFERENCES users(id) NOT NULL, -- Wer beantragt
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  
  approved_by UUID REFERENCES users(id), -- Wer genehmigt
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- Indexes
CREATE INDEX idx_time_corrections_session_id ON time_corrections(session_id);
CREATE INDEX idx_time_corrections_user_id ON time_corrections(user_id);
CREATE INDEX idx_time_corrections_status ON time_corrections(status);

-- RLS
ALTER TABLE time_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own corrections"
  ON time_corrections FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = requested_by);

CREATE POLICY "Users can create corrections"
  ON time_corrections FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "HR/SUPERADMIN can approve/reject"
  ON time_corrections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('HR', 'SUPERADMIN')
    )
  );

-- 3. OVERTIME TRANSACTIONS (Überstunden-Bewegungen)
CREATE TABLE IF NOT EXISTS overtime_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Type
  transaction_type TEXT NOT NULL, -- EARNED, ABBAU, AUSZAHLUNG
  
  -- Stunden
  hours DECIMAL(10,2) NOT NULL,
  
  -- Referenzen
  time_account_id UUID REFERENCES time_accounts(id),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  
  -- Beschreibung
  description TEXT,
  
  -- Wer hat's gemacht?
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_transaction_type CHECK (
    transaction_type IN ('EARNED', 'ABBAU', 'AUSZAHLUNG')
  )
);

-- Indexes
CREATE INDEX idx_overtime_transactions_user_id ON overtime_transactions(user_id);
CREATE INDEX idx_overtime_transactions_type ON overtime_transactions(transaction_type);

-- RLS
ALTER TABLE overtime_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own overtime transactions"
  ON overtime_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "HR/SUPERADMIN can view all"
  ON overtime_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('HR', 'SUPERADMIN')
    )
  );
```

**Erweitern: time_sessions Tabelle**

```sql
-- /supabase/migrations/061_extend_time_sessions.sql

-- Neue Spalten für Sessions
ALTER TABLE time_sessions 
  ADD COLUMN IF NOT EXISTS calculated_hours DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS is_corrected BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS correction_id UUID REFERENCES time_corrections(id);

-- Trigger: Automatische Berechnung der Stunden
CREATE OR REPLACE FUNCTION calculate_session_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL THEN
    -- Berechne Stunden (in Dezimal)
    NEW.calculated_hours = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600.0;
    
    -- Ziehe Pause ab wenn automatisch
    IF NEW.break_auto AND NEW.break_minutes IS NOT NULL THEN
      NEW.calculated_hours = NEW.calculated_hours - (NEW.break_minutes / 60.0);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_session_hours
  BEFORE INSERT OR UPDATE ON time_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_session_hours();
```

#### **Tag 3-5: Berechnungs-Logik**

**Edge Function für Monatsberechnung:**

```typescript
// /supabase/functions/server/timeAccountCalculation.ts

interface TimeAccountCalculation {
  userId: string;
  month: number;
  year: number;
}

export async function calculateTimeAccount(
  { userId, month, year }: TimeAccountCalculation
) {
  // 1. Lade User-Daten (weekly_hours)
  const { data: user } = await supabase
    .from('users')
    .select('weekly_hours')
    .eq('id', userId)
    .single();

  if (!user) throw new Error('User not found');

  // 2. Berechne Soll-Stunden
  const workdaysInMonth = calculateWorkdaysInMonth(month, year);
  const sollStundenProTag = user.weekly_hours / 5;
  const sollStundenGesamt = sollStundenProTag * workdaysInMonth;

  // 3. Lade alle Sessions des Monats
  const { data: sessions } = await supabase
    .from('time_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', `${year}-${month.toString().padStart(2, '0')}-01`)
    .lt('start_time', getNextMonth(month, year))
    .not('end_time', 'is', null); // Nur abgeschlossene Sessions

  // 4. Summiere Ist-Stunden (calculated_hours)
  const istStunden = sessions?.reduce(
    (sum, session) => sum + (session.calculated_hours || 0), 
    0
  ) || 0;

  // 5. Berechne Saldo
  const saldo = istStunden - sollStundenGesamt;

  // 6. Überstunden = nur positive Saldo
  const ueberstunden = saldo > 0 ? saldo : 0;

  // 7. Lade Vormonats-Saldo
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;
  
  const { data: previousAccount } = await supabase
    .from('time_accounts')
    .select('saldo')
    .eq('user_id', userId)
    .eq('month', previousMonth)
    .eq('year', previousYear)
    .single();

  const carryOver = previousAccount?.saldo || 0;

  // 8. Speichern/Update
  const { data: timeAccount } = await supabase
    .from('time_accounts')
    .upsert({
      user_id: userId,
      month,
      year,
      soll_stunden: sollStundenGesamt,
      ist_stunden: istStunden,
      saldo: saldo + carryOver, // Inkl. Übertrag
      ueberstunden,
      carry_over_from_previous: carryOver,
      calculated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,month,year'
    })
    .select()
    .single();

  return timeAccount;
}

// Helper: Arbeitstage im Monat (exkl. Wochenende + Feiertage)
function calculateWorkdaysInMonth(month: number, year: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workdays = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    
    // Nicht Samstag/Sonntag
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // TODO: Feiertage-Check (deutsche Feiertage)
      if (!isGermanHoliday(date)) {
        workdays++;
      }
    }
  }
  
  return workdays;
}

// Helper: Deutsche Feiertage
function isGermanHoliday(date: Date): boolean {
  // TODO: Implementieren basierend auf useGermanHolidays Hook
  return false;
}
```

---

### **WOCHE 2: Frontend - Monats-Timesheet**

#### **Neue Screens:**

```
📁 /screens/TimesheetScreen.tsx (User-Ansicht)
📁 /screens/admin/TeamTimesheetScreen.tsx (Admin-Ansicht)
```

#### **TimesheetScreen.tsx (User)**

```typescript
/**
 * @file TimesheetScreen.tsx
 * @description Monats-Timesheet für User
 * Features:
 * - Kalenderansicht (Monat)
 * - Soll/Ist pro Tag
 * - Saldo-Entwicklung
 * - Fehlzeiten (Urlaub, Krank)
 * - Zeitkorrektur beantragen
 * - Export (PDF/Excel)
 */

import { useState } from 'react';
import { Calendar, Download, Edit } from '../components/icons/HRTHISIcons';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MonthYearPicker } from '../components/MonthYearPicker';

export default function TimesheetScreen() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Load time account
  const { data: timeAccount } = useTimeAccount(month, year);
  
  // Load sessions
  const { data: sessions } = useTimeSessions(month, year);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1>Meine Arbeitszeit</h1>
        <MonthYearPicker 
          month={month} 
          year={year}
          onChange={(m, y) => {
            setMonth(m);
            setYear(y);
          }}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Soll-Stunden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {timeAccount?.soll_stunden.toFixed(1)}h
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Ist-Stunden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {timeAccount?.ist_stunden.toFixed(1)}h
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              (timeAccount?.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(timeAccount?.saldo || 0) > 0 ? '+' : ''}
              {timeAccount?.saldo.toFixed(1)}h
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Überstunden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {timeAccount?.ueberstunden.toFixed(1)}h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kalender mit Sessions */}
      <TimesheetCalendar 
        month={month}
        year={year}
        sessions={sessions}
        onRequestCorrection={(session) => {
          // Open correction dialog
        }}
      />

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={() => exportTimesheet(month, year, 'pdf')}>
          <Download className="w-4 h-4 mr-2" />
          PDF Export
        </Button>
        <Button variant="outline" onClick={() => exportTimesheet(month, year, 'excel')}>
          <Download className="w-4 h-4 mr-2" />
          Excel Export
        </Button>
      </div>
    </div>
  );
}
```

#### **TimesheetCalendar Component:**

```typescript
// /components/HRTHIS_TimesheetCalendar.tsx

interface TimesheetCalendarProps {
  month: number;
  year: number;
  sessions: TimeSession[];
  onRequestCorrection: (session: TimeSession) => void;
}

export function TimesheetCalendar({
  month,
  year,
  sessions,
  onRequestCorrection
}: TimesheetCalendarProps) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Header */}
      {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
        <div key={day} className="font-bold text-center p-2">
          {day}
        </div>
      ))}

      {/* Days */}
      {days.map(day => {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        // Find sessions for this day
        const daySessions = sessions.filter(s => 
          new Date(s.start_time).getDate() === day
        );
        
        // Calculate total hours for day
        const totalHours = daySessions.reduce(
          (sum, s) => sum + (s.calculated_hours || 0), 
          0
        );

        return (
          <Card 
            key={day}
            className={`p-2 ${isWeekend ? 'bg-gray-50' : ''}`}
          >
            <div className="font-bold">{day}</div>
            
            {!isWeekend && daySessions.length > 0 && (
              <div className="text-sm mt-1">
                <div className="font-medium">
                  {totalHours.toFixed(1)}h
                </div>
                
                {daySessions.map(session => (
                  <div key={session.id} className="text-xs text-gray-500">
                    {new Date(session.start_time).toLocaleTimeString('de-DE', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                    {' - '}
                    {session.end_time && new Date(session.end_time).toLocaleTimeString('de-DE', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                ))}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 w-full"
                  onClick={() => onRequestCorrection(daySessions[0])}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Korrigieren
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
```

---

### **WOCHE 3: Zeitkorrektur-System & Überstunden-Management**

#### **Zeitkorrektur-Dialog:**

```typescript
// /components/HRTHIS_TimeCorrectionDialog.tsx

interface TimeCorrectionDialogProps {
  session: TimeSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimeCorrectionDialog({
  session,
  open,
  onOpenChange
}: TimeCorrectionDialogProps) {
  const [newStart, setNewStart] = useState(session.start_time);
  const [newEnd, setNewEnd] = useState(session.end_time);
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    await supabase
      .from('time_corrections')
      .insert({
        session_id: session.id,
        user_id: session.user_id,
        old_start: session.start_time,
        old_end: session.end_time,
        new_start: newStart,
        new_end: newEnd,
        reason,
        requested_by: currentUserId,
        status: 'PENDING'
      });

    toast.success('Zeitkorrektur beantragt');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zeitkorrektur beantragen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Alte Zeiten */}
          <div>
            <Label>Aktuelle Zeiten:</Label>
            <div className="text-sm text-gray-500">
              {new Date(session.start_time).toLocaleString('de-DE')}
              {' - '}
              {session.end_time && new Date(session.end_time).toLocaleString('de-DE')}
            </div>
          </div>

          {/* Neue Start-Zeit */}
          <div>
            <Label>Neuer Start:</Label>
            <Input
              type="datetime-local"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
            />
          </div>

          {/* Neue End-Zeit */}
          <div>
            <Label>Neues Ende:</Label>
            <Input
              type="datetime-local"
              value={newEnd || ''}
              onChange={(e) => setNewEnd(e.target.value)}
            />
          </div>

          {/* Begründung */}
          <div>
            <Label>Begründung:</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Warum muss die Zeit korrigiert werden?"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit}>
              Korrektur beantragen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### **Admin: Zeitkorrekturen genehmigen:**

```typescript
// /screens/admin/TimeCorrectionApprovalScreen.tsx

export default function TimeCorrectionApprovalScreen() {
  const { data: corrections } = useQuery(
    'time-corrections',
    () => supabase
      .from('time_corrections')
      .select('*, user:users(*), session:time_sessions(*)')
      .eq('status', 'PENDING')
      .order('requested_at', { ascending: false })
  );

  const handleApprove = async (correctionId: string) => {
    const correction = corrections.find(c => c.id === correctionId);
    
    // 1. Update Session
    await supabase
      .from('time_sessions')
      .update({
        start_time: correction.new_start,
        end_time: correction.new_end,
        is_corrected: true,
        correction_id: correctionId
      })
      .eq('id', correction.session_id);

    // 2. Update Correction Status
    await supabase
      .from('time_corrections')
      .update({
        status: 'APPROVED',
        approved_by: currentUserId,
        approved_at: new Date().toISOString()
      })
      .eq('id', correctionId);

    // 3. Re-calculate Time Account
    await calculateTimeAccount({
      userId: correction.user_id,
      month: new Date(correction.new_start).getMonth() + 1,
      year: new Date(correction.new_start).getFullYear()
    });

    toast.success('Zeitkorrektur genehmigt');
  };

  return (
    <div className="space-y-6">
      <h1>Zeitkorrekturen genehmigen</h1>

      {corrections?.map(correction => (
        <Card key={correction.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {correction.user.first_name} {correction.user.last_name}
                </div>
                <div className="text-sm text-gray-500">
                  Alt: {new Date(correction.old_start).toLocaleString()}
                  {' → '}
                  Neu: {new Date(correction.new_start).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Begründung: {correction.reason}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleReject(correction.id)}
                >
                  Ablehnen
                </Button>
                <Button onClick={() => handleApprove(correction.id)}>
                  Genehmigen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

### **PHASE 1 DELIVERABLES:**

✅ DB-Schema (time_accounts, time_corrections, overtime_transactions)  
✅ Berechnungs-Edge-Function  
✅ Monats-Timesheet (User)  
✅ Team-Timesheet (Admin)  
✅ Zeitkorrektur-System  
✅ Überstunden-Management  
✅ Export (PDF/Excel)  

---

## 🔥 PHASE 2: SCHICHTPLANUNG (4 Wochen) ← KRITISCH!

### **ZIEL**: Vollständiges Schichtplanungs-System

---

### **WOCHE 4: DB-Schema & Schichtmodelle**

#### **Tag 1-3: DB-Schema**

```sql
-- /supabase/migrations/062_shift_planning_system.sql

-- 1. SCHICHTMODELLE (Templates)
CREATE TABLE IF NOT EXISTS shift_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- z.B. "Frühschicht"
  description TEXT,
  
  -- Zeiten
  start_time TIME NOT NULL, -- 06:00
  end_time TIME NOT NULL,   -- 14:00
  
  -- Pausen
  break_minutes INTEGER DEFAULT 30,
  break_paid BOOLEAN DEFAULT false,
  
  -- Zuschläge
  surcharge_percentage DECIMAL(5,2) DEFAULT 0, -- 0% = keine Zuschläge
  
  -- Farbe für Kalenderansicht
  color TEXT DEFAULT '#3B82F6', -- Hex-Code
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Indexes
CREATE INDEX idx_shift_models_active ON shift_models(is_active);

-- RLS
ALTER TABLE shift_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view shift models"
  ON shift_models FOR SELECT
  USING (true);

CREATE POLICY "HR/SUPERADMIN can manage shift models"
  ON shift_models FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('HR', 'SUPERADMIN')
    )
  );

-- 2. SCHICHTPLAN (Assignments)
CREATE TABLE IF NOT EXISTS shift_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Welche Schicht?
  shift_model_id UUID REFERENCES shift_models(id) ON DELETE CASCADE NOT NULL,
  
  -- Wer?
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Wann?
  date DATE NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'PLANNED', -- PLANNED, CONFIRMED, COMPLETED, CANCELLED
  
  -- Tausch-Info
  is_swap BOOLEAN DEFAULT false,
  original_assignment_id UUID REFERENCES shift_assignments(id),
  swap_request_id UUID REFERENCES shift_swap_requests(id),
  
  -- Wer hat's geplant?
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Bestätigung (User muss Schicht bestätigen)
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Notizen
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_status CHECK (
    status IN ('PLANNED', 'CONFIRMED', 'COMPLETED', 'CANCELLED')
  ),
  
  -- Keine Doppelbuchung
  CONSTRAINT unique_user_date_shift UNIQUE(user_id, date, shift_model_id)
);

-- Indexes
CREATE INDEX idx_shift_assignments_user_id ON shift_assignments(user_id);
CREATE INDEX idx_shift_assignments_date ON shift_assignments(date);
CREATE INDEX idx_shift_assignments_status ON shift_assignments(status);

-- RLS
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assignments"
  ON shift_assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "HR/SUPERADMIN can view all"
  ON shift_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('HR', 'SUPERADMIN')
    )
  );

CREATE POLICY "HR/SUPERADMIN can manage assignments"
  ON shift_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('HR', 'SUPERADMIN')
    )
  );

-- 3. SCHICHTTAUSCH (Swap Requests)
CREATE TABLE IF NOT EXISTS shift_swap_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Wer will tauschen?
  requester_id UUID REFERENCES users(id) NOT NULL,
  requester_assignment_id UUID REFERENCES shift_assignments(id) NOT NULL,
  
  -- Mit wem?
  target_user_id UUID REFERENCES users(id),
  target_assignment_id UUID REFERENCES shift_assignments(id),
  
  -- Alternativ: Offener Tausch (jeder kann annehmen)
  is_open_request BOOLEAN DEFAULT false,
  
  -- Nachricht
  message TEXT,
  
  -- Status
  status TEXT DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, CANCELLED
  
  -- Wer hat akzeptiert/abgelehnt?
  responded_by UUID REFERENCES users(id),
  responded_at TIMESTAMP WITH TIME ZONE,
  response_message TEXT,
  
  -- Admin-Genehmigung
  admin_approved_by UUID REFERENCES users(id),
  admin_approved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_swap_status CHECK (
    status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'ADMIN_APPROVED')
  )
);

-- Indexes
CREATE INDEX idx_shift_swaps_requester ON shift_swap_requests(requester_id);
CREATE INDEX idx_shift_swaps_target ON shift_swap_requests(target_user_id);
CREATE INDEX idx_shift_swaps_status ON shift_swap_requests(status);

-- RLS
ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own swap requests"
  ON shift_swap_requests FOR SELECT
  USING (
    auth.uid() = requester_id 
    OR auth.uid() = target_user_id
    OR is_open_request = true
  );

CREATE POLICY "Users can create swap requests"
  ON shift_swap_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update own requests"
  ON shift_swap_requests FOR UPDATE
  USING (
    auth.uid() = requester_id 
    OR auth.uid() = target_user_id
  );

CREATE POLICY "HR/SUPERADMIN can manage all swaps"
  ON shift_swap_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('HR', 'SUPERADMIN')
    )
  );

-- 4. SCHICHT-VORLAGEN (Templates für wiederkehrende Pläne)
CREATE TABLE IF NOT EXISTS shift_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- z.B. "Standard-Woche Team A"
  description TEXT,
  
  -- Template-Daten (JSON)
  -- Format: [{ day_of_week: 1-7, shift_model_id, user_ids: [] }]
  template_data JSONB NOT NULL,
  
  -- Für welches Team?
  team_id UUID REFERENCES teams(id),
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- RLS
ALTER TABLE shift_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR/SUPERADMIN can manage templates"
  ON shift_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('HR', 'SUPERADMIN')
    )
  );
```

#### **Tag 4-5: Schichtmodelle-Screen**

```typescript
// /screens/admin/ShiftModelsScreen.tsx

export default function ShiftModelsScreen() {
  const { data: shiftModels } = useQuery('shift-models', () =>
    supabase
      .from('shift_models')
      .select('*')
      .eq('is_active', true)
      .order('name')
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1>Schichtmodelle</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Neues Schichtmodell
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {shiftModels?.map(model => (
          <Card key={model.id}>
            <CardContent className="p-4">
              <div 
                className="w-full h-2 rounded mb-3"
                style={{ backgroundColor: model.color }}
              />
              
              <h3 className="font-bold mb-2">{model.name}</h3>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div>
                  ⏰ {model.start_time} - {model.end_time}
                </div>
                <div>
                  ☕ Pause: {model.break_minutes} Min.
                </div>
                {model.surcharge_percentage > 0 && (
                  <div className="text-green-600 font-medium">
                    💰 Zuschlag: +{model.surcharge_percentage}%
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(model)}
                >
                  Bearbeiten
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete(model.id)}
                >
                  Löschen
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ShiftModelDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSave={(data) => {
          // Save shift model
        }}
      />
    </div>
  );
}
```

---

### **WOCHE 5-6: Schichtplan-UI (Drag & Drop)**

**Ziel**: Wochenansicht mit Drag & Drop

```typescript
// /screens/admin/ShiftPlanningScreen.tsx

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function ShiftPlanningScreen() {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  
  // Load shift assignments for week
  const { data: assignments } = useShiftAssignments(weekStart);
  
  // Load all shift models
  const { data: shiftModels } = useShiftModels();
  
  // Load team members
  const { data: teamMembers } = useTeamMembers();

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    // Extract: userId, shiftModelId, date
    const userId = draggableId;
    const shiftModelId = destination.droppableId.split('_')[0];
    const date = destination.droppableId.split('_')[1];

    // Check conflicts
    const hasConflict = await checkShiftConflict(userId, date);
    if (hasConflict) {
      toast.error('Konflikt: User hat bereits Schicht oder Urlaub!');
      return;
    }

    // Create assignment
    await supabase
      .from('shift_assignments')
      .insert({
        shift_model_id: shiftModelId,
        user_id: userId,
        date,
        assigned_by: currentUserId,
        status: 'PLANNED'
      });

    toast.success('Schicht zugewiesen');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1>Schichtplan</h1>
        
        {/* Week Navigation */}
        <div className="flex items-center gap-2">
          <Button onClick={() => setWeekStart(subDays(weekStart, 7))}>
            ← Vorherige Woche
          </Button>
          <span className="font-medium">
            KW {getWeek(weekStart)} - {format(weekStart, 'dd.MM.yyyy')}
          </span>
          <Button onClick={() => setWeekStart(addDays(weekStart, 7))}>
            Nächste Woche →
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-8 gap-4">
          {/* Header Row */}
          <div className="font-bold">Schicht</div>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="font-bold text-center">
              {format(addDays(weekStart, i), 'EEE dd.MM', { locale: de })}
            </div>
          ))}

          {/* Shift Rows */}
          {shiftModels?.map(shift => (
            <>
              <div 
                key={shift.id}
                className="flex items-center gap-2"
              >
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: shift.color }}
                />
                <span className="font-medium">{shift.name}</span>
                <span className="text-sm text-gray-500">
                  {shift.start_time}-{shift.end_time}
                </span>
              </div>

              {/* Days */}
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const date = format(addDays(weekStart, dayIndex), 'yyyy-MM-dd');
                const dayAssignments = assignments?.filter(
                  a => a.shift_model_id === shift.id && a.date === date
                ) || [];

                return (
                  <Droppable 
                    key={`${shift.id}_${date}`}
                    droppableId={`${shift.id}_${date}`}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`
                          min-h-[100px] border-2 border-dashed rounded p-2
                          ${snapshot.isDraggingOver ? 'bg-blue-50 border-blue-400' : 'border-gray-200'}
                        `}
                      >
                        {dayAssignments.map((assignment, index) => (
                          <Draggable
                            key={assignment.id}
                            draggableId={assignment.user_id}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-white border rounded p-2 mb-2 shadow-sm hover:shadow-md cursor-move"
                              >
                                <div className="text-sm font-medium">
                                  {getUserName(assignment.user_id)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {assignment.status}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </>
          ))}
        </div>
      </DragDropContext>

      {/* Team Members Sidebar (Drag Source) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Mitarbeiter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {teamMembers?.map(member => (
              <Draggable
                key={member.id}
                draggableId={member.id}
                index={0}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="border rounded p-2 cursor-move hover:bg-gray-50"
                  >
                    {member.first_name} {member.last_name}
                  </div>
                )}
              </Draggable>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### **WOCHE 7: Schichttausch & User-Ansicht**

#### **User: Meine Schichten**

```typescript
// /screens/MyShiftsScreen.tsx

export default function MyShiftsScreen() {
  const { data: myShifts } = useQuery('my-shifts', () =>
    supabase
      .from('shift_assignments')
      .select('*, shift_model:shift_models(*)')
      .eq('user_id', currentUserId)
      .gte('date', format(new Date(), 'yyyy-MM-dd'))
      .order('date')
      .limit(30)
  );

  return (
    <div className="space-y-6">
      <h1>Meine Schichten</h1>

      {/* Upcoming Shifts */}
      <div className="space-y-4">
        {myShifts?.map(shift => (
          <Card key={shift.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">
                    {format(new Date(shift.date), 'EEEE, dd. MMMM yyyy', { locale: de })}
                  </div>
                  <div 
                    className="inline-flex items-center gap-2 mt-1"
                  >
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: shift.shift_model.color }}
                    />
                    <span className="font-medium">
                      {shift.shift_model.name}
                    </span>
                    <span className="text-gray-500">
                      {shift.shift_model.start_time} - {shift.shift_model.end_time}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => initiateShiftSwap(shift.id)}
                  >
                    Tauschen
                  </Button>
                  
                  {shift.status === 'PLANNED' && (
                    <Button
                      size="sm"
                      onClick={() => confirmShift(shift.id)}
                    >
                      Bestätigen
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

### **PHASE 2 DELIVERABLES:**

✅ DB-Schema (shift_models, shift_assignments, shift_swap_requests)  
✅ Schichtmodelle-Verwaltung (Admin)  
✅ Schichtplan-UI (Drag & Drop)  
✅ Konflikt-Erkennung (Urlaub, Doppelbuchung, Ruhezeit)  
✅ Schichttausch-System  
✅ "Meine Schichten" (User)  
✅ Integration: Schichtplan ↔ Zeiterfassung  
✅ Integration: Schichtplan ↔ Payroll (Zuschläge)  

---

## 💰 PHASE 3: PAYROLL-MODUL (4-5 Wochen)

### **ZIEL**: Vollautomatisches Lohnabrechnung-System (Option B)

---

### **WOCHE 8-9: Lohnarten & Berechnungs-Engine**

*[FORTSETZUNG FOLGT - WIRD NACH PHASE 1+2 DETAILLIERT]*

Grundstruktur:
- Lohnarten-System
- SV-Berechnung (automatisch)
- Steuer-Berechnung (nach Steuerklasse)
- Integration: Überstunden-Zuschläge
- Integration: Schicht-Zuschläge

---

## 📁 DATEISTRUKTUR - ÜBERSICHT

### **Neue Dateien Phase 1:**

```
/screens/
  TimesheetScreen.tsx (User)
  
/screens/admin/
  TeamTimesheetScreen.tsx
  TimeCorrectionApprovalScreen.tsx
  
/components/
  HRTHIS_TimesheetCalendar.tsx
  HRTHIS_TimeCorrectionDialog.tsx
  HRTHIS_OvertimeManagementCard.tsx
  
/hooks/
  HRTHIS_useTimeAccount.ts
  HRTHIS_useTimeSessions.ts
  HRTHIS_useTimeCorrections.ts
  
/services/
  HRTHIS_timeAccountService.ts
  
/supabase/functions/server/
  timeAccountCalculation.ts
  
/supabase/migrations/
  060_time_account_system.sql
  061_extend_time_sessions.sql
```

### **Neue Dateien Phase 2:**

```
/screens/admin/
  ShiftModelsScreen.tsx
  ShiftPlanningScreen.tsx
  ShiftSwapApprovalScreen.tsx
  
/screens/
  MyShiftsScreen.tsx
  
/components/
  HRTHIS_ShiftModelDialog.tsx
  HRTHIS_ShiftCalendar.tsx
  HRTHIS_ShiftSwapDialog.tsx
  
/hooks/
  HRTHIS_useShiftModels.ts
  HRTHIS_useShiftAssignments.ts
  HRTHIS_useShiftSwaps.ts
  
/services/
  HRTHIS_shiftPlanningService.ts
  
/supabase/migrations/
  062_shift_planning_system.sql
```

---

## 🎯 NÄCHSTE SCHRITTE - KONKRET

### **DIESE WOCHE (Woche 1):**

1. ✅ **DB-Schema erstellen**
   - `060_time_account_system.sql` schreiben
   - `061_extend_time_sessions.sql` schreiben
   - In Supabase ausführen
   - Testen

2. ✅ **Edge Function**
   - `timeAccountCalculation.ts` erstellen
   - Berechnungs-Logik implementieren
   - Deployen
   - Testen

3. ✅ **Hooks erstellen**
   - `HRTHIS_useTimeAccount.ts`
   - `HRTHIS_useTimeSessions.ts`

### **NÄCHSTE WOCHE (Woche 2):**

1. ✅ **TimesheetScreen UI**
   - Component erstellen
   - Stats Cards
   - Kalender-Integration

2. ✅ **Export-Funktion**
   - PDF-Generator (Edge Function)
   - Excel-Export

### **DANACH (Woche 3):**

1. ✅ **Zeitkorrektur-System**
2. ✅ **Admin-Approval-Screen**
3. ✅ **Testing & Bugfixes**

---

## 📊 SUCCESS METRICS

### **Phase 1 erfolgreich wenn:**
- ✅ Arbeitszeitkonto zeigt Soll/Ist/Saldo
- ✅ Überstunden werden korrekt berechnet
- ✅ Zeitkorrekturen können beantragt werden
- ✅ Export funktioniert (PDF + Excel)
- ✅ 100% der Zeit-Sessions berücksichtigt

### **Phase 2 erfolgreich wenn:**
- ✅ Schichtplan kann erstellt werden (Drag & Drop)
- ✅ Konflikte werden erkannt
- ✅ Schichttausch funktioniert
- ✅ User sehen ihre Schichten
- ✅ Integration mit Zeiterfassung funktioniert

### **Phase 3 erfolgreich wenn:**
- ✅ Lohnlauf funktioniert (Batch)
- ✅ PDF-Lohnabrechnung korrekt
- ✅ SV/Steuer automatisch berechnet
- ✅ Zuschläge aus Schichtplan übernommen
- ✅ Lohnhistorie vollständig

---

**BEREIT ZUM START! 🚀**

Sag Bescheid wenn ich mit Phase 1 anfangen soll!
