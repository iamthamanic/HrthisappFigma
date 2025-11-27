# 🚀 Fahrzeuge-Integration: Quick Start

## 🎯 Ziel
Die neuen Dialoge in den VehicleDetailScreen integrieren.

---

## 📦 Neue Komponenten

1. **VehicleDocumentUploadDialog** - `/components/BrowoKo_VehicleDocumentUploadDialog.tsx`
2. **VehicleMaintenanceDialog** - `/components/BrowoKo_VehicleMaintenanceDialog.tsx`

---

## 🔧 Integration in VehicleDetailScreen

### Schritt 1: Imports hinzufügen

```typescript
// In /screens/admin/VehicleDetailScreen.tsx ganz oben

// Neue Imports
import { VehicleDocumentUploadDialog } from '../../components/BrowoKo_VehicleDocumentUploadDialog';
import { VehicleMaintenanceDialog, type Maintenance } from '../../components/BrowoKo_VehicleMaintenanceDialog';
```

### Schritt 2: State hinzufügen

```typescript
// In VehicleDetailScreen Component, nach den bestehenden States

// Documents State
const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
const [documents, setDocuments] = useState<any[]>([]);
const [loadingDocs, setLoadingDocs] = useState(false);

// Maintenance State
const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
const [maintenances, setMaintenances] = useState<any[]>([]);
const [loadingMaintenances, setLoadingMaintenances] = useState(false);
```

### Schritt 3: Load-Funktionen hinzufügen

```typescript
// Documents laden
const loadDocuments = async () => {
  if (!vehicleId) return;
  
  setLoadingDocs(true);
  try {
    const url = `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles/${vehicleId}/documents`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to load documents');
    }
    
    const data = await response.json();
    setDocuments(data.documents || []);
  } catch (error: any) {
    console.error('Load documents error:', error);
    toast.error('Fehler beim Laden der Dokumente');
  } finally {
    setLoadingDocs(false);
  }
};

// Maintenances laden
const loadMaintenances = async () => {
  if (!vehicleId) return;
  
  setLoadingMaintenances(true);
  try {
    const url = `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles/${vehicleId}/maintenances`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to load maintenances');
    }
    
    const data = await response.json();
    setMaintenances(data.maintenances || []);
  } catch (error: any) {
    console.error('Load maintenances error:', error);
    toast.error('Fehler beim Laden der Wartungen');
  } finally {
    setLoadingMaintenances(false);
  }
};
```

### Schritt 4: useEffect für Tab-Wechsel

```typescript
// Dokumente laden wenn Tab geöffnet wird
useEffect(() => {
  if (activeTab === 'documents' && vehicleId) {
    loadDocuments();
  }
}, [activeTab, vehicleId]);

// Wartungen laden wenn Tab geöffnet wird
useEffect(() => {
  if (activeTab === 'maintenance' && vehicleId) {
    loadMaintenances();
  }
}, [activeTab, vehicleId]);
```

### Schritt 5: Delete-Funktionen hinzufügen

```typescript
// Dokument löschen
const handleDeleteDocument = async (docId: string) => {
  if (!vehicleId || !confirm('Möchten Sie dieses Dokument wirklich löschen?')) return;
  
  try {
    const url = `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles/${vehicleId}/documents/${docId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete document');
    }
    
    toast.success('Dokument gelöscht');
    loadDocuments();
  } catch (error: any) {
    console.error('Delete document error:', error);
    toast.error('Fehler beim Löschen');
  }
};

// Wartung löschen
const handleDeleteMaintenance = async (maintId: string) => {
  if (!vehicleId || !confirm('Möchten Sie diese Wartung wirklich löschen?')) return;
  
  try {
    const url = `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles/${vehicleId}/maintenances/${maintId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete maintenance');
    }
    
    toast.success('Wartung gelöscht');
    loadMaintenances();
  } catch (error: any) {
    console.error('Delete maintenance error:', error);
    toast.error('Fehler beim Löschen');
  }
};

// Wartung bearbeiten
const handleEditMaintenance = (maintenance: any) => {
  setSelectedMaintenance(maintenance);
  setMaintenanceDialogOpen(true);
};

// Neue Wartung
const handleAddMaintenance = () => {
  setSelectedMaintenance(null);
  setMaintenanceDialogOpen(true);
};
```

### Schritt 6: Documents Tab ersetzen

```typescript
{/* Tab 2: Documents - KOMPLETT ERSETZEN */}
<TabsContent value="documents" className="space-y-6">
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle>Dokumente ({documents.length})</CardTitle>
        <Button 
          size="sm" 
          onClick={() => setDocumentDialogOpen(true)}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          Dokument hochladen
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      {loadingDocs ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Lade Dokumente...</p>
        </div>
      ) : documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {doc.type}
                    </Badge>
                    <span>{new Date(doc.uploaded_at).toLocaleDateString('de-DE')}</span>
                    {doc.file_size && (
                      <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost">
                  <FileText className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleDeleteDocument(doc.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3" />
          <p className="mb-4">Keine Dokumente vorhanden</p>
          <Button 
            size="sm"
            onClick={() => setDocumentDialogOpen(true)}
          >
            Erstes Dokument hochladen
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>
```

### Schritt 7: Maintenance Tab ersetzen

```typescript
{/* Tab 3: Maintenance - KOMPLETT ERSETZEN */}
<TabsContent value="maintenance" className="space-y-6">
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle>Wartungshistorie ({maintenances.length})</CardTitle>
        <Button 
          size="sm"
          onClick={handleAddMaintenance}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Wartung hinzufügen
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      {loadingMaintenances ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Lade Wartungen...</p>
        </div>
      ) : maintenances.length > 0 ? (
        <div className="space-y-4">
          {maintenances.map((wartung) => (
            <div key={wartung.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {new Date(wartung.maintenance_date).toLocaleDateString('de-DE')}
                    </span>
                    <Badge 
                      variant="secondary"
                      className={
                        wartung.status === 'completed' ? 'bg-green-100 text-green-700' :
                        wartung.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }
                    >
                      {wartung.status === 'completed' ? 'Abgeschlossen' :
                       wartung.status === 'overdue' ? 'Überfällig' : 'Geplant'}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">{wartung.title}</h4>
                  {wartung.description && (
                    <p className="text-sm text-gray-600 mb-2">{wartung.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {wartung.cost && (
                    <Badge variant="secondary">
                      {wartung.cost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </Badge>
                  )}
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleEditMaintenance(wartung)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDeleteMaintenance(wartung.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Wrench className="w-12 h-12 mx-auto mb-3" />
          <p className="mb-4">Keine Wartungen erfasst</p>
          <Button 
            size="sm"
            onClick={handleAddMaintenance}
          >
            Erste Wartung hinzufügen
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>
```

### Schritt 8: Dialoge am Ende hinzufügen

```typescript
{/* Am Ende des return(), vor dem schließenden </div> */}

{/* Document Upload Dialog */}
{vehicleId && (
  <VehicleDocumentUploadDialog
    open={documentDialogOpen}
    onOpenChange={setDocumentDialogOpen}
    vehicleId={vehicleId}
    onSuccess={loadDocuments}
  />
)}

{/* Maintenance Dialog */}
{vehicleId && (
  <VehicleMaintenanceDialog
    open={maintenanceDialogOpen}
    onOpenChange={(open) => {
      setMaintenanceDialogOpen(open);
      if (!open) setSelectedMaintenance(null);
    }}
    vehicleId={vehicleId}
    maintenance={selectedMaintenance}
    onSuccess={loadMaintenances}
  />
)}
```

---

## ✅ Testing Checklist

Nach der Integration:

### Documents Tab
1. [ ] Tab öffnet sich ohne Fehler
2. [ ] "Dokument hochladen" Button öffnet Dialog
3. [ ] Dateien können ausgewählt werden
4. [ ] Upload funktioniert
5. [ ] Dokumente werden in Liste angezeigt
6. [ ] Dokumente können gelöscht werden

### Maintenance Tab
1. [ ] Tab öffnet sich ohne Fehler
2. [ ] "Wartung hinzufügen" Button öffnet Dialog
3. [ ] Datum-Picker funktioniert
4. [ ] Wartung wird gespeichert
5. [ ] Wartungen werden in Liste angezeigt
6. [ ] Wartung kann bearbeitet werden
7. [ ] Wartung kann gelöscht werden
8. [ ] Status-Badges werden korrekt angezeigt

---

## 🐛 Troubleshooting

### Problem: Dialog öffnet sich nicht
**Lösung:** Prüfe Imports und State-Initialisierung

### Problem: API Error 404
**Lösung:** Edge Function deployen
```bash
supabase functions deploy BrowoKoordinator-Fahrzeuge
```

### Problem: Dokumente werden nicht geladen
**Lösung:** Console-Logs prüfen, API-Endpoint testen
```bash
curl -H "Authorization: Bearer <anon_key>" \
  https://<project>.supabase.co/functions/v1/BrowoKoordinator-Fahrzeuge/api/vehicles/<id>/documents
```

---

## 📝 Komplettes Code-Snippet

Für Copy-Paste: Siehe separate Datei `/FAHRZEUGE_VEHICLEDETAILSCREEN_COMPLETE.tsx`

---

**Status:** ✅ Ready for Integration  
**Geschätzte Integrationszeit:** 15-20 Minuten
