# Navigation Routing System - Usage Guide

## Version: v4.10.17
**Status:** ✅ Production Ready  
**Date:** 2025-01-21  
**Related:** Tab Routing System (v4.10.16)

---

## 📌 Overview

Das **Navigation Routing System** ermöglicht automatische Konvertierung von Navigation-Labels zu URL-Routen. Ähnlich wie das Tab-Routing-System aus v4.10.16, aber für die Top Navigation Bar.

### Key Features

✅ **Automatische Route-Generierung** - "Dashboard" → "/dashboard"  
✅ **Umlaut-Behandlung** - "Übersicht" → "/uebersicht"  
✅ **Custom Routes** - Optionale manuelle Route-Override  
✅ **Backward Compatibility** - Bestehende Routen bleiben erhalten  
✅ **Badge Support** - Notification-Badges pro Navigation Item  
✅ **Role-Based Filtering** - Automatisches Filtern nach User-Rolle  

---

## 🎯 Hook: `HRTHIS_useNavRouting`

### Import

```tsx
import { useNavRouting } from '../hooks/HRTHIS_useNavRouting';
```

### Interface

```tsx
interface NavItemConfig {
  label: string;                          // Display name (shown to user)
  icon: React.ComponentType<any>;         // Icon component
  badge?: number;                         // Badge count (optional)
  customRoute?: string;                   // Custom route override (optional)
  mobileLabel?: string;                   // Short label for mobile (optional)
  hideOnMobile?: boolean;                 // Hide on mobile (optional)
  roles?: string[];                       // Role restrictions (optional)
}
```

### Basic Usage

```tsx
import { useNavRouting } from '../hooks/HRTHIS_useNavRouting';
import { User, Clock, GraduationCap } from '../components/icons/HRTHISIcons';

function MyLayout() {
  const navConfigs = [
    { label: 'Dashboard', icon: User },
    { label: 'Kalender', icon: Clock },
    { label: 'Lernen', icon: GraduationCap },
  ];

  const { items, isActive } = useNavRouting(navConfigs);

  return (
    <nav>
      {items.map((item) => (
        <NavLink
          key={item.route}
          to={item.route}
          className={isActive(item.route) ? 'active' : ''}
        >
          <item.icon />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
```

---

## 📋 Examples

### Example 1: Auto-Generated Routes

```tsx
const navConfigs = [
  { label: 'Dashboard', icon: User },        // → /dashboard
  { label: 'Kalender', icon: Clock },        // → /kalender
  { label: 'Lernen', icon: GraduationCap },  // → /lernen
  { label: 'Benefits', icon: Gift },         // → /benefits
];
```

### Example 2: Custom Routes (Backward Compatibility)

```tsx
const navConfigs = [
  { label: 'Dashboard', icon: User },
  { label: 'Kalender', icon: Clock, customRoute: '/calendar' },  // Use /calendar instead of /kalender
  { label: 'Lernen', icon: GraduationCap, customRoute: '/learning' },
];
```

### Example 3: With Badges

```tsx
const { badgeCounts } = useNotifications();

const navConfigs = [
  { label: 'Dashboard', icon: User, badge: badgeCounts.overview },
  { label: 'Kalender', icon: Clock, badge: badgeCounts.timeAndLeave },
  { label: 'Lernen', icon: GraduationCap, badge: badgeCounts.learning },
];
```

### Example 4: Role-Based Navigation

```tsx
const { profile } = useAuthStore();

const navConfigs = [
  { label: 'Dashboard', icon: User },
  { label: 'Admin Panel', icon: UserCog, roles: ['ADMIN', 'SUPERADMIN'] },
];

const { items, filterByRole } = useNavRouting(navConfigs);
const visibleItems = filterByRole(profile?.role);
```

---

## 🔄 Route Conversion Rules

### Standard Conversion

| Label              | Auto-Generated Route | Notes                          |
|--------------------|---------------------|--------------------------------|
| Dashboard          | /dashboard          | Lowercase                      |
| Kalender           | /kalender           | Lowercase                      |
| Lernen             | /lernen             | Lowercase                      |
| Benefits           | /benefits           | Lowercase                      |
| Meine Daten        | /meinedaten         | Spaces removed                 |
| Team Management    | /teammanagement     | Spaces removed                 |
| Übersicht          | /uebersicht         | ü → ue                        |
| Mitarbeiter-Liste  | /mitarbeiterliste   | Hyphens removed                |

### Umlaut Handling

- `ä` → `ae`
- `ö` → `oe`
- `ü` → `ue`
- `ß` → `ss`

### Special Characters

All non-alphanumeric characters are removed:
- Spaces → removed
- Hyphens → removed
- Underscores → removed
- Slashes → removed

---

## 🛠️ Implementation in MainLayout.tsx

```tsx
import { useNavRouting } from '../hooks/HRTHIS_useNavRouting';
import { useNotifications } from '../hooks/HRTHIS_useNotifications';

export default function MainLayout() {
  const { profile } = useAuthStore();
  const { badgeCounts } = useNotifications();
  
  // Define navigation items
  const navConfigs = [
    { label: 'Dashboard', icon: User, badge: badgeCounts.overview },
    { label: 'Kalender', icon: Clock, badge: badgeCounts.timeAndLeave, customRoute: '/calendar' },
    { label: 'Lernen', icon: GraduationCap, badge: badgeCounts.learning, customRoute: '/learning' },
    { label: 'Benefits', icon: Gift, badge: badgeCounts.benefits },
    { label: 'Arbeit', icon: Layers },
  ];

  // Process navigation items
  const { items, isActive } = useNavRouting(navConfigs);

  // Filter based on role
  const isExtern = profile?.role === 'EXTERN';
  const navItems = isExtern
    ? items.filter(item => item.route === '/dashboard' || item.route === '/arbeit')
    : items;

  return (
    <nav>
      {navItems.map((item) => (
        <NavLink
          key={item.route}
          to={item.route}
          className={({ isActive }) =>
            isActive ? 'active' : 'inactive'
          }
        >
          <item.icon />
          <span>{item.label}</span>
          {item.badge > 0 && <NotificationBadge count={item.badge} />}
        </NavLink>
      ))}
    </nav>
  );
}
```

---

## 🎨 Styling Best Practices

### Active State Detection

```tsx
const { isActive } = useNavRouting(navConfigs);

// Use in className
className={isActive(item.route) ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}
```

### React Router NavLink

```tsx
<NavLink
  to={item.route}
  className={({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-600'
        : 'text-gray-600 hover:bg-gray-50'
    }`
  }
>
  <item.icon className="w-4 h-4" />
  <span>{item.label}</span>
</NavLink>
```

---

## 🔄 Backward Compatibility

### Why Use `customRoute`?

Bestehende Routen in App.tsx sollten nicht geändert werden:

```tsx
// App.tsx has these routes:
<Route path="calendar" element={<CalendarScreen />} />
<Route path="learning" element={<LearningScreen />} />

// So we use customRoute for backward compatibility:
const navConfigs = [
  { label: 'Kalender', icon: Clock, customRoute: '/calendar' },  // NOT /kalender
  { label: 'Lernen', icon: GraduationCap, customRoute: '/learning' },  // NOT /lernen
];
```

### Migration Strategy

1. **Phase 1**: Use `customRoute` for all existing routes
2. **Phase 2**: Update App.tsx routes to match auto-generated routes
3. **Phase 3**: Remove `customRoute` overrides

---

## ⚠️ Important Notes

### DO ✅
- Use `customRoute` for existing routes
- Keep labels user-friendly (German preferred)
- Add badges for notification counts
- Filter navigation based on user role

### DON'T ❌
- Don't change labels without checking routes
- Don't use special characters in labels (they'll be removed)
- Don't forget to update App.tsx routes when removing `customRoute`

---

## 🆚 Comparison: Tab Routing vs Nav Routing

| Feature             | Tab Routing                        | Nav Routing                   |
|---------------------|-----------------------------------|-------------------------------|
| **Hook**            | `useTabRouting`                   | `useNavRouting`               |
| **URL Location**    | Query parameter `?tab=...`        | Route path `/...`             |
| **Use Case**        | Sub-navigation within a page      | Top-level navigation          |
| **Example**         | `?tab=meinepersonalakte`          | `/dashboard`                  |
| **State**           | Preserved in URL query            | Full route change             |
| **Browser History** | `replace: true` (no history spam) | Normal navigation             |

---

## 🚀 Next Steps

1. ✅ Implement `HRTHIS_useNavRouting` hook
2. ✅ Update MainLayout.tsx to use new hook
3. ✅ Update AdminLayout.tsx to use new hook
4. 🔄 Optional: Migrate App.tsx routes to match auto-generated routes
5. 🔄 Optional: Remove `customRoute` overrides after migration

---

## 📝 Version History

- **v4.10.17** (2025-01-21): Initial implementation
- **v4.10.16** (2025-01-21): Tab Routing System (related)

---

## 🔗 Related Files

- `/hooks/HRTHIS_useNavRouting.ts` - Main hook
- `/hooks/HRTHIS_useTabRouting.ts` - Tab routing hook
- `/layouts/MainLayout.tsx` - Main layout implementation
- `/layouts/AdminLayout.tsx` - Admin layout implementation
- `/App.tsx` - Route definitions
