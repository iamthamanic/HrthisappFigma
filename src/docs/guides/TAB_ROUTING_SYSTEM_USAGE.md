# Tab-Routing System - Verwendungsanleitung 🔗

**Version:** v4.10.16  
**Hook:** `useTabRouting`  
**Status:** ✅ Production Ready

---

## 📚 SCHNELLSTART

### 1. Hook importieren

```tsx
import { useTabRouting, type TabConfig } from '../hooks/HRTHIS_useTabRouting';
```

### 2. Tabs konfigurieren

```tsx
const TABS: TabConfig[] = [
  { 
    value: 'tab1',              // Interner Wert (für <Tabs> component)
    label: 'Mein Tab Name',     // Anzeige-Name → wird zu Slug
    icon: IconComponent,        // Optional
    mobileLabel: 'Kurz'        // Optional: Mobile Version
  },
  { 
    value: 'tab2', 
    label: 'Zweiter Tab',
    icon: AnotherIcon
  },
];
```

### 3. Hook verwenden

```tsx
function MyScreen() {
  const { activeTab, changeTab } = useTabRouting(TABS, 'tab1');
  
  return (
    <Tabs value={activeTab} onValueChange={changeTab}>
      <TabsList>
        {TABS.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.icon && <tab.icon />}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      
      <TabsContent value="tab1">
        {/* Content */}
      </TabsContent>
    </Tabs>
  );
}
```

---

## 🎯 VOLLSTÄNDIGES BEISPIEL

```tsx
/**
 * Example: Team Member Details Screen mit Tab-Routing
 */
import { useTabRouting, type TabConfig } from '../hooks/HRTHIS_useTabRouting';
import { User, BookOpen, Activity } from '../components/icons/HRTHISIcons';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

const MEMBER_TABS: TabConfig[] = [
  { 
    value: 'personal', 
    label: 'Personalakte',
    mobileLabel: 'Profil',
    icon: User
  },
  { 
    value: 'learning', 
    label: 'Lernfortschritt',
    mobileLabel: 'Lernen',
    icon: BookOpen
  },
  { 
    value: 'activity', 
    label: 'Aktivitäten',
    mobileLabel: 'Logs',
    icon: Activity
  },
];

export default function TeamMemberDetailsScreen() {
  const { activeTab, changeTab, getTabRoute } = useTabRouting(
    MEMBER_TABS, 
    'personal'  // Default Tab
  );

  return (
    <div>
      <Tabs value={activeTab} onValueChange={changeTab}>
        <TabsList className="grid w-full grid-cols-3">
          {MEMBER_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value}>
                {Icon && <Icon className="w-4 h-4 mr-2" />}
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.mobileLabel}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="personal">
          <h2>Personalakte Content</h2>
          {/* ... */}
        </TabsContent>

        <TabsContent value="learning">
          <h2>Lernfortschritt Content</h2>
          {/* ... */}
        </TabsContent>

        <TabsContent value="activity">
          <h2>Aktivitäten Content</h2>
          {/* ... */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Resultierende URLs:**
```
/admin/team-management/user/123?tab=personalakte
/admin/team-management/user/123?tab=lernfortschritt
/admin/team-management/user/123?tab=aktivitaeten
```

---

## 🔄 SLUG-KONVERTIERUNG

Der Hook konvertiert automatisch Tab-Namen zu URL-sicheren Slugs:

### Deutsche Umlaute:
```
"Meine Personalakte"    → "meinepersonalakte"
"Über uns"              → "ueberuns"
"Größe"                 → "groesse"
"Führerschein"          → "fuehrerschein"
```

### Sonderzeichen:
```
"Meine Berechtigungen"  → "meineberechtigungen"
"Zeit & Anwesenheit"    → "zeitanwesenheit"
"Dokumente/Verträge"    → "dokumentevertraege"
```

### Leerzeichen:
```
"Meine Logs"           → "meinelogs"
"Personal Daten"       → "personaldaten"
```

---

## 📡 API REFERENZ

### `useTabRouting(tabs, defaultTab)`

**Parameter:**
- `tabs: TabConfig[]` - Array von Tab-Konfigurationen
- `defaultTab: string` - Standard-Tab (value), falls keine URL-Parameter vorhanden

**Return Values:**
```tsx
{
  activeTab: string;                        // Aktuell aktiver Tab
  changeTab: (value: string) => void;       // Tab wechseln (aktualisiert URL)
  getTabRoute: (value: string) => string;   // Vollständige Route für Tab
  getTabSlug: (value: string) => string;    // Nur Slug für Tab
}
```

### `TabConfig` Interface

```tsx
interface TabConfig {
  value: string;           // REQUIRED: Interner Wert
  label: string;           // REQUIRED: Anzeige-Name (wird zu Slug)
  icon?: React.ComponentType<any>;  // OPTIONAL: Icon Component
  mobileLabel?: string;    // OPTIONAL: Mobile Label
}
```

---

## 🎨 VERWENDUNGS-PATTERNS

### Pattern 1: Mit Icons

```tsx
const TABS: TabConfig[] = [
  { value: 'overview', label: 'Übersicht', icon: LayoutDashboard },
  { value: 'details', label: 'Details', icon: FileText },
  { value: 'settings', label: 'Einstellungen', icon: Settings },
];

// In JSX:
<TabsTrigger value={tab.value}>
  {tab.icon && <tab.icon className="w-4 h-4 mr-2" />}
  {tab.label}
</TabsTrigger>
```

### Pattern 2: Responsive Labels

```tsx
const TABS: TabConfig[] = [
  { 
    value: 'personal', 
    label: 'Meine Personalakte',
    mobileLabel: 'Profil'  // Kurze Version für Mobile
  },
];

// In JSX:
<TabsTrigger value={tab.value}>
  <span className="hidden md:inline">{tab.label}</span>
  <span className="md:hidden">{tab.mobileLabel}</span>
</TabsTrigger>
```

### Pattern 3: Externe Links zu spezifischen Tabs

```tsx
function MyComponent() {
  const { getTabRoute } = useTabRouting(TABS, 'default');
  
  // Link zu spezifischem Tab generieren
  const learningTabLink = getTabRoute('learning');
  
  return (
    <Link to={learningTabLink}>
      Zum Lernfortschritt
    </Link>
  );
}
```

### Pattern 4: Programmatischer Tab-Wechsel

```tsx
function MyComponent() {
  const { changeTab } = useTabRouting(TABS, 'default');
  
  const handleAction = () => {
    // Nach Aktion zu anderem Tab wechseln
    changeTab('results');
  };
  
  return (
    <Button onClick={handleAction}>
      Zeige Ergebnisse
    </Button>
  );
}
```

---

## ⚠️ WICHTIGE HINWEISE

### 1. Tab Values müssen unique sein

```tsx
// ❌ FALSCH:
const TABS = [
  { value: 'tab', label: 'Tab 1' },
  { value: 'tab', label: 'Tab 2' },  // Duplikat!
];

// ✅ RICHTIG:
const TABS = [
  { value: 'tab1', label: 'Tab 1' },
  { value: 'tab2', label: 'Tab 2' },
];
```

### 2. Labels können gleich sein (Slugs werden unique gemacht)

```tsx
// ✅ OK - Verschiedene values:
const TABS = [
  { value: 'logs1', label: 'Meine Logs' },
  { value: 'logs2', label: 'Meine Logs' },  // Gleicher Label, verschiedener value
];
// URLs: ?tab=meinelogs (erste) vs ?tab=meinelogs (zweite)
// Hook verwendet 'value' für Unterscheidung!
```

### 3. Browser History

Der Hook verwendet `navigate(..., { replace: true })` um die Browser-History nicht zu verschmutzen:

```tsx
// Bei Tab-Wechsel:
// Tab 1 → Tab 2 → Tab 3
// Back-Button geht direkt zur vorherigen Seite, nicht zum vorherigen Tab
```

Falls du willst, dass jeder Tab-Wechsel einen History-Eintrag erstellt:

```tsx
// In useTabRouting Hook ändern:
navigate({
  pathname: location.pathname,
  search: `?${newSearchParams.toString()}`
});  // Entferne { replace: true }
```

---

## 🧪 TESTING

### Unit Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

test('Tab-Routing wechselt URL', () => {
  render(
    <BrowserRouter>
      <MyScreenWithTabs />
    </BrowserRouter>
  );
  
  // Click auf Tab
  fireEvent.click(screen.getByText('Zweiter Tab'));
  
  // Prüfe URL
  expect(window.location.search).toBe('?tab=zweitertab');
});
```

### Manual Testing Checklist

- [ ] Standard-Tab lädt korrekt
- [ ] Tab-Wechsel funktioniert
- [ ] URL ändert sich beim Tab-Wechsel
- [ ] URL-Parameter wird beim Reload respektiert
- [ ] Deeplink zu spezifischem Tab funktioniert
- [ ] Browser-Back/Forward-Buttons funktionieren
- [ ] Mobile responsive Labels werden angezeigt

---

## 🚀 BEST PRACTICES

### 1. Tab-Konfiguration auslagern

```tsx
// tabs.config.ts
export const MEMBER_TABS: TabConfig[] = [
  { value: 'personal', label: 'Personalakte' },
  // ...
];

// screen.tsx
import { MEMBER_TABS } from './tabs.config';
```

### 2. Konstanten für Tab-Values

```tsx
const TAB_VALUES = {
  PERSONAL: 'personal',
  LEARNING: 'learning',
  ACTIVITY: 'activity',
} as const;

const TABS: TabConfig[] = [
  { value: TAB_VALUES.PERSONAL, label: 'Personalakte' },
  { value: TAB_VALUES.LEARNING, label: 'Lernfortschritt' },
  { value: TAB_VALUES.ACTIVITY, label: 'Aktivitäten' },
];

// Verwendung:
changeTab(TAB_VALUES.LEARNING);
```

### 3. TypeScript Enums (Alternative)

```tsx
enum TabValue {
  Personal = 'personal',
  Learning = 'learning',
  Activity = 'activity',
}

const TABS: TabConfig[] = [
  { value: TabValue.Personal, label: 'Personalakte' },
  // ...
];
```

---

## 🔧 TROUBLESHOOTING

### Problem: Tab ändert sich nicht

**Lösung:** Prüfe, ob `onValueChange` korrekt gesetzt ist:
```tsx
<Tabs value={activeTab} onValueChange={changeTab}>
  {/* ✅ changeTab muss übergeben werden */}
</Tabs>
```

### Problem: URL ändert sich, aber Tab nicht

**Lösung:** Stelle sicher, dass Tab `value` mit `TabConfig.value` übereinstimmt:
```tsx
const TABS = [{ value: 'personal', label: 'Personalakte' }];

// ✅ RICHTIG:
<TabsContent value="personal">...</TabsContent>

// ❌ FALSCH:
<TabsContent value="personalakte">...</TabsContent>
```

### Problem: Deutsche Umlaute in URL

**Lösung:** Der Hook konvertiert automatisch - das ist erwartetes Verhalten!
```
"Über uns" → "ueberuns"  // ✅ Korrekt!
```

---

## 📚 REFERENZ-IMPLEMENTIERUNG

Siehe vollständige Implementierung in:
- `/components/MeineDaten.tsx` - Produktions-Beispiel
- `/hooks/HRTHIS_useTabRouting.ts` - Hook Source Code

---

## 🎉 FAZIT

Mit `useTabRouting` kannst du in 3 Schritten Tab-Routing implementieren:

1. **Tabs konfigurieren** → `TabConfig[]` Array
2. **Hook verwenden** → `useTabRouting(TABS, defaultTab)`
3. **In Tabs integrieren** → `value={activeTab} onValueChange={changeTab}`

**Fertig!** 🚀

Automatisches URL-Routing, Deep-Links, und Browser-History - alles inklusive!
