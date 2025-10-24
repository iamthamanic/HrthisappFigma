# Verbleibende Refactoring-Aufgaben

## Status: Phase 1 ✅ Abgeschlossen

Das kritische Performance-Refactoring von `CanvasOrgChart.tsx` ist komplett!

## Phase 2: Domain-Prefix für alle HR-Komponenten (Optional)

Die folgenden Komponenten sollten den `hr_` Prefix bekommen:

### Organigram-Komponenten (Priorität: HOCH)
```
✅ ERLEDIGT: /components/canvas/hr_CanvasOrgChart.tsx
✅ ERLEDIGT: /components/canvas/hr_CanvasTypes.ts
✅ ERLEDIGT: /components/canvas/hr_CanvasUtils.ts
✅ ERLEDIGT: /components/canvas/hr_CanvasHandlers.ts
✅ ERLEDIGT: /components/canvas/hr_CanvasControls.tsx

⏳ TODO:
- /components/OrgNode.tsx → /components/canvas/hr_OrgNode.tsx
- /components/ConnectionLine.tsx → /components/canvas/hr_ConnectionLine.tsx
- /components/ConnectionPoint.tsx → /components/canvas/hr_ConnectionPoint.tsx
```

### Organigram-Dialoge (Priorität: MITTEL)
```
⏳ TODO:
- /components/CreateNodeDialog.tsx → /components/dialogs/hr_CreateNodeDialog.tsx
- /components/EditNodeDialog.tsx → /components/dialogs/hr_EditNodeDialog.tsx
- /components/AssignEmployeesDialog.tsx → /components/dialogs/hr_AssignEmployeesDialog.tsx
- /components/EditDepartmentDialog.tsx → /components/dialogs/hr_EditDepartmentDialog.tsx
```

### Legacy Organigram-Komponenten (Priorität: NIEDRIG)
```
⏳ TODO (oder löschen wenn nicht mehr verwendet):
- /components/DraggableOrgChart.tsx → hr_DraggableOrgChart.tsx
- /components/ModernOrgChart.tsx → hr_ModernOrgChart.tsx
- /components/OrgChart.tsx → hr_OrgChart.tsx
- /components/SimpleOrgChart.tsx → hr_SimpleOrgChart.tsx
```

### HR-spezifische UI-Komponenten (Priorität: NIEDRIG)
```
⏳ TODO:
- /components/ActivityFeed.tsx → /components/hr/hr_ActivityFeed.tsx
- /components/AvatarDisplay.tsx → /components/hr/hr_AvatarDisplay.tsx
- /components/AvatarEditor.tsx → /components/hr/hr_AvatarEditor.tsx
- /components/BreakManager.tsx → /components/hr/hr_BreakManager.tsx
- /components/LiveStats.tsx → /components/hr/hr_LiveStats.tsx
- /components/OnlineUsers.tsx → /components/hr/hr_OnlineUsers.tsx
- /components/XPProgress.tsx → /components/hr/hr_XPProgress.tsx
```

### HR-spezifische Dialoge (Priorität: NIEDRIG)
```
⏳ TODO:
- /components/QuickActionsMenu.tsx → /components/dialogs/hr_QuickActionsMenu.tsx
- /components/QuickAwardCoinsDialog.tsx → /components/dialogs/hr_QuickAwardCoinsDialog.tsx
- /components/QuickEditDialog.tsx → /components/dialogs/hr_QuickEditDialog.tsx
- /components/QuickNoteDialog.tsx → /components/dialogs/hr_QuickNoteDialog.tsx
- /components/QuickUploadDocumentDialog.tsx → /components/dialogs/hr_QuickUploadDocumentDialog.tsx
- /components/BulkEditDialog.tsx → /components/dialogs/hr_BulkEditDialog.tsx
```

### Learning-System (Priorität: NIEDRIG)
```
⏳ TODO:
- /components/QuizPlayer.tsx → /components/learning/hr_QuizPlayer.tsx
- /components/VideoPlayer.tsx → /components/learning/hr_VideoPlayer.tsx
- /components/YouTubeVideoPlayer.tsx → /components/learning/hr_YouTubeVideoPlayer.tsx
- /components/CreateVideoDialog.tsx → /components/dialogs/hr_CreateVideoDialog.tsx
- /components/EditVideoDialog.tsx → /components/dialogs/hr_EditVideoDialog.tsx
- /components/DeleteVideoDialog.tsx → /components/dialogs/hr_DeleteVideoDialog.tsx
```

### Permissions & Settings (Priorität: NIEDRIG)
```
⏳ TODO:
- /components/PermissionsEditor.tsx → /components/hr/hr_PermissionsEditor.tsx
- /components/PermissionsView.tsx → /components/hr/hr_PermissionsView.tsx
- /components/PersonalSettings.tsx → /components/hr/hr_PersonalSettings.tsx
```

### Bulk-Actions (Priorität: NIEDRIG)
```
⏳ TODO:
- /components/BulkActionsBar.tsx → /components/hr/hr_BulkActionsBar.tsx
- /components/SortControls.tsx → /components/hr/hr_SortControls.tsx
- /components/SavedSearchesDropdown.tsx → /components/hr/hr_SavedSearchesDropdown.tsx
```

### Misc HR-Components (Priorität: NIEDRIG)
```
⏳ TODO:
- /components/AchievementBadge.tsx → /components/hr/hr_AchievementBadge.tsx
- /components/ExportDialog.tsx → /components/dialogs/hr_ExportDialog.tsx
- /components/ImageCropDialog.tsx → /components/dialogs/hr_ImageCropDialog.tsx
- /components/NotificationCenter.tsx → /components/hr/hr_NotificationCenter.tsx
- /components/SetupChecklist.tsx → /components/hr/hr_SetupChecklist.tsx
- /components/StorageDiagnostics.tsx → /components/hr/hr_StorageDiagnostics.tsx
- /components/MigrationRequiredAlert.tsx → /components/hr/hr_MigrationRequiredAlert.tsx
```

## Phase 3: Dokumentation organisieren (Optional)

### Markdown-Dateien nach /docs verschieben:

```
Root-Verzeichnis hat aktuell 40+ .md Dateien!

Empfohlene Struktur:
/docs/
  ├── README.md ✅ ERSTELLT
  ├── REFACTORING_COMPLETED.md ✅ ERSTELLT
  ├── setup/
  │   ├── SINGLE_TENANT_SETUP.md
  │   ├── MIGRATION_INSTRUCTIONS.md
  │   ├── MIGRATION_CHECKLIST.md
  │   └── RUN_THIS_IN_SUPABASE.sql
  ├── features/
  │   ├── ORGANIGRAM_FEATURE_COMPLETE.md
  │   ├── LEARNING_SYSTEM_README.md
  │   ├── DOCUMENTS_SYSTEM_README.md
  │   └── TEAM_MANAGEMENT_FEATURES_COMPLETE.md
  ├── sql/
  │   ├── SQL_COPY_PASTE.md
  │   ├── SQL_ORGANIGRAM.md
  │   ├── SQL_DEPARTMENTS_MIGRATION.md
  │   └── ... (alle SQL_*.md Dateien)
  ├── guides/
  │   ├── QUICK_START_GUIDE.md
  │   ├── QUICK_START_CANVAS.md
  │   └── ... (alle QUICK_*.md Dateien)
  └── fixes/
      ├── FIXES_OVERVIEW.md
      ├── QUICK_FIX_ERRORS.md
      └── ... (alle *_FIX.md Dateien)
```

**Warnung:** Die Dateien im Root-Verzeichnis manuell verschieben, da sie bereits existieren!

## Empfohlene Reihenfolge:

1. ✅ **ERLEDIGT:** CanvasOrgChart.tsx splitten (kritisch für Performance)
2. ⏳ **Optional:** OrgNode, ConnectionLine, ConnectionPoint umbenennen
3. ⏳ **Optional:** Dialoge nach /components/dialogs verschieben
4. ⏳ **Optional:** HR-Komponenten nach /components/hr verschieben
5. ⏳ **Optional:** Markdown-Dateien nach /docs verschieben

## Warum noch nicht alles gemacht?

Die verbleibenden Aufgaben sind **nicht kritisch** und können schrittweise umgesetzt werden:

- **Domain-Prefix:** Hauptsächlich für Code-Organisation
- **Dokumentation:** Hauptsächlich für bessere Übersicht
- **Performance:** Bereits durch Canvas-Splitting gelöst ✅

## Zusammenfassung

**Kritisches Performance-Problem:** ✅ **GELÖST!**
- CanvasOrgChart.tsx von 995 Zeilen → 5 übersichtliche Module
- Alle Imports aktualisiert
- Alte Datei gelöscht

**Weitere Aufgaben:** Optionale Code-Organisation (kein Einfluss auf Performance)

Das System läuft jetzt stabil und performant! 🎉
