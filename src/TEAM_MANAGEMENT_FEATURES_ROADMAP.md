# 🗺️ Team Management Features - Detaillierte Roadmap

## Übersicht

Diese Roadmap beschreibt die Implementation von 5 erweiterten Features für das Team-Management-System von HRthis.

**Features:**
1. 📊 Export-Funktion (CSV/Excel)
2. ✅ Bulk-Actions (Massenbearbeitung)
3. 🔄 Erweiterte Sortierung
4. 💾 Saved Searches (Gespeicherte Suchen)
5. ⚡ Quick Actions (Schnellaktionen)

---

## 1️⃣ Export-Funktion (CSV/Excel)

### 📋 Beschreibung
Exportiere die gefilterte/sortierte Mitarbeiterliste als CSV oder Excel-Datei mit allen relevanten Feldern.

### 🎯 Ziele
- Export als CSV (universell kompatibel)
- Export als XLSX (Excel mit Formatierung)
- Berücksichtigung aktiver Filter
- Auswahl von Export-Spalten
- Formatierte Daten (Datumsformate, Status-Texte)

### 🏗️ Technische Implementierung

#### Schritt 1: Utility-Funktion erstellen
**Datei:** `/utils/exportUtils.ts` (bereits vorhanden, erweitern)

```typescript
// Funktionen hinzufügen:
- exportToCSV(data, columns, filename)
- exportToExcel(data, columns, filename)
- formatUserDataForExport(users, locations, departments)
```

**Abhängigkeiten:**
- `xlsx` - für Excel-Export (npm package)
- Keine Migration nötig

#### Schritt 2: Export-Komponente erstellen
**Neue Datei:** `/components/ExportDialog.tsx`

**Features:**
- Dialog/Modal mit Export-Optionen
- Checkbox-Liste für Spaltenauswahl
- Format-Auswahl (CSV/Excel)
- Dateinamen-Eingabe
- Preview der ersten 5 Zeilen

**Props:**
```typescript
interface ExportDialogProps {
  data: User[];
  locations: Location[];
  departments: Department[];
  onExport: (format: 'csv' | 'excel', columns: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
}
```

#### Schritt 3: Integration in TeamManagementScreen
**Datei:** `/screens/admin/TeamManagementScreen.tsx`

**Änderungen:**
- Export-Button im Header hinzufügen
- State für Dialog-Verwaltung
- Export-Handler-Funktionen
- Toast-Benachrichtigungen bei Erfolg/Fehler

**UI-Position:**
```tsx
<div className="flex items-center justify-between">
  <div>...</div>
  <div className="flex gap-2">
    <Button onClick={handleExport}>
      <Download className="w-4 h-4 mr-2" />
      Exportieren
    </Button>
    <Button onClick={handleAddEmployee}>
      <Plus className="w-4 h-4 mr-2" />
      Mitarbeiter hinzufügen
    </Button>
  </div>
</div>
```

#### Schritt 4: Exportierbare Felder definieren
```typescript
const EXPORT_COLUMNS = [
  { key: 'employee_number', label: 'Personalnummer', default: true },
  { key: 'first_name', label: 'Vorname', default: true },
  { key: 'last_name', label: 'Nachname', default: true },
  { key: 'email', label: 'E-Mail (Arbeit)', default: true },
  { key: 'private_email', label: 'E-Mail (Privat)', default: false },
  { key: 'phone', label: 'Telefon', default: true },
  { key: 'position', label: 'Position', default: true },
  { key: 'department', label: 'Abteilung', default: true },
  { key: 'location', label: 'Standort', default: true },
  { key: 'employment_type', label: 'Beschäftigungsart', default: true },
  { key: 'weekly_hours', label: 'Wochenstunden', default: true },
  { key: 'vacation_days', label: 'Urlaubstage', default: true },
  { key: 'start_date', label: 'Eintrittsdatum', default: false },
  { key: 'role', label: 'Rolle', default: true },
  { key: 'is_active', label: 'Status', default: true },
  { key: 'street_address', label: 'Straße', default: false },
  { key: 'postal_code', label: 'PLZ', default: false },
  { key: 'city', label: 'Stadt', default: false },
  { key: 'shirt_size', label: 'T-Shirt Größe', default: false },
  { key: 'pants_size', label: 'Hosen Größe', default: false },
  { key: 'shoe_size', label: 'Schuh Größe', default: false },
  { key: 'jacket_size', label: 'Jacken Größe', default: false },
];
```

### 📦 Packages
```bash
npm install xlsx
```

### ⏱️ Aufwand
**2-3 Stunden**
- 1h: Utility-Funktionen + Excel-Integration
- 1h: ExportDialog-Komponente
- 0.5h: Integration + Testing

### ✅ Definition of Done
- [x] CSV-Export funktioniert
- [x] Excel-Export mit Formatierung
- [x] Spaltenauswahl möglich
- [x] Aktive Filter werden berücksichtigt
- [x] Dateinamen anpassbar
- [x] Toast-Benachrichtigungen
- [x] Mobile-responsive Dialog

---

## 2️⃣ Bulk-Actions (Massenbearbeitung)

### 📋 Beschreibung
Ermögliche das gleichzeitige Bearbeiten mehrerer Mitarbeiter (z.B. Abteilung ändern, Status setzen).

### 🎯 Ziele
- Checkbox-Auswahl für mehrere User
- "Alle auswählen" Funktionalität
- Massenaktionen: Status ändern, Abteilung ändern, Rolle ändern, Löschen
- Confirmation-Dialog für kritische Aktionen
- Undo-Funktionalität

### 🏗️ Technische Implementierung

#### Schritt 1: State Management erweitern
**Datei:** `/screens/admin/TeamManagementScreen.tsx`

```typescript
const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
const [bulkActionMode, setBulkActionMode] = useState(false);
const [showBulkDialog, setShowBulkDialog] = useState(false);
```

#### Schritt 2: Bulk-Actions-Komponente
**Neue Datei:** `/components/BulkActionsBar.tsx`

**Features:**
- Floating Action Bar am unteren Bildschirmrand
- Anzeige der Anzahl ausgewählter User
- Dropdown mit verfügbaren Aktionen
- "Auswahl aufheben" Button

```typescript
interface BulkActionsBarProps {
  selectedCount: number;
  onAction: (action: BulkActionType) => void;
  onClearSelection: () => void;
}

type BulkActionType = 
  | 'activate'
  | 'deactivate' 
  | 'change-department'
  | 'change-location'
  | 'change-role'
  | 'delete';
```

#### Schritt 3: Confirmation Dialog
**Neue Datei:** `/components/BulkActionDialog.tsx`

**Features:**
- Anzeige der betroffenen User
- Input-Felder für neue Werte (je nach Aktion)
- Warnungen bei kritischen Aktionen
- Fortschrittsanzeige während der Ausführung

#### Schritt 4: adminStore erweitern
**Datei:** `/stores/adminStore.ts`

```typescript
// Neue Funktionen hinzufügen:
bulkUpdateUsers: async (userIds: string[], updates: Partial<User>) => Promise<void>;
bulkActivateUsers: async (userIds: string[]) => Promise<void>;
bulkDeactivateUsers: async (userIds: string[]) => Promise<void>;
bulkDeleteUsers: async (userIds: string[]) => Promise<void>;
```

**Implementation:**
```typescript
bulkUpdateUsers: async (userIds, updates) => {
  set({ loading: true });
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .in('id', userIds)
      .select();

    if (error) throw error;

    // Update local state
    const { users } = get();
    set({
      users: users.map(u => 
        userIds.includes(u.id) ? { ...u, ...updates } : u
      )
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    throw error;
  } finally {
    set({ loading: false });
  }
}
```

#### Schritt 5: UI-Anpassungen TeamManagementScreen
**Änderungen:**
- Checkbox in jedem User-Card
- "Alle auswählen" Checkbox im Header
- Bulk-Mode Toggle-Button
- Conditional Rendering der Bulk-Bar

```tsx
{/* Bulk Selection Checkbox */}
{bulkActionMode && (
  <Checkbox
    checked={selectedUsers.includes(user.id)}
    onCheckedChange={(checked) => {
      if (checked) {
        setSelectedUsers([...selectedUsers, user.id]);
      } else {
        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
      }
    }}
    className="mr-4"
  />
)}
```

### 🗄️ Datenbank
Keine Änderungen erforderlich - nutzt existierende Tabellen.

### ⏱️ Aufwand
**4-5 Stunden**
- 1h: State Management + Selection Logic
- 1h: BulkActionsBar Komponente
- 1h: BulkActionDialog mit allen Actions
- 1h: adminStore Bulk-Funktionen
- 1h: Integration + Testing

### ✅ Definition of Done
- [x] User-Auswahl per Checkbox
- [x] "Alle auswählen" funktioniert
- [x] Bulk-Actions-Bar wird angezeigt
- [x] Mindestens 4 Bulk-Actions implementiert
- [x] Confirmation-Dialogs für kritische Aktionen
- [x] Loading-States während Ausführung
- [x] Erfolgs-/Fehler-Benachrichtigungen
- [x] State wird nach Aktion zurückgesetzt

---

## 3️⃣ Erweiterte Sortierung

### 📋 Beschreibung
Sortiere die Mitarbeiterliste nach verschiedenen Spalten (Name, Abteilung, Standort, etc.) aufsteigend/absteigend.

### 🎯 Ziele
- Click-to-Sort auf Spalten-Header
- Visuelle Sortier-Indikatoren (↑↓)
- Multi-Column-Sorting (Sekundär-Sortierung)
- Sortierung persistent (Local Storage)
- Sortierung kombiniert mit Filtern

### 🏗️ Technische Implementierung

#### Schritt 1: Sort State Management
**Datei:** `/screens/admin/TeamManagementScreen.tsx`

```typescript
interface SortConfig {
  key: SortableColumn;
  direction: 'asc' | 'desc';
}

type SortableColumn = 
  | 'first_name'
  | 'last_name'
  | 'employee_number'
  | 'department'
  | 'position'
  | 'location'
  | 'role'
  | 'start_date'
  | 'is_active';

const [sortConfig, setSortConfig] = useState<SortConfig>({
  key: 'first_name',
  direction: 'asc'
});
```

#### Schritt 2: Sort-Utility-Funktion
**Neue Funktion in TeamManagementScreen:**

```typescript
const sortUsers = (users: User[], config: SortConfig): User[] => {
  const sorted = [...users].sort((a, b) => {
    let aValue = a[config.key];
    let bValue = b[config.key];

    // Handle location sorting (needs lookup)
    if (config.key === 'location') {
      aValue = locations.find(l => l.id === a.location_id)?.name || '';
      bValue = locations.find(l => l.id === b.location_id)?.name || '';
    }

    // Handle boolean sorting
    if (typeof aValue === 'boolean') {
      aValue = aValue ? 1 : 0;
      bValue = bValue ? 1 : 0;
    }

    // String comparison
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) {
      return config.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return config.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return sorted;
};
```

#### Schritt 3: Sort Controls UI
**Neue Komponente:** `/components/SortControls.tsx`

```typescript
interface SortControlsProps {
  currentSort: SortConfig;
  onSortChange: (config: SortConfig) => void;
}

const SortControls = ({ currentSort, onSortChange }: SortControlsProps) => {
  return (
    <div className="flex items-center gap-2">
      <Label>Sortieren nach:</Label>
      <Select 
        value={currentSort.key} 
        onValueChange={(key) => onSortChange({ ...currentSort, key })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="first_name">Vorname</SelectItem>
          <SelectItem value="last_name">Nachname</SelectItem>
          <SelectItem value="employee_number">Personalnummer</SelectItem>
          <SelectItem value="department">Abteilung</SelectItem>
          <SelectItem value="position">Position</SelectItem>
          <SelectItem value="location">Standort</SelectItem>
          <SelectItem value="role">Rolle</SelectItem>
          <SelectItem value="start_date">Eintrittsdatum</SelectItem>
          <SelectItem value="is_active">Status</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onSortChange({
          ...currentSort,
          direction: currentSort.direction === 'asc' ? 'desc' : 'asc'
        })}
      >
        {currentSort.direction === 'asc' ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};
```

#### Schritt 4: Table View mit Sortier-Headern
**Alternative UI:** Table-Layout statt Card-Layout (Toggle)

**Neue Komponente:** `/components/TeamManagementTable.tsx`

```typescript
// Tabellen-Ansicht mit klickbaren Spalten-Headern
// Sortier-Indikatoren in Headern
// Responsive mit horizontalem Scroll
```

#### Schritt 5: Persistence mit Local Storage
**Funktion:**
```typescript
useEffect(() => {
  // Load sort config from localStorage
  const savedSort = localStorage.getItem('teamManagement_sortConfig');
  if (savedSort) {
    setSortConfig(JSON.parse(savedSort));
  }
}, []);

useEffect(() => {
  // Save sort config to localStorage
  localStorage.setItem('teamManagement_sortConfig', JSON.stringify(sortConfig));
}, [sortConfig]);
```

#### Schritt 6: Integration
**Datei:** `/screens/admin/TeamManagementScreen.tsx`

```typescript
// Nach Filtern, vor Render:
const sortedUsers = sortUsers(filteredUsers, sortConfig);

// In JSX:
<SortControls 
  currentSort={sortConfig}
  onSortChange={setSortConfig}
/>
```

### 🗄️ Datenbank
Keine Änderungen erforderlich.

### ⏱️ Aufwand
**3-4 Stunden**
- 1h: Sort-Logik + State Management
- 1h: SortControls Komponente
- 1h: Table-View (optional aber empfohlen)
- 0.5h: Local Storage Persistence
- 0.5h: Integration + Testing

### ✅ Definition of Done
- [x] Sortierung nach allen wichtigen Feldern
- [x] Aufsteigend/Absteigend Toggle
- [x] Visuelle Sortier-Indikatoren
- [x] Sortierung persistent (LocalStorage)
- [x] Kombiniert mit Filtern
- [x] Table-View optional verfügbar

---

## 4️⃣ Saved Searches (Gespeicherte Suchen)

### 📋 Beschreibung
Speichere häufig verwendete Such- und Filterkombinationen für schnellen Zugriff.

### 🎯 Ziele
- Suchen speichern mit Namen
- Gespeicherte Suchen anzeigen (Sidebar/Dropdown)
- Quick-Load von gespeicherten Suchen
- Teilen von Suchen (JSON Export/Import)
- Pro User oder Global (Admin)

### 🏗️ Technische Implementierung

#### Schritt 1: Datenbank-Migration
**Neue Datei:** `/supabase/migrations/025_saved_searches.sql`

```sql
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  search_config JSONB NOT NULL,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX idx_saved_searches_is_global ON saved_searches(is_global);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved searches"
  ON saved_searches FOR SELECT
  USING (user_id = auth.uid() OR is_global = true);

CREATE POLICY "Users can insert their own saved searches"
  ON saved_searches FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own saved searches"
  ON saved_searches FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own saved searches"
  ON saved_searches FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can create global saved searches"
  ON saved_searches FOR INSERT
  WITH CHECK (
    is_global = true AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPERADMIN')
    )
  );
```

**Copy-Paste-Datei:** `/SQL_SAVED_SEARCHES_MIGRATION.md`

#### Schritt 2: Type Definition
**Datei:** `/types/database.ts`

```typescript
export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  search_config: SearchConfig;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export interface SearchConfig {
  searchQuery: string;
  statusFilter: 'all' | 'active' | 'inactive';
  roleFilter: string;
  departmentFilter: string;
  locationFilter: string;
  sortConfig?: {
    key: string;
    direction: 'asc' | 'desc';
  };
}
```

#### Schritt 3: adminStore erweitern
**Datei:** `/stores/adminStore.ts`

```typescript
interface AdminState {
  // ... existing state
  savedSearches: SavedSearch[];
  
  // Saved Searches Management
  loadSavedSearches: () => Promise<void>;
  createSavedSearch: (name: string, description: string, config: SearchConfig, isGlobal: boolean) => Promise<void>;
  updateSavedSearch: (searchId: string, updates: Partial<SavedSearch>) => Promise<void>;
  deleteSavedSearch: (searchId: string) => Promise<void>;
}

// Implementierung:
loadSavedSearches: async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .or(`user_id.eq.${user.id},is_global.eq.true`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    set({ savedSearches: data || [] });
  } catch (error) {
    console.error('Load saved searches error:', error);
  }
},

createSavedSearch: async (name, description, config, isGlobal) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('saved_searches')
      .insert({
        user_id: user.id,
        name,
        description,
        search_config: config,
        is_global: isGlobal,
      })
      .select()
      .single();

    if (error) throw error;

    const { savedSearches } = get();
    set({ savedSearches: [data, ...savedSearches] });
  } catch (error) {
    console.error('Create saved search error:', error);
    throw error;
  }
},
```

#### Schritt 4: Saved Searches UI
**Neue Komponente:** `/components/SavedSearchesPanel.tsx`

```typescript
interface SavedSearchesPanelProps {
  savedSearches: SavedSearch[];
  onLoadSearch: (config: SearchConfig) => void;
  onDeleteSearch: (searchId: string) => void;
  currentConfig: SearchConfig;
  onSaveSearch: (name: string, description: string) => void;
}

const SavedSearchesPanel = ({ ... }: SavedSearchesPanelProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gespeicherte Suchen</CardTitle>
          <Button onClick={handleOpenSaveDialog}>
            <Bookmark className="w-4 h-4 mr-2" />
            Speichern
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {savedSearches.map((search) => (
            <div key={search.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex-1 cursor-pointer" onClick={() => onLoadSearch(search.search_config)}>
                <p className="font-medium">{search.name}</p>
                {search.description && (
                  <p className="text-sm text-gray-500">{search.description}</p>
                )}
                {search.is_global && (
                  <Badge variant="outline" className="mt-1">Global</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteSearch(search.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

#### Schritt 5: Save Search Dialog
**Neue Komponente:** `/components/SaveSearchDialog.tsx`

```typescript
interface SaveSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, isGlobal: boolean) => void;
  isAdmin: boolean;
}

// Dialog mit:
// - Name input (required)
// - Description textarea (optional)
// - "Als globale Suche speichern" checkbox (nur für Admins)
// - Save + Cancel buttons
```

#### Schritt 6: Integration
**Datei:** `/screens/admin/TeamManagementScreen.tsx`

```typescript
const [showSavedSearches, setShowSavedSearches] = useState(false);
const { savedSearches, loadSavedSearches, createSavedSearch, deleteSavedSearch } = useAdminStore();

useEffect(() => {
  loadSavedSearches();
}, []);

const handleLoadSearch = (config: SearchConfig) => {
  setSearchQuery(config.searchQuery);
  setStatusFilter(config.statusFilter);
  setRoleFilter(config.roleFilter);
  setDepartmentFilter(config.departmentFilter);
  setLocationFilter(config.locationFilter);
  if (config.sortConfig) {
    setSortConfig(config.sortConfig);
  }
};

const handleSaveSearch = async (name: string, description: string, isGlobal: boolean) => {
  const config: SearchConfig = {
    searchQuery,
    statusFilter,
    roleFilter,
    departmentFilter,
    locationFilter,
    sortConfig,
  };
  
  await createSavedSearch(name, description, config, isGlobal);
  toast.success('Suche gespeichert!');
};
```

### 📦 Packages
Keine neuen Packages erforderlich.

### ⏱️ Aufwand
**4-5 Stunden**
- 0.5h: Datenbank-Migration
- 1h: adminStore Funktionen
- 1.5h: SavedSearchesPanel Komponente
- 1h: SaveSearchDialog
- 1h: Integration + Testing

### ✅ Definition of Done
- [x] Datenbank-Tabelle erstellt
- [x] Suchen speichern funktioniert
- [x] Gespeicherte Suchen anzeigen
- [x] Quick-Load funktioniert
- [x] Löschen möglich
- [x] Admin kann globale Suchen erstellen
- [x] Responsive UI

---

## 5️⃣ Quick Actions (Schnellaktionen)

### 📋 Beschreibung
Direkte Aktionen auf Mitarbeiter-Karten ohne Detailseite zu öffnen (E-Mail, Anrufen, Dokumente, etc.).

### 🎯 Ziele
- E-Mail senden (mailto:)
- Anrufen (tel:)
- WhatsApp öffnen
- Dokument hochladen
- Quick Edit (Position, Abteilung)
- Avatar anzeigen
- Notiz hinzufügen

### 🏗️ Technische Implementierung

#### Schritt 1: Quick Actions Menu
**Neue Komponente:** `/components/QuickActionsMenu.tsx`

```typescript
interface QuickActionsMenuProps {
  user: User;
  onAction: (action: QuickActionType, user: User) => void;
}

type QuickActionType = 
  | 'email'
  | 'call'
  | 'whatsapp'
  | 'upload-document'
  | 'quick-edit'
  | 'view-avatar'
  | 'add-note'
  | 'view-documents'
  | 'view-leave'
  | 'award-coins';

const QuickActionsMenu = ({ user, onAction }: QuickActionsMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => window.location.href = `mailto:${user.email}`}>
          <Mail className="w-4 h-4 mr-2" />
          E-Mail senden
        </DropdownMenuItem>
        
        {user.phone && (
          <>
            <DropdownMenuItem onClick={() => window.location.href = `tel:${user.phone}`}>
              <Phone className="w-4 h-4 mr-2" />
              Anrufen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(`https://wa.me/${user.phone.replace(/\D/g, '')}`, '_blank')}>
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => onAction('upload-document', user)}>
          <Upload className="w-4 h-4 mr-2" />
          Dokument hochladen
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => onAction('quick-edit', user)}>
          <Edit className="w-4 h-4 mr-2" />
          Schnellbearbeitung
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => onAction('view-avatar', user)}>
          <User className="w-4 h-4 mr-2" />
          Avatar anzeigen
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => onAction('add-note', user)}>
          <FileText className="w-4 h-4 mr-2" />
          Notiz hinzufügen
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => onAction('award-coins', user)}>
          <Coins className="w-4 h-4 mr-2" />
          Coins vergeben
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate(`/admin/team-management/user/${user.id}`)}>
          <ArrowRight className="w-4 h-4 mr-2" />
          Details öffnen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

#### Schritt 2: Quick Edit Dialog
**Neue Komponente:** `/components/QuickEditDialog.tsx`

```typescript
interface QuickEditDialogProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, updates: Partial<User>) => void;
  departments: Department[];
  locations: Location[];
}

// Dialog mit häufig editierten Feldern:
// - Position
// - Abteilung (Dropdown)
// - Standort (Dropdown)
// - Wochenstunden
// - Urlaubstage
// - Status (Aktiv/Inaktiv)
```

#### Schritt 3: Document Upload Dialog
**Neue Komponente:** `/components/QuickUploadDocumentDialog.tsx`

```typescript
interface QuickUploadDocumentDialogProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpload: (userId: string, file: File, category: DocumentCategory, title: string) => void;
}

// Dialog für schnelles Dokument-Upload:
// - File Picker
// - Kategorie (Dropdown: LOHN, VERTRAG, SONSTIGES)
// - Titel (Input)
// - Upload Button mit Progress
```

#### Schritt 4: Add Note Dialog
**Neue Komponente:** `/components/QuickNoteDialog.tsx`

```typescript
// Einfacher Dialog für Notizen/Kommentare
// Speichert in separater notes Tabelle (neue Migration)
```

**Datenbank-Migration:** `/supabase/migrations/026_user_notes.sql`

```sql
CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX idx_user_notes_author_id ON user_notes(author_id);

ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all notes"
  ON user_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPERADMIN')
    )
  );

CREATE POLICY "Admins can create notes"
  ON user_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPERADMIN')
    )
  );
```

#### Schritt 5: Award Coins Dialog
**Neue Komponente:** `/components/QuickAwardCoinsDialog.tsx`

```typescript
// Dialog für schnelles Coins vergeben:
// - Amount Input (Slider oder Number)
// - Reason Textarea
// - Award Button
// Nutzt existierende adminStore.awardCoins() Funktion
```

#### Schritt 6: Integration in TeamManagementScreen
**Datei:** `/screens/admin/TeamManagementScreen.tsx`

```typescript
// State für Dialogs
const [quickEditUser, setQuickEditUser] = useState<User | null>(null);
const [quickUploadUser, setQuickUploadUser] = useState<User | null>(null);
const [quickNoteUser, setQuickNoteUser] = useState<User | null>(null);
const [quickAwardUser, setQuickAwardUser] = useState<User | null>(null);

// Handler
const handleQuickAction = (action: QuickActionType, user: User) => {
  switch (action) {
    case 'upload-document':
      setQuickUploadUser(user);
      break;
    case 'quick-edit':
      setQuickEditUser(user);
      break;
    case 'add-note':
      setQuickNoteUser(user);
      break;
    case 'award-coins':
      setQuickAwardUser(user);
      break;
    // ... etc
  }
};

// In User Card JSX:
<QuickActionsMenu 
  user={user} 
  onAction={handleQuickAction}
/>
```

### 🗄️ Datenbank
**Neue Migration:** `026_user_notes.sql`

### ⏱️ Aufwand
**5-6 Stunden**
- 1h: QuickActionsMenu Komponente
- 1h: QuickEditDialog
- 1h: QuickUploadDocumentDialog
- 1h: QuickNoteDialog + Migration
- 1h: QuickAwardCoinsDialog
- 1h: Integration + Testing

### ✅ Definition of Done
- [x] Quick Actions Menu in User Cards
- [x] E-Mail/Call/WhatsApp Links funktionieren
- [x] Quick Edit Dialog funktioniert
- [x] Document Upload Quick Action
- [x] Notes System implementiert
- [x] Coins Quick Award
- [x] Alle Actions loggen Erfolg/Fehler
- [x] Mobile-optimiert

---

## 📊 Gesamtübersicht

### Implementierungs-Reihenfolge (Empfohlen)

1. **Erweiterte Sortierung** (3-4h)
   - Grund: Standalone, keine Dependencies, sofortiger Mehrwert

2. **Export-Funktion** (2-3h)
   - Grund: Nutzt sortierte/gefilterte Daten, hoher Business-Value

3. **Quick Actions** (5-6h)
   - Grund: UX-Verbesserung, Independent Implementation

4. **Saved Searches** (4-5h)
   - Grund: Nutzt bestehende Filter/Sort-Logik

5. **Bulk-Actions** (4-5h)
   - Grund: Komplex, braucht alle anderen Features zur optimalen Nutzung

### Gesamt-Aufwand
**18-23 Stunden** (ca. 3-4 Arbeitstage)

### Technologie-Stack

**Frontend:**
- React + TypeScript
- Zustand (State Management)
- shadcn/ui (UI Components)
- TailwindCSS
- xlsx (Excel Export)

**Backend:**
- Supabase (PostgreSQL)
- Row Level Security
- Supabase Storage (Dokumente)

**No External APIs needed**

### Migrations Übersicht

1. `025_saved_searches.sql` - Saved Searches Feature
2. `026_user_notes.sql` - Notes System für Quick Actions

---

## 🎯 Quick Start Guide

### Um zu starten:

1. **Wähle ein Feature** aus der Liste
2. **Führe ggf. Migrationen aus** (SQL-Dateien bereitstellen)
3. **Erstelle neue Komponenten** wie beschrieben
4. **Erweitere adminStore** mit neuen Funktionen
5. **Integriere in TeamManagementScreen**
6. **Teste alle Edge Cases**

### Nächste Schritte:

Welches Feature soll ich als erstes implementieren?
- [ ] Erweiterte Sortierung
- [ ] Export-Funktion
- [ ] Quick Actions
- [ ] Saved Searches
- [ ] Bulk-Actions

Oder sollen wir alle 5 Features in der empfohlenen Reihenfolge durchgehen?