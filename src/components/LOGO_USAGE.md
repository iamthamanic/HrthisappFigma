# 🎨 HRthis Logo Component

Wiederverwendbare Logo-Komponente mit dem Original-Design aus Figma.

---

## 📦 Verwendung

```tsx
import Logo from './components/Logo';

// Standard (medium, mit Text)
<Logo />

// Klein ohne Text (Header)
<Logo size="sm" showText={true} />

// Groß ohne Text (Login-Seiten)
<Logo size="lg" showText={false} />

// Medium ohne Text
<Logo size="md" showText={false} />
```

---

## 🎨 Design

Das Logo besteht aus:
- **"HRth⚡s"** - Text mit Blitz-Icon in der Mitte
- **Blitz-Farbe:** `#DCD48D` (Gelb)
- **Text-Farbe:** `#155dfc` (Blau)
- **Hintergrund:** Weiß mit Schatten
- **Border-Radius:** `rounded-2xl`

---

## 📏 Größen

| Size | Abmessungen | Verwendung |
|------|-------------|------------|
| `sm` | 8x8 (2rem) | Header, kleine Kontexte |
| `md` | 12x12 (3rem) | Standard, Modals |
| `lg` | 16x16 (4rem) | Login, große Hero-Bereiche |

---

## 🔧 Props

```typescript
interface LogoProps {
  size?: 'sm' | 'md' | 'lg';  // Default: 'md'
  showText?: boolean;          // Default: true
}
```

---

## 📍 Wo verwendet

### Header (App.tsx)
```tsx
<Logo size="sm" showText={true} />
```

### Login-Screen
```tsx
<Logo size="lg" showText={false} />
<h1>HRthis</h1>
```

### Register-Screen
```tsx
<Logo size="md" showText={false} />
<h2>Registrierung</h2>
```

### Forgot Password
```tsx
<Logo size="md" showText={false} />
<h2>Passwort vergessen?</h2>
```

### Reset Password
```tsx
<Logo size="md" showText={false} />
<h2>Neues Passwort setzen</h2>
```

---

## 🎯 Design-System

Das Logo folgt dem HRthis Design-System:

**Farben:**
- Primary Blue: `#155dfc`
- Accent Yellow: `#DCD48D`
- Background: `white`
- Shadow: `shadow-lg`

**Typography:**
- Font: `font-bold`
- Tracking: `tracking-wider`

**Spacing:**
- Gap zwischen Icon und Text: `gap-2`
- Icon Padding: zentriert

---

## 💡 Best Practices

### ✅ Do:
- Nutze `size="sm"` im Header für Konsistenz
- Nutze `size="lg"` auf großen Landing/Login-Seiten
- Zeige Text im Header für Branding
- Verstecke Text auf Auth-Seiten (wird im Titel wiederholt)

### ❌ Don't:
- Logo nicht verzerren oder Aspect Ratio ändern
- Farben nicht ändern (Brand Identity!)
- Text nicht separat vom Logo verwenden
- Keine anderen Icons als Ersatz verwenden

---

## 🔮 Anpassungen

Falls du das Logo anpassen musst:

**Nur Größe ändern:**
```tsx
// Eigene Größe (nicht empfohlen, nutze sm/md/lg)
<div className="w-10 h-10">
  <Logo size="md" showText={false} />
</div>
```

**Eigene Farben (nicht empfohlen!):**
```tsx
// Logo.tsx bearbeiten - nur für spezielle Anlässe
// z.B. Dark Mode, Special Events, etc.
```

---

## 📱 Responsive

Das Logo ist automatisch responsive durch Tailwind-Klassen:
- Skaliert mit Container
- SVG bleibt scharf auf allen Bildschirmen
- Behält Aspect Ratio bei

---

## 🎨 Figma Origin

Importiert aus: `/imports/Container.tsx`

Original SVG Path:
```
M2.5 10.8182H0L3.5 0V6.18182H6L2.5 17V10.8182Z
```

---

## 🚀 Performance

- **Inline SVG** - keine extra HTTP Requests
- **Kleine Größe** - ~100 Bytes
- **Keine Dependencies** - nur React + Tailwind
- **Tree-shakeable** - unused sizes werden removed

---

**Last updated:** 2025-01-02