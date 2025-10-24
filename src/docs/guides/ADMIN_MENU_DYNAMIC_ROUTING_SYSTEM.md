# Admin Menu Dynamic Routing System

**Version:** v4.10.18  
**Status:** ✅ Complete  
**Hook:** `HRTHIS_useAdminMenuRouting.ts`

## 📋 Übersicht

Das Admin Menu Dynamic Routing System generiert automatisch URL-sichere Routen aus den Admin-Menu-Labels. Neue Admin-Tabs können einfach hinzugefügt werden, ohne dass manuell Routen konfiguriert werden müssen.

## 🎯 Vorteile

- ✅ **Automatische Route-Generierung** aus Labels
- ✅ **Konsistente Namenskonvention** in der gesamten App
- ✅ **Einfaches Hinzufügen neuer Tabs** ohne Route-Konfiguration
- ✅ **Backward Compatibility** durch Legacy-Route-Support
- ✅ **Deutsche Umlaute** werden automatisch konvertiert
- ✅ **Rolle-basierte Filterung** möglich

## 🚀 Verwendung

### Admin Menu Konfiguration

```tsx
import { useAdminMenuRouting } from '../hooks/HRTHIS_useAdminMenuRouting';

const adminMenuConfig = [
  { 
    label: 'Team und Mitarbeiterverwaltung', 
    icon: Users, 
    description: 'Mitarbeiter verwalten'
  },
  { 
    label: 'Organigram Unified (NEU!)', 
    icon: Network, 
    description: 'Canvas + Firmeneinstellungen' 
  },
  { 
    label: 'Fieldverwaltung', 
    icon: MapPin, 
    description: 'Field-Mitarbeiter (EXTERN)' 
  },
];

const { items, isActive } = useAdminMenuRouting(adminMenuConfig);
```

### Navigation

```tsx
{items.map((item) => (
  <NavLink
    key={item.route}
    to={item.route}
    className={isActive(item.route) ? 'active' : ''}
  >
    {item.label}
  </NavLink>
))}
```

## 📊 Route-Generierungs-Tabelle

| Label | Generierte Route |
|-------|-----------------|
| `"Team und Mitarbeiterverwaltung"` | `/admin/team-und-mitarbeiterverwaltung` |
| `"Organigram Unified (NEU!)"` | `/admin/organigram-unified` |
| `"Organigram Canvas"` | `/admin/organigram-canvas` |
| `"Firmeneinstellungen"` | `/admin/firmeneinstellungen` |
| `"Fieldverwaltung"` | `/admin/fieldverwaltung` |
| `"Equipment Verwaltung"` | `/admin/equipment-verwaltung` |
| `"Benefitsverwaltung"` | `/admin/benefitsverwaltung` |
| `"Dashboard-Mitteilungen"` | `/admin/dashboard-mitteilungen` |
| `"Lernverwaltung"` | `/admin/lernverwaltung` |

## 🔄 Konvertierungslogik

```typescript
function adminMenuLabelToRoute(label: string): string {
  // 1. Entferne Marker wie "(NEU!)" oder "(alt)"
  const cleanLabel = label.replace(/\s*\([^)]*\)\s*/g, '').trim();
  
  // 2. Konvertiere zu lowercase
  // 3. Ersetze deutsche Umlaute (ä → ae, ö → oe, ü → ue, ß → ss)
  // 4. Ersetze Leerzeichen mit Bindestrichen
  // 5. Entferne nicht-alphanumerische Zeichen (außer Bindestriche)
  // 6. Bereinige mehrfache Bindestriche
  
  return `/admin/${slug}`;
}
```

## 🆕 Neuen Admin-Tab hinzufügen

### Schritt 1: Menu-Konfiguration erweitern

```tsx
// In components/AdminMobileMenu.tsx
const adminMenuConfig = [
  // ... existing items
  { 
    label: 'Neues Feature', 
    icon: Star, 
    description: 'Beschreibung' 
  },
];
```

**Automatisch generierte Route:** `/admin/neues-feature`

### Schritt 2: Route in App.tsx registrieren

```tsx
// In App.tsx
<Route path="neues-feature" element={
  <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
    <NeuesFeatureScreen />
  </Suspense>
} />
```

### Schritt 3: Screen erstellen

```tsx
// In screens/admin/NeuesFeatureScreen.tsx
export default function NeuesFeatureScreen() {
  return (
    <div>
      <h1>Neues Feature</h1>
    </div>
  );
}
```

**Das war's!** Keine manuelle Route-Konfiguration notwendig! 🎉

## ⚙️ Erweiterte Features

### Custom Route Override

Falls du eine spezielle Route brauchst:

```tsx
{ 
  label: 'Mein Tab', 
  icon: Users,
  customRoute: '/admin/custom-route'
}
```

### Legacy Route Support

Für Backward Compatibility während Migration:

```tsx
{ 
  label: 'Team und Mitarbeiterverwaltung', 
  icon: Users,
  legacyRoute: '/admin/team-management'
}
```

### Role-basierte Filterung

```tsx
const adminMenuConfig = [
  { 
    label: 'Super Admin Bereich', 
    icon: Shield,
    roles: ['SUPERADMIN']
  },
];

const { filterByRole } = useAdminMenuRouting(adminMenuConfig);
const filteredItems = filterByRole(userRole);
```

### Items ausblenden

```tsx
{ 
  label: 'Deprecated Feature', 
  icon: Archive,
  hidden: true
}
```

## 🔧 Migration von alten Routen

### Beispiel: Team Management → Team und Mitarbeiterverwaltung

**1. Alte Route:**
```
/admin/team-management
```

**2. Neue Route:**
```
/admin/team-und-mitarbeiterverwaltung
```

**3. Redirect einrichten:**
```tsx
// In App.tsx
<Route 
  path="team-management" 
  element={<Navigate to="/admin/team-und-mitarbeiterverwaltung" replace />} 
/>
```

**4. Alle internen Links aktualisieren:**
```tsx
// Vorher
navigate('/admin/team-management/user/123')

// Nachher
navigate('/admin/team-und-mitarbeiterverwaltung/user/123')
```

## 📝 Best Practices

### ✅ DO

- Verwende beschreibende, deutsche Labels
- Halte Labels kurz und prägnant
- Nutze Icons für bessere UX
- Füge Beschreibungen hinzu für Klarheit
- Richte Redirects für alte Routen ein

### ❌ DON'T

- Verwende keine Sonderzeichen im Label (außer Bindestriche und Leerzeichen)
- Ändere Labels nicht nach Release (oder richte Redirects ein)
- Vergiss nicht, Routen in App.tsx zu registrieren
- Hardcode keine Routen in Components

## 🔍 Debugging

### Route wird nicht generiert?

```tsx
import { adminMenuLabelToRoute } from '../hooks/HRTHIS_useAdminMenuRouting';

console.log(adminMenuLabelToRoute('Mein Label'));
// Output: "/admin/mein-label"
```

### Route ist nicht aktiv?

```tsx
const { isActive } = useAdminMenuRouting(config);
console.log(isActive('/admin/team-und-mitarbeiterverwaltung'));
// true wenn aktiv
```

### Item wird nicht angezeigt?

1. Prüfe `hidden: false`
2. Prüfe `roles` Array
3. Prüfe `filterByRole()` Aufruf

## 📦 Verwandte Hooks

- **`HRTHIS_useNavRouting.ts`** - Für Top Navigation (Dashboard, Kalender, etc.)
- **`HRTHIS_useTabRouting.ts`** - Für Tab-basierte Screens (Meine Daten, etc.)

## 🎯 Aktuelle Admin Menu Items (v4.10.18)

```typescript
const adminMenuConfig = [
  { label: 'Team und Mitarbeiterverwaltung', icon: Users },
  { label: 'Organigram Unified (NEU!)', icon: Network },
  { label: 'Organigram Canvas', icon: Network },
  { label: 'Firmeneinstellungen', icon: Building2 },
  { label: 'Fieldverwaltung', icon: MapPin },
  { label: 'Equipment Verwaltung', icon: Package },
  { label: 'Benefitsverwaltung', icon: Gift },
  { label: 'Dashboard-Mitteilungen', icon: Megaphone },
  { label: 'Lernverwaltung', icon: GraduationCap },
];
```

## ✅ Changelog

### v4.10.18 (Current)
- ✅ Admin Menu Dynamic Routing System implementiert
- ✅ `HRTHIS_useAdminMenuRouting.ts` Hook erstellt
- ✅ AdminMobileMenu umgestellt auf dynamisches Routing
- ✅ Team Management → Team und Mitarbeiterverwaltung migriert
- ✅ Alle internen Links aktualisiert
- ✅ Redirects für Backward Compatibility eingerichtet

---

**Dokumentiert von:** HRthis Development Team  
**Zuletzt aktualisiert:** v4.10.18
