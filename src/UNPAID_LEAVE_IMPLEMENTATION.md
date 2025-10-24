# 🟣 Unbezahlte Abwesenheit - Implementation Complete

## ✅ Was wurde implementiert?

### **Neue Leave Type: UNPAID_LEAVE**
- 🟢 **VACATION** (Urlaub) = Grün
- 🔵 **SICK** (Krankmeldung) = Blau
- 🟣 **UNPAID_LEAVE** (Unbezahlte Abwesenheit) = Lila
- 🔴 **REJECTED Status** = Rot

---

## 📦 **1. DATABASE MIGRATION**

### **Migration 037: Add UNPAID_LEAVE Type**
**Datei:** `/supabase/migrations/037_add_unpaid_leave_type.sql`

```sql
-- Adds UNPAID_LEAVE to leave_type enum
ALTER TYPE leave_type ADD VALUE 'UNPAID_LEAVE';

-- Adds affects_payroll column for future payroll integration
ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS affects_payroll BOOLEAN DEFAULT true;
```

### **⚠️ WICHTIG: Migration ausführen!**

1. **Öffne** Supabase Dashboard → SQL Editor
2. **Kopiere** den Inhalt von `/supabase/migrations/037_add_unpaid_leave_type.sql`
3. **Führe aus** (RUN)
4. **Erwartete Ausgabe:**
   ```
   ✅ Migration 037 completed: UNPAID_LEAVE type added
   ```

---

## 🎨 **2. FARB-SCHEMA**

### **Kalender-Legende (Personal View)**
| Leave Type | Farbe | Hex | Tailwind Class |
|------------|-------|-----|----------------|
| VACATION (genehmigt) | 🟢 Grün | `#10b981` | `bg-green-100` |
| SICK | 🔵 Blau | `#3b82f6` | `bg-blue-100` |
| UNPAID_LEAVE | 🟣 Lila | `#a855f7` | `bg-purple-100` |
| PENDING Status | 🟡 Gelb | `#f59e0b` | `bg-yellow-100` |
| REJECTED Status | 🔴 Rot | `#ef4444` | `bg-red-100` |

### **Team View**
| Leave Type | Farbe | Icon |
|------------|-------|------|
| VACATION | 🟢 Grün | ☂️ Umbrella |
| SICK | 🔵 Blau | ❤️ Heart |
| UNPAID_LEAVE | 🟣 Lila | 📅 Calendar |

---

## 📝 **3. CODE-ÄNDERUNGEN**

### **A. Type Definition** ✅
**Datei:** `/types/database.ts`
```typescript
export type LeaveType = 'VACATION' | 'SICK' | 'UNPAID_LEAVE';
```

### **B. Request Leave Dialog** ✅
**Datei:** `/components/RequestLeaveDialog.tsx`
- 3-Spalten Grid statt 2-Spalten
- Neuer Button: "Unbezahlte Abwesenheit" mit Calendar-Icon
- Quota-Check nur für VACATION (UNPAID_LEAVE zählt NICHT zum Urlaubskontingent)

```tsx
<div className="grid grid-cols-3 gap-3">
  <Button onClick={() => setLeaveType('VACATION')}>
    <Umbrella className="w-6 h-6" />
    <span>Urlaub</span>
  </Button>
  <Button onClick={() => setLeaveType('SICK')}>
    <Heart className="w-6 h-6" />
    <span>Krankmeldung</span>
  </Button>
  <Button onClick={() => setLeaveType('UNPAID_LEAVE')}>
    <Calendar className="w-6 h-6" />
    <span>Unbezahlte Abwesenheit</span>
  </Button>
</div>
```

### **C. Kalender-Farben** ✅
**Datei:** `/screens/CalendarScreen.tsx`

**Funktion: `getLeaveBlockColor`**
```typescript
const getLeaveBlockColor = (leave: LeaveRequest) => {
  if (viewMode === 'personal') {
    if (leave.status === 'REJECTED') 
      return 'bg-red-100 border-red-300 text-red-700'; // Rot: Abgelehnt
    if (leave.status === 'PENDING') 
      return 'bg-yellow-100 border-yellow-300 text-yellow-700'; // Gelb: Ausstehend
    if (leave.type === 'VACATION' && leave.status === 'APPROVED') 
      return 'bg-green-100 border-green-300 text-green-700'; // Grün: Urlaub
    if (leave.type === 'SICK') 
      return 'bg-blue-100 border-blue-300 text-blue-700'; // Blau: Krank
    if (leave.type === 'UNPAID_LEAVE') 
      return 'bg-purple-100 border-purple-300 text-purple-700'; // Lila: Unbezahlt
  }
  // Team view...
};
```

**Funktion: `getLeaveIcon`**
```typescript
const getLeaveIcon = (leave: LeaveRequest) => {
  if (leave.type === 'VACATION') return <Umbrella className="w-3 h-3" />;
  if (leave.type === 'SICK') return <Heart className="w-3 h-3" />;
  if (leave.type === 'UNPAID_LEAVE') return <Calendar className="w-3 h-3" />;
  return <AlertCircle className="w-3 h-3" />;
};
```

**Legende aktualisiert:**
```tsx
<div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
<span>Urlaub genehmigt</span>

<div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
<span>Krankmeldung</span>

<div className="w-4 h-4 rounded bg-purple-100 border border-purple-300"></div>
<span>Unbezahlte Abwesenheit</span>

<div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
<span>Abgelehnt</span>
```

### **D. Personal Settings** ✅
**Datei:** `/components/PersonalSettings.tsx`
- Leave-Request Cards: Farben + Labels aktualisiert
- Statistik-Karten: Urlaubstage = Grün, Krankheitstage = Blau

---

## 🎯 **4. FUNKTIONALITÄT**

### **Urlaubskontingent**
- ✅ **VACATION**: Zählt gegen Urlaubskontingent
- ✅ **SICK**: Unbegrenzt (Hinweis ab 6 Wochen)
- ✅ **UNPAID_LEAVE**: Zählt NICHT gegen Urlaubskontingent

```typescript
// Quota-Check nur für VACATION
const isQuotaExceeded = 
  leaveType === 'VACATION' && quota && calculatedDays > quota.availableDays;
```

### **Genehmigung**
- Alle 3 Typen durchlaufen den gleichen Approval-Flow:
  - PENDING → APPROVED/REJECTED
  - Nur ADMIN/HR/TEAMLEAD können genehmigen

### **Kalender-Anzeige**
- **Personal View:**
  - Status-basierte Farben (REJECTED = Rot, PENDING = Gelb)
  - Typ-basierte Farben (VACATION = Grün, SICK = Blau, UNPAID = Lila)
- **Team View:**
  - Nur genehmigte Requests
  - Farbe nach Typ (VACATION = Grün, SICK = Blau, UNPAID = Lila)

---

## 🔮 **5. ZUKÜNFTIGE FEATURES (Vorbereitet)**

### **Payroll-Integration**
Die `affects_payroll` Spalte ist bereits angelegt:

```sql
affects_payroll BOOLEAN DEFAULT true
```

**Verwendung:**
- `affects_payroll = true`: Beeinflusst Gehalt (z.B. unbezahlter Urlaub)
- `affects_payroll = false`: Voll bezahlt (regulärer Urlaub, Krankengeld)

**Zukünftige Implementation:**
```typescript
// Payroll-Export
const unpaidDays = leaveRequests
  .filter(r => r.affects_payroll && r.status === 'APPROVED')
  .reduce((sum, r) => sum + r.total_days, 0);

const salaryDeduction = (unpaidDays / workingDaysPerMonth) * monthlySalary;
```

---

## 📊 **6. TEST-SZENARIOS**

### **Nach Migration testen:**

1. **Neuen Urlaubsantrag erstellen**
   - Gehe zu: `/time-and-leave` → "Urlaub/Abwesenheit"
   - Wähle: "Unbezahlte Abwesenheit"
   - Datum wählen → Absenden
   - ✅ Sollte **PENDING** sein mit **lila** Badge

2. **Kalender prüfen**
   - Gehe zu: `/calendar`
   - Persönliche Ansicht:
     - ✅ Urlaub genehmigt = Grün
     - ✅ Krankmeldung = Blau
     - ✅ Unbezahlte Abwesenheit = Lila
     - ✅ Abgelehnt = Rot
   - Team-Ansicht (als Admin):
     - ✅ Alle genehmigten Requests sichtbar

3. **Personal Settings**
   - Gehe zu: `/settings` → "Abwesenheiten"
   - ✅ Leave-Requests mit korrekten Farben
   - ✅ Statistik: Urlaubstage (Grün), Krankheitstage (Blau)

4. **Quota-Check**
   - Erstelle Urlaub (VACATION):
     - ✅ Quota wird abgezogen
   - Erstelle unbezahlten Urlaub (UNPAID_LEAVE):
     - ✅ Quota bleibt unverändert

---

## 🚀 **7. DEPLOYMENT CHECKLIST**

- [x] Migration 037 erstellt
- [x] Type Definition erweitert
- [x] Request Leave Dialog aktualisiert (3 Buttons)
- [x] Kalender-Farben angepasst
- [x] Personal Settings aktualisiert
- [x] Quota-Logic korrigiert
- [x] Legende aktualisiert
- [ ] **Migration in Supabase ausführen**
- [ ] Browser refreshen
- [ ] Test-Antrag erstellen
- [ ] Kalender-Farben verifizieren

---

## ❗ **WICHTIGE HINWEISE**

### **1. Migration ist ERFORDERLICH**
Ohne Migration 037 wird die App einen Fehler werfen:
```
Error: invalid input value for enum leave_type: "UNPAID_LEAVE"
```

### **2. Backwards Compatibility**
Alle bestehenden Leave-Requests (VACATION/SICK) funktionieren weiterhin.

### **3. Payroll-Spalte**
Die `affects_payroll` Spalte ist vorbereitet, wird aber noch NICHT aktiv genutzt.
Default-Wert: `true` (beeinflusst Gehalt).

### **4. Team Management**
ADMIN/HR/TEAMLEAD können unbezahlte Abwesenheit genehmigen wie regulären Urlaub.

---

## 📞 **SUPPORT**

Bei Fragen oder Problemen:
1. Check Supabase Logs: Dashboard → Database → Logs
2. Browser Console: F12 → Console
3. Verifiziere Migration: 
   ```sql
   SELECT enumlabel FROM pg_enum 
   WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'leave_type');
   ```
   Erwartete Ausgabe: `VACATION`, `SICK`, `UNPAID_LEAVE`

---

## ✨ **ZUSAMMENFASSUNG**

| Feature | Status | Details |
|---------|--------|---------|
| **UNPAID_LEAVE Type** | ✅ Implementiert | Datenbank + TypeScript |
| **3-Button Dialog** | ✅ Implementiert | Urlaub / Krank / Unbezahlt |
| **Kalender-Farben** | ✅ Implementiert | Grün / Blau / Lila / Rot |
| **Quota-Logic** | ✅ Implementiert | UNPAID zählt nicht |
| **Payroll-Vorbereitung** | ✅ Vorbereitet | affects_payroll Spalte |
| **Migration** | ⏳ Wartet auf Ausführung | Migration 037 |

**Nächster Schritt:** Migration ausführen und testen! 🚀
