# HRthis Custom Hooks 🪝

Sammlung aller wiederverwendbaren Custom Hooks in HRthis.

---

## 📋 HOOKS OVERVIEW

### **UI Hooks**

#### `useInfoTooltip` ℹ️
Wiederverwendbarer Hook für Info-Tooltips mit Hover-Funktionalität.

**Location:** `/hooks/HRTHIS_useInfoTooltip.tsx`  
**Created:** v4.9.2 (2025-01-19)

**Basic Usage:**
```tsx
import { useInfoTooltip } from '../hooks/HRTHIS_useInfoTooltip';

function MyComponent() {
  const InfoTooltip = useInfoTooltip();
  
  return (
    <div>
      <InfoTooltip text="Deine Erklärung hier" />
    </div>
  );
}
```

**Advanced Usage:**
```tsx
// Custom blue tooltip
const InfoTooltipBlue = useInfoTooltip({ 
  iconColor: 'text-blue-500',
  iconSize: 'w-5 h-5'
});

// Position in Card (top-right)
<Card>
  <CardHeader className="relative">
    <CardTitle>Titel</CardTitle>
    <div className="absolute top-3 right-4">
      <InfoTooltipBlue text="Erklärung" />
    </div>
  </CardHeader>
</Card>
```

**Options:**
- `iconSize` - Icon-Größe (default: `'w-4 h-4'`)
- `iconColor` - Icon-Farbe (default: `'text-gray-400'`)
- `cursor` - Cursor-Style (default: `'cursor-help'`)

**Props:**
- `text` - Tooltip-Text (required)
- `className` - Zusätzliche CSS-Klassen
- `maxWidth` - Max-Width des Tooltips (default: `'max-w-xs'`)
- `side` - Position: `'top' | 'bottom' | 'left' | 'right'` (default: `'top'`)

---

#### `useTabRouting` 🔗
Automatisches Tab-zu-Route-Konvertierungs-System für dynamisches Tab-Routing.

**Location:** `/hooks/HRTHIS_useTabRouting.ts`  
**Created:** v4.10.16 (2025-01-21)

**Basic Usage:**
```tsx
import { useTabRouting, type TabConfig } from '../hooks/HRTHIS_useTabRouting';

const TABS: TabConfig[] = [
  { value: 'personal', label: 'Meine Personalakte', icon: User },
  { value: 'logs', label: 'Meine Logs', icon: Timer },
];

function MyComponent() {
  const { activeTab, changeTab } = useTabRouting(TABS, 'personal');
  
  return (
    <Tabs value={activeTab} onValueChange={changeTab}>
      <TabsTrigger value="personal">Meine Personalakte</TabsTrigger>
    </Tabs>
  );
}
```

**Features:**
- Automatische Konvertierung von Tab-Namen zu URL-sicheren Slugs
- Synchronisierung zwischen Tabs und URL Query-Parameters
- Deutsche Umlaute werden automatisch konvertiert (ä→ae, ö→oe, ü→ue)
- Beispiel: "Meine Personalakte" → `?tab=meinepersonalakte`

**Return Values:**
- `activeTab` - Aktuell aktiver Tab-Wert
- `changeTab(value)` - Funktion zum Wechseln des Tabs (aktualisiert automatisch URL)
- `getTabRoute(value)` - Gibt vollständige Route für einen Tab zurück
- `getTabSlug(value)` - Gibt nur den Slug für einen Tab zurück

---

#### `useNavRouting` 🧭
Automatisches Navigation-zu-Route-Konvertierungs-System für die Top Navigation Bar.

**Location:** `/hooks/HRTHIS_useNavRouting.ts`  
**Created:** v4.10.17 (2025-01-21)  
**Documentation:** `/docs/guides/NAV_ROUTING_SYSTEM_USAGE.md`

**Basic Usage:**
```tsx
import { useNavRouting, type NavItemConfig } from '../hooks/HRTHIS_useNavRouting';

const navConfigs: NavItemConfig[] = [
  { label: 'Dashboard', icon: User, badge: 5 },
  { label: 'Kalender', icon: Clock, customRoute: '/calendar' },
  { label: 'Lernen', icon: GraduationCap },
];

function MyLayout() {
  const { items, isActive } = useNavRouting(navConfigs);
  
  return (
    <nav>
      {items.map((item) => (
        <NavLink to={item.route} key={item.route}>
          <item.icon />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
```

**Features:**
- Automatische Konvertierung von Navigation-Labels zu URL-Routen
- Custom Routes für Backward Compatibility
- Badge-Support für Notification-Counts
- Role-Based Filtering
- Gleiche Konvertierungs-Logik wie `useTabRouting`
- Beispiel: "Dashboard" → `/dashboard`, "Meine Daten" → `/meinedaten`

**Return Values:**
- `items` - Verarbeitete Navigation-Items mit generierten Routes
- `isActive(route)` - Prüft ob eine Route aktiv ist
- `activeItem` - Aktuell aktives Navigation-Item
- `filterByRole(role)` - Filtert Items nach User-Rolle

**Conversion Examples:**
- "Dashboard" → `/dashboard`
- "Kalender" → `/kalender`
- "Meine Daten" → `/meinedaten`
- "Übersicht" → `/uebersicht` (ü→ue)

---

### **Business Logic Hooks**

#### `useTimeAccount`
Hook für Arbeitszeitkonto-Daten (Soll/Ist/Saldo/Überstunden).

**Location:** `/hooks/HRTHIS_useTimeAccount.ts`

---

#### `useTimeSessions`
Hook für Stempelzeiten und Sessions.

**Location:** `/hooks/HRTHIS_useTimeSessions.ts`

---

#### `useTimeTracking`
Hook für Clock In/Out Funktionalität.

**Location:** `/hooks/HRTHIS_useTimeTracking.ts`

---

#### `useNotifications`
Hook für Benachrichtigungen-System.

**Location:** `/hooks/HRTHIS_useNotifications.ts`

---

#### `useLearningScreen`
Hook für Learning-Screen-Logik.

**Location:** `/hooks/HRTHIS_useLearningScreen.ts`

---

#### `useCardEditing`
Hook für Card-Level Editing System.

**Location:** `/hooks/HRTHIS_useCardEditing.ts`

---

### **Data Management Hooks**

#### `useEmployeeFiltering`
Hook für Employee-Liste Filterung und Suche.

**Location:** `/hooks/HRTHIS_useEmployeeFiltering.ts`

---

#### `useFieldPermissions`
Hook für Feld-Permissions basierend auf User-Role.

**Location:** `/hooks/HRTHIS_useFieldPermissions.ts`

---

### **Utility Hooks**

#### `useMediaQuery`
Hook für responsive Breakpoints.

**Location:** `/hooks/useMediaQuery.ts`

---

#### `useThrottle`
Hook für Throttling von Funktionen.

**Location:** `/hooks/useThrottle.ts`

---

#### `useGermanHolidays`
Hook für deutsche Feiertage.

**Location:** `/hooks/useGermanHolidays.ts`

---

## 🎯 BEST PRACTICES

### **1. Naming Convention**
- HRthis-spezifische Hooks: `HRTHIS_use[Name].ts`
- Generische Utility-Hooks: `use[Name].ts`

### **2. File Location**
- Alle Hooks in `/hooks` Verzeichnis
- Keine Unterverzeichnisse (flat structure)

### **3. TypeScript**
- Immer typisiert
- Interfaces für Options und Return-Values
- JSDoc-Kommentare für Dokumentation

### **4. Dependencies**
- Alle Dependencies klar deklariert
- Cleanup in `useEffect` wenn nötig
- Memoization bei komplexen Berechnungen

---

## 📝 HOOK TEMPLATE

```tsx
/**
 * @file HRTHIS_useMyHook.ts
 * @description Kurze Beschreibung des Hooks
 * @created YYYY-MM-DD
 */

import { useState, useEffect } from 'react';

interface UseMyHookOptions {
  option1?: string;
  option2?: number;
}

interface UseMyHookReturn {
  data: any;
  loading: boolean;
  error: string | null;
}

/**
 * Hook-Beschreibung
 * 
 * @param options - Optionale Konfiguration
 * @returns Hook return values
 */
export function useMyHook(options: UseMyHookOptions = {}): UseMyHookReturn {
  const { option1, option2 } = options;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Implementation
    
    return () => {
      // Cleanup
    };
  }, [option1, option2]);
  
  return {
    data,
    loading,
    error
  };
}
```

---

## 🔗 VERWANDTE DOCS

- `/docs/refactoring/PHASE3_SERVICES_USAGE_GUIDE.md` - Service Layer
- `/types/schemas/` - TypeScript Schemas
- `/components/ui/` - ShadCN Components
