# Styleguide: Readonly Fields

## 📋 Übersicht

Dieser Styleguide definiert, wie **readonly (nicht editierbare) Felder** in HRthis dargestellt werden sollen.

## 🎨 Design-Prinzip

**Readonly Felder sollten wie deaktivierte Input-Felder aussehen**, um visuell zu signalisieren, dass sie nicht bearbeitet werden können, aber trotzdem wichtige Informationen enthalten.

## ✅ Standard-Klassen

### `.field-readonly`

Die Hauptklasse für readonly Felder mit grauem Hintergrund:

```css
.field-readonly {
  padding: 0.5rem 0.75rem;
  background-color: #f3f4f6;  /* Grauer Hintergrund */
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #111827;
  min-height: 2.5rem;
  display: flex;
  align-items: center;
}
```

### `.field-readonly-empty`

Zusätzliche Klasse für leere Felder (z.B. "Nicht angegeben"):

```css
.field-readonly-empty {
  color: #9ca3af;  /* Hellgrau für Platzhalter-Text */
}
```

## 🔧 Verwendung

### Beispiel: Einfaches Feld

```tsx
<div>
  <Label>Vorname</Label>
  <div className="field-readonly mt-1">
    {user.first_name}
  </div>
</div>
```

### Beispiel: Feld mit Fallback (leer)

```tsx
<div>
  <Label>Telefonnummer</Label>
  <div className={`field-readonly mt-1 ${!user.phone ? 'field-readonly-empty' : ''}`}>
    {user.phone || 'Nicht angegeben'}
  </div>
</div>
```

### Beispiel: Komplexe Inhalte

```tsx
<div>
  <Label>Gehalt</Label>
  <div className={`field-readonly mt-1 ${!user.salary ? 'field-readonly-empty' : ''}`}>
    {user.salary ? (
      <>
        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(user.salary)}/Monat
        <span className="text-xs text-gray-500 ml-2">
          (Jahr: {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(user.salary * 12)})
        </span>
      </>
    ) : (
      'Nicht angegeben'
    )}
  </div>
</div>
```

## 📐 Verwendungsbereiche

Diese Klassen sollten in folgenden Bereichen verwendet werden:

### ✅ Immer verwenden bei:

1. **Mitarbeiterdetails (Readonly-Modus)**
   - Persönliche Informationen (Name, E-Mail, Telefon)
   - Adressdaten (Straße, PLZ, Ort)
   - Bankverbindung (IBAN, BIC)
   - Arbeitskleidung Größen
   - Arbeitsinformationen (Position, Abteilung, Gehalt, etc.)

2. **Dashboard-Karten mit schreibgeschützten Daten**
   - Statistiken
   - Übersichten
   - Zusammenfassungen

3. **Profilansichten**
   - Eigenes Profil (nicht editierbare Felder)
   - Team-Mitglieder Profile

### ❌ NICHT verwenden bei:

1. **Editierbaren Input-Feldern**
   - Verwende stattdessen `<Input />` Komponente

2. **Aktiven Formularen**
   - Nur im Edit-Modus normale Inputs verwenden

3. **Reinem Text ohne "Feld-Charakter"**
   - z.B. Fließtext in Beschreibungen

## 🌓 Dark Mode Support

Die Klassen haben automatisch Dark Mode Support:

```css
.dark .field-readonly {
  background-color: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

.dark .field-readonly-empty {
  color: #6b7280;
}
```

## 🎯 Konsistenz-Regeln

### 1. **Immer mit Label kombinieren**
```tsx
<div>
  <Label>Feldname</Label>
  <div className="field-readonly mt-1">
    {wert}
  </div>
</div>
```

### 2. **Spacing beachten**
- `mt-1` nach Label für Abstand
- Bei Beschreibungen: `mt-1` nach dem readonly Field

### 3. **Empty State behandeln**
```tsx
className={`field-readonly mt-1 ${!wert ? 'field-readonly-empty' : ''}`}
```

### 4. **Grid Layouts beibehalten**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <Label>Feld 1</Label>
    <div className="field-readonly mt-1">{wert1}</div>
  </div>
  <div>
    <Label>Feld 2</Label>
    <div className="field-readonly mt-1">{wert2}</div>
  </div>
</div>
```

## ✨ Vorteile

1. **Visuelle Konsistenz**: Alle readonly Felder sehen gleich aus
2. **Bessere UX**: Nutzer erkennen sofort, dass das Feld nicht editierbar ist
3. **Professionelles Design**: Sieht aus wie ein modernes Admin-Interface
4. **Accessibility**: Klare visuelle Trennung zwischen editable und readonly
5. **Dark Mode Ready**: Automatische Anpassung an Dark Mode

## 🔄 Migration bestehender Felder

### Vorher (alt):
```tsx
<div>
  <Label>Name</Label>
  <p className="text-sm text-gray-900 mt-1">{user.name}</p>
</div>
```

### Nachher (neu):
```tsx
<div>
  <Label>Name</Label>
  <div className="field-readonly mt-1">
    {user.name}
  </div>
</div>
```

## 📝 Implementierungsstatus

- ✅ `/styles/globals.css` - Klassen definiert
- ✅ TeamMemberDetailsScreen - Alle Felder migriert
- 🔄 Weitere Screens folgen bei Bedarf

## 🎨 Design Tokens

Falls zukünftig Design Tokens verwendet werden sollen:

```css
:root {
  --field-readonly-bg: #f3f4f6;
  --field-readonly-border: #e5e7eb;
  --field-readonly-text: #111827;
  --field-readonly-empty: #9ca3af;
  --field-readonly-padding: 0.5rem 0.75rem;
  --field-readonly-radius: 0.375rem;
}
```
