/**
 * @file VehicleDetailScreen.tsx
 * @version 4.5.9
 * @description Vehicle detail view with tabs (Overview, Documents, Maintenance, Accidents, Equipment)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {  ArrowLeft, Truck, Calendar, Weight, FileText, Wrench, AlertTriangle, Image as ImageIcon, Package, Edit, X, Save } from '../../components/icons/HRTHISIcons';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Calendar as CalendarUI } from '../../components/ui/calendar';
import { EquipmentAddDialog, type EquipmentFormData } from '../../components/HRTHIS_EquipmentAddDialog';
import { toast } from 'sonner@2.0.3';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Equipment {
  id: string;
  name: string;
  description: string;
  serial_number: string;
  purchase_date?: string;
  next_maintenance?: string;
  status: 'AKTIV' | 'WARTUNG' | 'DEFEKT';
  images: string[];
  created_at: string;
}

interface Vehicle {
  id: string;
  kennzeichen: string;
  modell: string;
  fahrzeugtyp: string;
  ladekapazitaet: number;
  dienst_start?: string;
  letzte_wartung?: string;
  images: string[];
  documents: { name: string; url: string }[];
  wartungen: { date: string; description: string; cost?: number }[];
  unfaelle: { date: string; description: string; damage?: string }[];
  equipment: Equipment[];
  created_at: string;
}

export default function VehicleDetailScreen() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  
  // Edit mode state
  const [isEditingVehicleData, setIsEditingVehicleData] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [editKennzeichen, setEditKennzeichen] = useState('');
  const [editModell, setEditModell] = useState('');
  const [editFahrzeugtyp, setEditFahrzeugtyp] = useState('');
  const [editLadekapazitaet, setEditLadekapazitaet] = useState('');
  const [editDienstStart, setEditDienstStart] = useState('');
  const [editLetzteWartung, setEditLetzteWartung] = useState('');

  // Load vehicle data
  useEffect(() => {
    loadVehicle();
  }, [vehicleId]);

  const loadVehicle = () => {
    try {
      const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
      const found = vehicles.find((v: Vehicle) => v.id === vehicleId);
      
      if (found) {
        // Ensure equipment array exists
        if (!found.equipment) {
          found.equipment = [];
        }
        setVehicle(found);
      } else {
        toast.error('Fahrzeug nicht gefunden');
        navigate('/admin/field-management');
      }
    } catch (error) {
      console.error('Load vehicle error:', error);
      toast.error('Fehler beim Laden des Fahrzeugs');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEquipment = (data: EquipmentFormData) => {
    if (!vehicle) return;

    const newEquipment: Equipment = {
      id: `eq-${Date.now()}`,
      ...data,
      created_at: new Date().toISOString(),
    };

    const updatedVehicle = {
      ...vehicle,
      equipment: [...(vehicle.equipment || []), newEquipment]
    };

    // Update in state
    setVehicle(updatedVehicle);

    // Update in localStorage
    const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
    const index = vehicles.findIndex((v: Vehicle) => v.id === vehicleId);
    if (index !== -1) {
      vehicles[index] = updatedVehicle;
      localStorage.setItem('vehicles', JSON.stringify(vehicles));
    }

    setEquipmentDialogOpen(false);
    toast.success('Equipment erfolgreich hinzugefügt');
  };

  const handleEditVehicleData = () => {
    if (!vehicle) return;
    
    // Initialize form with current values
    setEditKennzeichen(vehicle.kennzeichen);
    setEditModell(vehicle.modell);
    setEditFahrzeugtyp(vehicle.fahrzeugtyp);
    setEditLadekapazitaet(vehicle.ladekapazitaet.toString());
    setEditDienstStart(vehicle.dienst_start || '');
    setEditLetzteWartung(vehicle.letzte_wartung || '');
    setIsEditingVehicleData(true);
  };

  const handleCancelEditVehicleData = () => {
    setIsEditingVehicleData(false);
  };

  const handleSaveVehicleData = () => {
    if (!vehicle) return;
    
    // Validation
    if (!editKennzeichen.trim() || !editModell.trim()) {
      toast.error('Kennzeichen und Modell sind Pflichtfelder');
      return;
    }

    const ladekapazitaet = parseInt(editLadekapazitaet);
    if (isNaN(ladekapazitaet) || ladekapazitaet <= 0) {
      toast.error('Ladekapazität muss eine positive Zahl sein');
      return;
    }

    setSaving(true);

    try {
      const updatedVehicle: Vehicle = {
        ...vehicle,
        kennzeichen: editKennzeichen,
        modell: editModell,
        fahrzeugtyp: editFahrzeugtyp,
        ladekapazitaet: ladekapazitaet,
        dienst_start: editDienstStart || undefined,
        letzte_wartung: editLetzteWartung || undefined,
      };

      // Update in state
      setVehicle(updatedVehicle);

      // Update in localStorage
      const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
      const index = vehicles.findIndex((v: Vehicle) => v.id === vehicleId);
      if (index !== -1) {
        vehicles[index] = updatedVehicle;
        localStorage.setItem('vehicles', JSON.stringify(vehicles));
      }

      setIsEditingVehicleData(false);
      toast.success('Fahrzeugdaten erfolgreich gespeichert');
    } catch (error: any) {
      console.error('Save vehicle data error:', error);
      toast.error('Fehler beim Speichern: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Fahrzeug...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-20 md:pt-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/field-management')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </Button>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                {vehicle.kennzeichen}
              </h1>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {vehicle.fahrzeugtyp}
                </Badge>
                <span className="text-sm text-gray-500">
                  Hinzugefügt: {new Date(vehicle.created_at).toLocaleDateString('de-DE')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tabs Navigation */}
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto mb-6">
            <TabsTrigger value="overview" className="tab-trigger-responsive">
              <Truck className="w-4 h-4" />
              <span>Übersicht</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="tab-trigger-responsive">
              <FileText className="w-4 h-4" />
              <span>Dokumente</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="tab-trigger-responsive">
              <Wrench className="w-4 h-4" />
              <span>Wartungen</span>
            </TabsTrigger>
            <TabsTrigger value="accidents" className="tab-trigger-responsive">
              <AlertTriangle className="w-4 h-4" />
              <span>Unfälle</span>
            </TabsTrigger>
            <TabsTrigger value="equipment" className="tab-trigger-responsive">
              <Package className="w-4 h-4" />
              <span>Equipment</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview */}
          <TabsContent value="overview" className="space-y-6">
            {/* Images Gallery */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Bilder ({vehicle.images.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vehicle.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {vehicle.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`${vehicle.kennzeichen} ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        />
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                            Vorschaubild
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Truck className="w-12 h-12 mx-auto mb-3" />
                    <p>Keine Bilder vorhanden</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vehicle Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Fahrzeugdaten</CardTitle>
                  {!isEditingVehicleData && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditVehicleData}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Bearbeiten
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditingVehicleData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Kennzeichen */}
                      <div className="space-y-2">
                        <Label htmlFor="kennzeichen">Kennzeichen *</Label>
                        <Input
                          id="kennzeichen"
                          value={editKennzeichen}
                          onChange={(e) => setEditKennzeichen(e.target.value)}
                          placeholder="B-AB 1234"
                        />
                      </div>

                      {/* Modell */}
                      <div className="space-y-2">
                        <Label htmlFor="modell">Modell *</Label>
                        <Input
                          id="modell"
                          value={editModell}
                          onChange={(e) => setEditModell(e.target.value)}
                          placeholder="Mercedes Sprinter"
                        />
                      </div>

                      {/* Fahrzeugtyp */}
                      <div className="space-y-2">
                        <Label htmlFor="fahrzeugtyp">Fahrzeugtyp</Label>
                        <Select
                          value={editFahrzeugtyp}
                          onValueChange={setEditFahrzeugtyp}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Bitte wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Transporter">Transporter</SelectItem>
                            <SelectItem value="LKW">LKW</SelectItem>
                            <SelectItem value="PKW">PKW</SelectItem>
                            <SelectItem value="Kleintransporter">Kleintransporter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Ladekapazität */}
                      <div className="space-y-2">
                        <Label htmlFor="ladekapazitaet">Ladekapazität (kg)</Label>
                        <Input
                          id="ladekapazitaet"
                          type="number"
                          value={editLadekapazitaet}
                          onChange={(e) => setEditLadekapazitaet(e.target.value)}
                          placeholder="1500"
                        />
                      </div>

                      {/* Dienst Start */}
                      <div className="space-y-2">
                        <Label htmlFor="dienst_start">Dienst Start</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {editDienstStart
                                ? format(new Date(editDienstStart), 'dd.MM.yyyy', { locale: de })
                                : 'Datum wählen'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarUI
                              mode="single"
                              selected={editDienstStart ? new Date(editDienstStart) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  setEditDienstStart(format(date, 'yyyy-MM-dd'));
                                }
                              }}
                              initialFocus
                              locale={de}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Letzte Wartung */}
                      <div className="space-y-2">
                        <Label htmlFor="letzte_wartung">Letzte Wartung</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {editLetzteWartung
                                ? format(new Date(editLetzteWartung), 'dd.MM.yyyy', { locale: de })
                                : 'Datum wählen'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarUI
                              mode="single"
                              selected={editLetzteWartung ? new Date(editLetzteWartung) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  setEditLetzteWartung(format(date, 'yyyy-MM-dd'));
                                }
                              }}
                              initialFocus
                              locale={de}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        onClick={handleCancelEditVehicleData}
                        disabled={saving}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Abbrechen
                      </Button>
                      <Button onClick={handleSaveVehicleData} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Speichert...' : 'Speichern'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Kennzeichen</Label>
                      <div className="field-readonly-v2">
                        {vehicle.kennzeichen}
                      </div>
                    </div>

                    <div>
                      <Label>Modell</Label>
                      <div className="field-readonly-v2">
                        {vehicle.modell}
                      </div>
                    </div>

                    <div>
                      <Label>Fahrzeugtyp</Label>
                      <div className="field-readonly-v2">
                        {vehicle.fahrzeugtyp}
                      </div>
                    </div>

                    <div>
                      <Label>Ladekapazität</Label>
                      <div className="field-readonly-v2 flex items-center gap-2">
                        <Weight className="w-4 h-4 text-gray-400" />
                        {vehicle.ladekapazitaet.toLocaleString('de-DE')} kg
                      </div>
                    </div>

                    {vehicle.dienst_start && (
                      <div>
                        <Label>Dienst Start</Label>
                        <div className="field-readonly-v2 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(vehicle.dienst_start).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                    )}

                    {vehicle.letzte_wartung && (
                      <div>
                        <Label>Letzte Wartung</Label>
                        <div className="field-readonly-v2 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(vehicle.letzte_wartung).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Documents */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Dokumente ({vehicle.documents.length})</CardTitle>
                  <Button size="sm">+ Dokument hochladen</Button>
                </div>
              </CardHeader>
              <CardContent>
                {vehicle.documents.length > 0 ? (
                  <div className="space-y-2">
                    {vehicle.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-700">{doc.name}</span>
                        </div>
                        <Button size="sm" variant="ghost">Ansehen</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3" />
                    <p className="mb-4">Keine Dokumente vorhanden</p>
                    <Button size="sm">Erstes Dokument hochladen</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Maintenance */}
          <TabsContent value="maintenance" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Wartungshistorie ({vehicle.wartungen.length})</CardTitle>
                  <Button size="sm">+ Wartung hinzufügen</Button>
                </div>
              </CardHeader>
              <CardContent>
                {vehicle.wartungen.length > 0 ? (
                  <div className="space-y-4">
                    {vehicle.wartungen.map((wartung, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {new Date(wartung.date).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                          {wartung.cost && (
                            <Badge variant="secondary">
                              {wartung.cost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{wartung.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Wrench className="w-12 h-12 mx-auto mb-3" />
                    <p className="mb-4">Keine Wartungen erfasst</p>
                    <Button size="sm">Erste Wartung hinzufügen</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Accidents */}
          <TabsContent value="accidents" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Unfallhistorie ({vehicle.unfaelle.length})</CardTitle>
                  <Button size="sm">+ Unfall melden</Button>
                </div>
              </CardHeader>
              <CardContent>
                {vehicle.unfaelle.length > 0 ? (
                  <div className="space-y-4">
                    {vehicle.unfaelle.map((unfall, index) => (
                      <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="font-medium text-gray-900">
                              {new Date(unfall.date).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                          {unfall.damage && (
                            <Badge variant="secondary" className="bg-red-100 text-red-700">
                              {unfall.damage}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{unfall.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                    <p className="text-green-600 font-medium mb-1">Keine Unfälle! 🎉</p>
                    <p className="text-sm text-gray-500">Dieses Fahrzeug hat eine saubere Bilanz</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: Equipment */}
          <TabsContent value="equipment" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Equipment ({vehicle.equipment?.length || 0})</CardTitle>
                  <Button 
                    size="sm" 
                    onClick={() => setEquipmentDialogOpen(true)}
                    className="gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Equipment hinzufügen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {vehicle.equipment && vehicle.equipment.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vehicle.equipment.map((item) => (
                      <div key={item.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        {/* Equipment Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                            {item.serial_number && (
                              <p className="text-xs text-gray-500">SN: {item.serial_number}</p>
                            )}
                          </div>
                          <Badge 
                            variant="secondary"
                            className={
                              item.status === 'AKTIV' 
                                ? 'bg-green-100 text-green-700'
                                : item.status === 'WARTUNG'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }
                          >
                            {item.status === 'AKTIV' && '✅ Aktiv'}
                            {item.status === 'WARTUNG' && '🔧 Wartung'}
                            {item.status === 'DEFEKT' && '❌ Defekt'}
                          </Badge>
                        </div>

                        {/* Equipment Images */}
                        {item.images.length > 0 && (
                          <div className="mb-3">
                            <img
                              src={item.images[0]}
                              alt={item.name}
                              className="w-full h-32 object-cover rounded-md"
                            />
                          </div>
                        )}

                        {/* Equipment Description */}
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                        )}

                        {/* Equipment Dates */}
                        <div className="space-y-2 text-xs text-gray-500">
                          {item.purchase_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              <span>Angeschafft: {new Date(item.purchase_date).toLocaleDateString('de-DE')}</span>
                            </div>
                          )}
                          {item.next_maintenance && (
                            <div className="flex items-center gap-2">
                              <Wrench className="w-3 h-3" />
                              <span>Wartung: {new Date(item.next_maintenance).toLocaleDateString('de-DE')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-3" />
                    <p className="mb-4">Noch kein Equipment erfasst</p>
                    <Button 
                      size="sm"
                      onClick={() => setEquipmentDialogOpen(true)}
                      className="gap-2"
                    >
                      <Package className="w-4 h-4" />
                      Erstes Equipment hinzufügen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Equipment Dialog */}
      <EquipmentAddDialog
        open={equipmentDialogOpen}
        onClose={() => setEquipmentDialogOpen(false)}
        onSave={handleAddEquipment}
      />
    </div>
  );
}

// Label component
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-medium text-gray-700 mb-2 block">
      {children}
    </label>
  );
}
