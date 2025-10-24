# 🟢 Team-Kalender mit Profilbildern - Implementation Complete

## ✅ **Was wurde implementiert?**

### **1. Team-Kalender mit Privacy-First Approach**
- 🔴 **Roter Ring** = Alle Abwesenheiten (Privacy-Schutz)
- Team sieht nur "Person ist weg", **NICHT den Grund** (Urlaub/Krank/Unbezahlt)
- Personal-Kalender behält detaillierte Farben (Grün/Blau/Lila/Rot)

### **2. Profilbild-Avatare mit Hover-Infos**
- Kleine Profilbilder (32px) im Kalender
- Roter Ring (ring-red-500) für alle Abwesenheits-Typen
- Bis zu 3 Profilbilder pro Tag, dann "+X" Badge
- **Hover zeigt:**
  - Großes Profilbild (64px)
  - Vorname, Nachname
  - Position (aus users.position)
  - Vertretung (primary_user_id aus Organigram)
  - Backup-Vertretung (backup_user_id aus Organigram)
  - Abteilungen (alle Departments wo User eingetragen ist)

### **3. Request Leave nur für sich selbst**
- RequestLeaveDialog: Nur für aktuell eingeloggten User
- Admin-Funktion: Neuer AdminRequestLeaveDialog
- Admins können Anträge für andere Mitarbeiter erstellen
- Auto-Approve Option für Admin-Requests

---

## 📦 **NEUE DATEIEN**

### **1. Hooks**

#### **A. `/hooks/useOrganigramUserInfo.ts`**
```typescript
useOrganigramUserInfo(userId: string)
```
**Funktion:**
- Holt alle Departments wo User primary/backup ist
- Gibt Position aus users.position zurück
- Findet Vertretung (primary_user_id aus erstem Department)
- Findet Backup-Vertretung (backup_user_id)

**Return:**
```typescript
{
  departments: Department[],
  coverageFor: Department[],
  position: string | null,
  primaryBackup: User | null,
  secondaryBackup: User | null,
  loading: boolean
}
```

#### **B. `/hooks/useTeamLeaves.ts`**
```typescript
useTeamLeaves(startDate: string, endDate: string)
```
**Funktion:**
- Lädt alle APPROVED Leave-Requests im Zeitraum
- Joined mit User-Daten für Profilbilder
- Nur genehmigte Requests (status='APPROVED')

**Return:**
```typescript
{
  leaves: LeaveRequestWithUser[],
  loading: boolean,
  refresh: () => void
}
```

#### **C. `/hooks/useCoverageChain.ts`** (Optional)
```typescript
useCoverageChain(userId: string)
```
**Funktion:**
- Berechnet Vertretungs-Kette
- Primary: Backup aus erstem Department
- Backup: Backup aus zweitem Department

**Return:**
```typescript
{
  primary: User | null,
  backup: User | null,
  departments: string[],
  loading: boolean
}
```

---

### **2. Components**

#### **A. `/components/TeamAbsenceAvatar.tsx`**
```typescript
<TeamAbsenceAvatar 
  user={user}
  size="sm" | "md" | "lg"
  showHover={true}
/>
```

**Features:**
- Profilbild mit rotem Ring
- HoverCard mit detaillierten Infos
- Responsive Größen (sm=32px, md=40px, lg=48px)
- Zeigt Vertretung und Backup an
- Zeigt alle Departments an

**Styling:**
```tsx
{/* Red ring */}
<div className="ring-2 ring-red-500 ring-offset-2"></div>

{/* Avatar mit Fallback */}
<Avatar>
  <AvatarImage src={user.profile_picture_url} />
  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600">
    {initials}
  </AvatarFallback>
</Avatar>
```

#### **B. `/components/AdminRequestLeaveDialog.tsx`**
```typescript
<AdminRequestLeaveDialog 
  open={open}
  onOpenChange={setOpen}
  onSuccess={() => refresh()}
/>
```

**Features:**
- Nur für ADMIN/HR/TEAMLEAD
- Erstellt Anträge für ANDERE Mitarbeiter
- User-Selector mit allen aktiven Mitarbeitern
- Auto-Approve Option (direkt als APPROVED erstellen)
- Gleiche Validierung wie normale Requests
- Quota-Check
- Sick-Note Upload

**Unterschied zu RequestLeaveDialog:**
| Feature | RequestLeaveDialog | AdminRequestLeaveDialog |
|---------|-------------------|------------------------|
| Für wen | Nur eigener User | Andere Mitarbeiter |
| User auswählen | ❌ Nein | ✅ Ja (Dropdown) |
| Auto-Approve | ❌ Nein | ✅ Optional |
| Wer darf nutzen | Alle | Nur ADMIN/HR/TEAMLEAD |

---

## 🎨 **KALENDER-ÄNDERUNGEN**

### **CalendarScreen.tsx - Updates**

#### **1. Import**
```typescript
import { TeamAbsenceAvatar } from '../components/TeamAbsenceAvatar';
```

#### **2. Legende - Team View**
```tsx
// ALT (mit farbigen Blöcken):
<div className="w-4 h-4 rounded bg-green-100"></div>
<span>Urlaub</span>

// NEU (mit rotem Ring):
<div className="w-6 h-6 rounded-full ring-2 ring-red-500 ring-offset-2 bg-gray-300"></div>
<span>Abwesenheit (Urlaub / Krank / Unbezahlt)</span>
<span className="text-xs italic">Hover über Profilbild für Details</span>
```

#### **3. Calendar Day - Team View**
```tsx
{/* ALT: Farbige Blöcke mit Namen */}
{hasLeaves && viewMode === 'team' && (
  <div className="bg-green-100">
    Max Mustermann
  </div>
)}

{/* NEU: Profilbilder mit rotem Ring */}
{hasLeaves && viewMode === 'team' && (
  <div className="flex items-center gap-1 flex-wrap">
    {dayLeaves.slice(0, 3).map((leave, idx) => {
      const user = users.find(u => u.id === leave.user_id);
      return (
        <TeamAbsenceAvatar
          key={idx}
          user={user}
          size="sm"
          showHover={true}
        />
      );
    })}
    {dayLeaves.length > 3 && (
      <div className="w-8 h-8 rounded-full bg-gray-200">
        +{dayLeaves.length - 3}
      </div>
    )}
  </div>
)}
```

#### **4. Personal View - Unverändert**
```tsx
{/* Personal View behält farbige Blöcke */}
{hasLeaves && viewMode === 'personal' && (
  <div className={getLeaveBlockColor(leave)}>
    {leave.type === 'VACATION' ? 'Urlaub' : 
     leave.type === 'SICK' ? 'Krankmeldung' :
     'Unbezahlte Abwesenheit'}
  </div>
)}
```

---

## 🔄 **REQUEST LEAVE DIALOG - ÄNDERUNGEN**

### **RequestLeaveDialog.tsx**

#### **Entfernt:**
```typescript
❌ Admin User-Selector
❌ setSelectedUserId State
❌ Admin-only Conditional
```

#### **Geändert:**
```typescript
// ALT:
const [selectedUserId, setSelectedUserId] = useState(profile?.id || '');

// NEU:
const selectedUserId = profile?.id || ''; // Konstante, kein State!
```

#### **Hinzugefügt:**
```tsx
{/* Info Alert */}
<Alert>
  <Info className="w-4 h-4" />
  <AlertDescription>
    Sie stellen einen Antrag für sich selbst. 
    Als Admin/HR können Sie Anträge für andere Mitarbeiter 
    im Admin-Bereich erstellen.
  </AlertDescription>
</Alert>
```

---

## 🎯 **VERWENDUNG**

### **1. Team-Kalender anzeigen**

**Schritt 1:** Gehe zu `/calendar`
**Schritt 2:** Wechsle zu "Team" Tab
**Schritt 3:** Profilbilder mit rotem Ring werden angezeigt

**Hover über Profilbild:**
```
┌──────────────────────────────┐
│  [Großes Profilbild 64px]    │
│                              │
│  Max Mustermann              │
│  Senior Developer            │
│  🔴 Abwesend                 │
│                              │
│  ─────────────────────────   │
│  Abteilungen                 │
│  [IT] [Marketing]            │
│                              │
│  ─────────────────────────   │
│  Vertretung                  │
│  👤 Anna Schmidt             │
│     Hauptvertretung          │
│  👤 Tom Meyer                │
│     Backup-Vertretung        │
└──────────────────────────────┘
```

---

### **2. Urlaubsantrag für sich selbst**

**Schritt 1:** Gehe zu `/time-and-leave`
**Schritt 2:** Klicke "Urlaub/Abwesenheit"
**Schritt 3:** Dialog öffnet sich - **nur für dich selbst**

**Info-Box:**
```
ℹ️ Sie stellen einen Antrag für sich selbst. 
   Als Admin/HR können Sie Anträge für andere Mitarbeiter 
   im Admin-Bereich erstellen.
```

---

### **3. Admin: Urlaubsantrag für Mitarbeiter erstellen**

**Option A: Neuer Button in TimeAndLeaveScreen (TODO)**
```tsx
{isAdmin && (
  <Button onClick={() => setAdminLeaveDialogOpen(true)}>
    <UserPlus className="w-4 h-4 mr-2" />
    Urlaub für Mitarbeiter erstellen
  </Button>
)}

<AdminRequestLeaveDialog
  open={adminLeaveDialogOpen}
  onOpenChange={setAdminLeaveDialogOpen}
  onSuccess={() => loadLeaveRequests()}
/>
```

**Option B: Integration in Team Management (TODO)**
```tsx
// In TeamMemberDetailsScreen.tsx
<Button onClick={() => setAdminLeaveDialogOpen(true)}>
  Urlaub erstellen
</Button>
```

**Dialog-Ablauf:**
1. Mitarbeiter auswählen (Dropdown)
2. Leave-Type wählen (VACATION/SICK/UNPAID_LEAVE)
3. Datum-Range wählen
4. **Auto-Approve Toggle:**
   - ✅ AN: Direkt als APPROVED erstellen
   - ❌ AUS: Als PENDING erstellen (normale Genehmigung)
5. Kommentar + Sick-Note (optional)
6. "Genehmigen & Erstellen" oder "Antrag erstellen"

---

## 📊 **DATENBANK-ABFRAGEN**

### **1. Organigram-Infos für User**
```typescript
// Get departments where user is primary or backup
const { data: departments } = await supabase
  .from('departments')
  .select('*')
  .or(`primary_user_id.eq.${userId},backup_user_id.eq.${userId}`)
  .eq('is_active', true);
```

### **2. Team-Leaves laden**
```typescript
// Get approved leaves in date range
const { data: leaves } = await supabase
  .from('leave_requests')
  .select('*')
  .eq('status', 'APPROVED')
  .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

// Join with users
const userIds = [...new Set(leaves.map(l => l.user_id))];
const { data: users } = await supabase
  .from('users')
  .select('id, first_name, last_name, position, profile_picture_url')
  .in('id', userIds);
```

### **3. Vertretungs-Kette**
```typescript
// Get coverage for user
const { data: department } = await supabase
  .from('departments')
  .select('primary_user_id, backup_user_id')
  .eq('primary_user_id', userId)
  .single();

// Fetch backup users
const { data: backupUsers } = await supabase
  .from('users')
  .select('*')
  .in('id', [department.backup_user_id]);
```

---

## 🎨 **STYLING**

### **Red Ring für Abwesenheit**
```css
/* Outer ring */
.ring-2 ring-red-500 ring-offset-2 ring-offset-white

/* Dark mode */
dark:ring-offset-gray-900
```

### **Avatar Größen**
```typescript
sm:  w-8 h-8   (32px)  // Kalender
md:  w-10 h-10 (40px)  // Default
lg:  w-12 h-12 (48px)  // Large

hover: w-16 h-16 (64px) // HoverCard
```

### **HoverCard Layout**
```tsx
<HoverCardContent className="w-80">
  {/* Header: Large Avatar + Name */}
  <div className="flex items-center gap-4">
    <Avatar className="w-16 h-16" />
    <div>
      <h4>Name</h4>
      <p>Position</p>
      <span>🔴 Abwesend</span>
    </div>
  </div>

  {/* Departments */}
  <div className="pt-3 border-t">
    <div className="flex gap-1.5">
      <Badge>IT</Badge>
      <Badge>Marketing</Badge>
    </div>
  </div>

  {/* Coverage */}
  <div className="pt-3 border-t">
    <div className="flex items-center gap-3">
      <Avatar className="w-8 h-8" />
      <div>
        <p>Anna Schmidt</p>
        <p className="text-xs">Hauptvertretung</p>
      </div>
    </div>
  </div>
</HoverCardContent>
```

---

## 🚀 **NÄCHSTE SCHRITTE (TODO)**

### **1. Integration in TimeAndLeaveScreen**
```tsx
// Neuer Button für Admins
{isAdmin && (
  <Button variant="outline" onClick={() => setAdminLeaveDialogOpen(true)}>
    <UserPlus className="w-4 h-4 mr-2" />
    Urlaub für Mitarbeiter erstellen
  </Button>
)}
```

### **2. Integration in TeamMemberDetailsScreen**
```tsx
// In User-Details-Page
<Card>
  <CardHeader>
    <CardTitle>Urlaub & Abwesenheit</CardTitle>
  </CardHeader>
  <CardContent>
    <Button onClick={() => setAdminLeaveDialogOpen(true)}>
      Urlaub erstellen
    </Button>
  </CardContent>
</Card>
```

### **3. Federal State aus Location**
```typescript
// TODO: Get federal state from user's location
const { data: location } = await supabase
  .from('locations')
  .select('federal_state')
  .eq('id', user.location_id)
  .single();

setFederalState(location.federal_state || 'NW');
```

### **4. Bulk-Abwesenheiten (Optional)**
```tsx
// Mehrere User gleichzeitig als abwesend markieren
<AdminBulkLeaveDialog
  selectedUserIds={selectedUsers}
  ...
/>
```

---

## 🐛 **BEKANNTE ISSUES**

### **Issue 1: Keine Vertretung hinterlegt**
**Problem:** User ist in keinem Department als primary/backup eingetragen
**Symptom:** Hover zeigt "Keine Vertretung im Organigram hinterlegt"
**Lösung:** User im Organigram eintragen (Department primary/backup setzen)

### **Issue 2: Profilbild fehlt**
**Problem:** User hat kein Profilbild hochgeladen
**Symptom:** Initialen werden angezeigt (Fallback)
**Lösung:** Normal - Fallback funktioniert korrekt

### **Issue 3: Position fehlt**
**Problem:** users.position ist NULL
**Symptom:** Position wird nicht im Hover angezeigt
**Lösung:** Position in User-Settings eintragen

---

## 📸 **SCREENSHOTS (Erwartete Ansichten)**

### **1. Team-Kalender**
```
Kalender - Team-Ansicht
┌─────────────────────────────────────┐
│ Legende:                            │
│ 🔴 Abwesenheit (Urlaub/Krank/...)  │
│ ℹ️  Hover über Profilbild für      │
│    Details & Vertretung             │
└─────────────────────────────────────┘

15. Oktober
┌──────────────┐
│ 👤 👤 👤 +2  │  ← Profilbilder mit rotem Ring
│              │
└──────────────┘
```

### **2. Hover-Card**
```
┌────────────────────────────────────┐
│  [Großes Profilbild mit rotem Ring]│
│                                    │
│  Max Mustermann                    │
│  Senior Developer                  │
│  🔴 Abwesend                       │
│                                    │
│  ──────────────────────────────    │
│  🏢 Abteilungen                    │
│  [IT] [Marketing] [Sales]          │
│                                    │
│  ──────────────────────────────    │
│  👥 Vertretung                     │
│  👤 Anna Schmidt                   │
│     Hauptvertretung                │
│  👤 Tom Meyer                      │
│     Backup-Vertretung              │
└────────────────────────────────────┘
```

### **3. Admin Leave Dialog**
```
┌──────────────────────────────────────┐
│ 👤 Urlaubsantrag für Mitarbeiter    │
│    erstellen                         │
├──────────────────────────────────────┤
│                                      │
│  Mitarbeiter *                       │
│  [Max Mustermann ▼]                  │
│                                      │
│  Art der Abwesenheit                 │
│  [☂️ Urlaub] [❤️ Krank] [📅 Unbez.]│
│                                      │
│  Startdatum        Enddatum          │
│  [15.10.2025]     [17.10.2025]       │
│                                      │
│  ☑️ Sofort genehmigen                │
│     Antrag wird direkt als           │
│     genehmigt erstellt               │
│                                      │
│  ────────────────────────────────    │
│  [Abbrechen] [Genehmigen & Erstellen]│
└──────────────────────────────────────┘
```

---

## ✨ **ZUSAMMENFASSUNG**

| Feature | Status | Details |
|---------|--------|---------|
| **Team-Kalender Profilbilder** | ✅ Implementiert | Red-Ring Avatare |
| **Hover-Infos** | ✅ Implementiert | Vertretung + Departments |
| **3 Hooks erstellt** | ✅ Implementiert | Organigram + Team Leaves + Coverage |
| **Privacy-First** | ✅ Implementiert | Roter Ring für alle Types |
| **RequestLeave nur für sich** | ✅ Implementiert | Kein User-Selector mehr |
| **Admin Leave Dialog** | ✅ Implementiert | Für andere Mitarbeiter |
| **Auto-Approve** | ✅ Implementiert | Admin kann direkt genehmigen |
| **Integration TimeAndLeave** | ⏳ TODO | Button hinzufügen |
| **Integration TeamDetails** | ⏳ TODO | Optional |

**Nächster Schritt:** Integration in TimeAndLeaveScreen mit Admin-Button! 🚀
