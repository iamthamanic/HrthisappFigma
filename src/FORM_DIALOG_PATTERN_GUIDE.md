# Form Dialog Pattern - Implementierungsleitfaden

## Übersicht

Alle Dialog-/Modal-Komponenten im Projekt müssen das einheitliche Form-Layout-Pattern aus `/styles/globals.css` verwenden.

## ✅ VOLLSTÄNDIG MIGRIERT - Alle wichtigen Dialoge fertig! (30+ Dialoge)

Die folgenden Komponenten wurden auf das neue Pattern umgestellt:

### Components (24 Dialoge) ✅
1. ✅ AdminRequestLeaveDialog.tsx
2. ✅ BulkEditDialog.tsx  
3. ✅ QuickEditDialog.tsx
4. ✅ QuickAwardCoinsDialog.tsx
5. ✅ QuickNoteDialog.tsx
6. ✅ QuickUploadDocumentDialog.tsx
7. ✅ SavedSearchesDropdown.tsx
8. ✅ CreateNodeDialog.tsx
9. ✅ EditNodeDialog.tsx
10. ✅ BulkDocumentUploadDialog.tsx
11. ✅ RequestLeaveDialog.tsx
12. ✅ ExportDialog.tsx
13. ✅ EditDepartmentDialog.tsx
14. ✅ CreateVideoDialog.tsx
15. ✅ EditVideoDialog.tsx
16. ✅ AssignEmployeesDialog.tsx
17. ✅ BrowoKo_BenefitApprovalDialog.tsx
18. ✅ BrowoKo_BenefitPurchaseDialog.tsx
19. ✅ BrowoKo_BenefitRequestDialog.tsx
20. ✅ BrowoKo_CoinStatsDialog.tsx
21. ✅ BrowoKo_DocumentUploadDialog.tsx
22. ✅ BrowoKo_EquipmentAddDialog.tsx
23. ✅ BrowoKo_VehicleAddDialog.tsx

### Screens (7 Dialoge) ✅
24-25. ✅ PerformanceReviewManagementScreen.tsx (2 Dialoge)
26-27. ✅ DashboardAnnouncementsScreen.tsx (2 Dialoge)
28-30. ✅ EmailTemplatesScreen.tsx (3 Dialoge: Create + Edit + Preview)

## 📋 Optional/Spezial-Dialoge (können bei Bedarf migriert werden)

Diese Dialoge sind weniger kritisch, spezialisiert oder verwenden AlertDialog statt Dialog:

### Optionale BrowoKo Dialoge:
- BrowoKo_DocumentViewDialog.tsx (spezielles Viewer-UI, kein typisches Formular)
- BrowoKo_EditWarningDialog.tsx (AlertDialog - kein Form-Content)
- BrowoKo_CreateShiftDialog.tsx
- BrowoKo_CreateTestDialog.tsx  
- BrowoKo_CreateWikiArticleDialog.tsx
- BrowoKo_EditWikiArticleDialog.tsx
- BrowoKo_ReviewModal.tsx
- BrowoKo_TaskModal.tsx
- BrowoKo_VehicleDocumentUploadDialog.tsx
- BrowoKo_VehicleMaintenanceDialog.tsx
- BrowoKo_CreateBoardModal.tsx

### Optionale Screen-Dialoge:
- ITEquipmentManagementScreen.tsx (1 Dialog)
- TestBuilderScreen.tsx (1 großer Dialog)
- EmployeePerformanceReviewScreen.tsx (1 Dialog)
- CalendarScreen.tsx (Detail Dialog - kein Form)
- DocumentsScreen.tsx (Delete AlertDialog - kein Form)

### Spezial-UI (optional):
- ImageCropDialog.tsx (spezielles Crop-UI)
- ConnectionLine.tsx (AlertDialog für Delete-Confirm)
- DeleteVideoDialog.tsx (AlertDialog)

## 📋 Pattern-Implementierung

### Schritt 1: DialogContent anpassen

**Vorher:**
```tsx
<DialogContent className="max-w-md">
```

**Nachher:**
```tsx
<DialogContent className="form-card">
```

Oder mit zusätzlichen Klassen (z.B. für größere Dialoge):
```tsx
<DialogContent className="form-card max-w-2xl max-h-[90vh] overflow-y-auto">
```

### Schritt 2: Form-Container anpassen

**Vorher:**
```tsx
<div className="space-y-4">
  {/* Form fields */}
</div>
```

**Nachher:**
```tsx
<div className="form-grid">
  {/* Form fields */}
</div>
```

Oder bei echtem Form-Element:
```tsx
<form className="form-grid" onSubmit={handleSubmit}>
  {/* Form fields */}
</form>
```

### Schritt 3: Jedes Label+Feld-Paar anpassen

**Vorher:**
```tsx
<div className="space-y-2">
  <Label htmlFor="email">E-Mail</Label>
  <Input id="email" type="email" value={email} onChange={...} />
</div>
```

**Nachher:**
```tsx
<div className="form-field">
  <Label htmlFor="email" className="form-label">E-Mail</Label>
  <Input id="email" className="form-input" type="email" value={email} onChange={...} />
</div>
```

**Wichtig:** 
- `className="form-label"` auf alle Labels
- `className="form-input"` auf alle Input/Textarea/Select-Komponenten

### Schritt 4: Button-Bereich anpassen

**Vorher:**
```tsx
<DialogFooter>
  <Button variant="outline" onClick={onClose}>Abbrechen</Button>
  <Button onClick={handleSubmit}>Speichern</Button>
</DialogFooter>
```

**Nachher:**
```tsx
<div className="form-footer">
  <Button variant="outline" onClick={onClose}>Abbrechen</Button>
  <Button onClick={handleSubmit}>Speichern</Button>
</div>
```

**Wichtig:** DialogFooter wird durch `<div className="form-footer">` ersetzt!

## 🎯 Vollständiges Vorher/Nachher-Beispiel

### Vorher (Alt)

```tsx
export default function MyDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Benutzer bearbeiten</DialogTitle>
          <DialogDescription>
            Ändere die Benutzerdaten
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={...} />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" type="email" value={email} onChange={...} />
          </div>

          {/* Department Field */}
          <div className="space-y-2">
            <Label htmlFor="department">Abteilung</Label>
            <Select value={department} onValueChange={...}>
              <SelectTrigger>
                <SelectValue placeholder="Wählen" />
              </SelectTrigger>
              <SelectContent>
                {/* ... */}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Nachher (Neu)

```tsx
export default function MyDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="form-card">
        <DialogHeader>
          <DialogTitle>Benutzer bearbeiten</DialogTitle>
          <DialogDescription>
            Ändere die Benutzerdaten
          </DialogDescription>
        </DialogHeader>

        <div className="form-grid">
          {/* Name Field */}
          <div className="form-field">
            <Label htmlFor="name" className="form-label">Name</Label>
            <Input id="name" className="form-input" value={name} onChange={...} />
          </div>

          {/* Email Field */}
          <div className="form-field">
            <Label htmlFor="email" className="form-label">E-Mail</Label>
            <Input id="email" className="form-input" type="email" value={email} onChange={...} />
          </div>

          {/* Department Field */}
          <div className="form-field">
            <Label htmlFor="department" className="form-label">Abteilung</Label>
            <Select value={department} onValueChange={...}>
              <SelectTrigger>
                <SelectValue placeholder="Wählen" />
              </SelectTrigger>
              <SelectContent>
                {/* ... */}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="form-footer">
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            Speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## 🎨 CSS-Klassen-Definition (in /styles/globals.css)

```css
/* Dialog Container */
.form-card {
  border-radius: 0.75rem;
  background-color: white;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  border: 1px solid rgb(229 231 235);
  max-width: 28rem;
  width: 100%;
  padding: 1.5rem;
}
.form-card > * + * {
  margin-top: 1.25rem;
}

/* Form Container */
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Field Container (Label + Input) */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* Label */
.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--foreground);
}

/* Input/Textarea/Select */
.form-input {
  width: 100%;
  border-radius: 0.375rem;
  border: 1px solid var(--border);
  background-color: var(--input-background);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

/* Footer (Button Container) */
.form-footer {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
```

## ⚠️ Wichtige Hinweise

1. **Keine Geschäftslogik ändern!**  
   Nur JSX-Struktur und className-Attribute anpassen.

2. **Bestehende Spacing-Klassen entfernen**  
   Klassen wie `space-y-4`, `gap-4`, etc. werden durch die neuen Klassen ersetzt.

3. **DialogFooter ersetzen**  
   `<DialogFooter>` wird durch `<div className="form-footer">` ersetzt.

4. **Zusätzliche Klassen beibehalten**  
   Bei `DialogContent` können zusätzliche Klassen wie `max-w-2xl` oder `overflow-y-auto` behalten werden:
   ```tsx
   <DialogContent className="form-card max-w-2xl overflow-y-auto">
   ```

5. **Spezielle UI-Elemente**  
   Elemente wie Alerts, Switches, oder Preview-Boxen können ihre bestehenden Klassen behalten:
   ```tsx
   <div className="bg-blue-50 p-3 rounded-lg">
     <p className="text-xs">Info-Text</p>
   </div>
   ```

6. **Grid-Layouts innerhalb von form-grid**  
   Grid-Layouts (z.B. für 2 Spalten) können innerhalb von `form-grid` verwendet werden:
   ```tsx
   <div className="form-grid">
     <div className="grid grid-cols-2 gap-4">
       <div className="form-field">
         <Label className="form-label">Startdatum</Label>
         <Input className="form-input" type="date" />
       </div>
       <div className="form-field">
         <Label className="form-label">Enddatum</Label>
         <Input className="form-input" type="date" />
       </div>
     </div>
   </div>
   ```

## 🔍 Automatische Suche nach Dialogen

Um alle verbleibenden Dialoge zu finden:

```bash
# Alle Dialog-Komponenten finden
grep -r "DialogContent" components/ --include="*.tsx"

# Alle AlertDialog-Komponenten finden
grep -r "AlertDialogContent" components/ --include="*.tsx"

# In Screens suchen
grep -r "DialogContent\|AlertDialogContent" screens/ --include="*.tsx"
```

## ✅ Checkliste pro Dialog

- [ ] `DialogContent` hat `className="form-card"` (+ ggf. zusätzliche Klassen)
- [ ] Form-Container hat `className="form-grid"`
- [ ] Jedes Label hat `className="form-label"`
- [ ] Jedes Input/Textarea/Select hat `className="form-input"`
- [ ] Jedes Label+Feld-Paar ist in `<div className="form-field">` gewrappt
- [ ] `DialogFooter` wurde durch `<div className="form-footer">` ersetzt
- [ ] Alte Spacing-Klassen (`space-y-2`, `space-y-4`, etc.) wurden entfernt
- [ ] Dialog funktioniert noch korrekt (keine Geschäftslogik geändert)

## 📝 Beispiel-Komponenten als Referenz

Orientiere dich an diesen bereits migrierten Komponenten:

1. **Einfacher Dialog mit wenigen Feldern:**  
   `/components/BulkEditDialog.tsx`

2. **Komplexer Dialog mit vielen Feldern:**  
   `/components/AdminRequestLeaveDialog.tsx`

3. **Dialog mit Slider und Buttons:**  
   `/components/QuickAwardCoinsDialog.tsx`

4. **Dialog mit Textarea:**  
   `/components/QuickNoteDialog.tsx`

5. **Dialog mit Select-Feldern:**  
   `/components/QuickEditDialog.tsx`

---

**Stand:** Dezember 2024  
**Version:** 1.0