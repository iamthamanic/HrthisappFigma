/**
 * @file FieldManagementScreen.tsx
 * @version 4.5.8
 * @description Field Management Admin Screen with Vehicle Management System + List Layout
 * 
 * Features:
 * - Tab 1: Tourenplanung
 * - Tab 2: Fahrzeuge (MIT KOMPLETTEM FAHRZEUGVERWALTUNGSSYSTEM!)
 * - Tab 3: Sonstige Arbeiten
 * - Desktop Responsive (pt-20 md:pt-6 for top nav)
 * - Vehicle Add Dialog
 * - Vehicle List Layout (wie Team Verwaltung!)
 * - Checkboxes zum Auswählen
 * - Bulk Delete Action
 * - Click to view details
 * - VOLLTEXT-SCHNELLSUCHE (Kennzeichen, Modell, Typ, Ladekapazität, Daten)
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Truck, Wrench, Search, X, Trash2 } from '../../components/icons/HRTHISIcons';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { VehicleAddDialog, type VehicleFormData } from '../../components/HRTHIS_VehicleAddDialog';
import { VehicleListItem } from '../../components/HRTHIS_VehicleListItem';
import { toast } from 'sonner@2.0.3';

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
  created_at: string;
  thumbnail?: string;
}

export default function FieldManagementScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tourenplanung');
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);

  // Load vehicles from localStorage
  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = () => {
    try {
      const stored = localStorage.getItem('vehicles');
      if (stored) {
        setVehicles(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Load vehicles error:', error);
    }
  };

  // Save vehicle
  const handleSaveVehicle = async (vehicleData: VehicleFormData) => {
    try {
      // Convert File objects to data URLs for storage
      const imageUrls: string[] = [];
      for (const file of vehicleData.images) {
        const url = await fileToDataURL(file);
        imageUrls.push(url);
      }

      const documentUrls: { name: string; url: string }[] = [];
      for (const file of vehicleData.documents) {
        const url = await fileToDataURL(file);
        documentUrls.push({ name: file.name, url });
      }

      const newVehicle: Vehicle = {
        id: vehicleData.id || crypto.randomUUID(),
        kennzeichen: vehicleData.kennzeichen,
        modell: vehicleData.modell,
        fahrzeugtyp: vehicleData.fahrzeugtyp,
        ladekapazitaet: vehicleData.ladekapazitaet,
        dienst_start: vehicleData.dienst_start,
        letzte_wartung: vehicleData.letzte_wartung,
        images: imageUrls,
        documents: documentUrls,
        wartungen: [],
        unfaelle: [],
        created_at: vehicleData.created_at || new Date().toISOString(),
        thumbnail: imageUrls[0] || undefined,
      };

      const updatedVehicles = [...vehicles, newVehicle];
      setVehicles(updatedVehicles);
      localStorage.setItem('vehicles', JSON.stringify(updatedVehicles));

      toast.success('Fahrzeug erfolgreich hinzugefügt! 🚗');
    } catch (error) {
      console.error('Save vehicle error:', error);
      toast.error('Fehler beim Speichern des Fahrzeugs');
    }
  };

  // Helper: Convert File to Data URL
  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Navigate to vehicle details
  const handleVehicleClick = (vehicleId: string) => {
    navigate(`/admin/vehicle/${vehicleId}`);
  };

  // Handle select single vehicle
  const handleSelectVehicle = (vehicleId: string, checked: boolean) => {
    if (checked) {
      setSelectedVehicles(prev => [...prev, vehicleId]);
    } else {
      setSelectedVehicles(prev => prev.filter(id => id !== vehicleId));
    }
  };

  // Handle select all vehicles
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVehicles(filteredVehicles.map(v => v.id));
    } else {
      setSelectedVehicles([]);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedVehicles.length === 0) return;

    if (!confirm(`Möchtest du ${selectedVehicles.length} Fahrzeug(e) wirklich löschen?`)) {
      return;
    }

    const updatedVehicles = vehicles.filter(v => !selectedVehicles.includes(v.id));
    setVehicles(updatedVehicles);
    localStorage.setItem('vehicles', JSON.stringify(updatedVehicles));
    setSelectedVehicles([]);
    toast.success(`${selectedVehicles.length} Fahrzeug(e) gelöscht`);
  };

  // Filter vehicles based on search query - VOLLTEXT SUCHE!
  const filteredVehicles = useMemo(() => {
    if (!searchQuery.trim()) {
      return vehicles;
    }

    const query = searchQuery.toLowerCase().trim();

    return vehicles.filter(vehicle => {
      // Search in: Kennzeichen, Modell, Fahrzeugtyp, Ladekapazität, Dienst Start, Letzte Wartung
      const searchableText = [
        vehicle.kennzeichen,
        vehicle.modell,
        vehicle.fahrzeugtyp,
        vehicle.ladekapazitaet.toString(),
        vehicle.dienst_start ? new Date(vehicle.dienst_start).toLocaleDateString('de-DE') : '',
        vehicle.letzte_wartung ? new Date(vehicle.letzte_wartung).toLocaleDateString('de-DE') : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [vehicles, searchQuery]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-20 md:pt-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Fieldverwaltung</h1>
          <p className="text-sm text-gray-500 mt-1">Touren, Fahrzeuge und sonstige Arbeiten verwalten</p>
        </div>
      </div>

      {/* Main Content - Desktop Responsive Container */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tabs Navigation */}
          <TabsList className="grid w-full grid-cols-3 h-auto mb-6">
            <TabsTrigger value="tourenplanung" className="tab-trigger-responsive">
              <MapPin className="w-4 h-4" />
              <span>Tourenplanung</span>
            </TabsTrigger>
            <TabsTrigger value="fahrzeuge" className="tab-trigger-responsive">
              <Truck className="w-4 h-4" />
              <span>Fahrzeuge</span>
            </TabsTrigger>
            <TabsTrigger value="sonstige" className="tab-trigger-responsive">
              <Wrench className="w-4 h-4" />
              <span>Sonstige Arbeiten</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Tourenplanung */}
          <TabsContent value="tourenplanung" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                    <MapPin className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Tourenplanung</h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Hier kannst du Touren planen und verwalten
                  </p>
                  <div className="inline-flex flex-col gap-3 text-left max-w-sm">
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-semibold">📍</span>
                      </div>
                      <span>Touren erstellen und bearbeiten</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-semibold">🗺️</span>
                      </div>
                      <span>Routen planen und optimieren</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-semibold">👥</span>
                      </div>
                      <span>Mitarbeiter zuweisen</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-semibold">📅</span>
                      </div>
                      <span>Termine verwalten</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Fahrzeuge (MIT KOMPLETTEM SYSTEM!) */}
          <TabsContent value="fahrzeuge" className="space-y-6">
            {/* Header with Search and Button */}
            <div className="space-y-4">
              {/* Title Row */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Fahrzeugflotte</h2>
                  <p className="text-sm text-gray-500">
                    {filteredVehicles.length} von {vehicles.length} Fahrzeug(en)
                    {searchQuery && ` gefunden`}
                  </p>
                </div>
                <Button 
                  onClick={() => setVehicleDialogOpen(true)}
                  className="gap-2"
                >
                  <Truck className="w-4 h-4" />
                  Neues Fahrzeug
                </Button>
              </div>

              {/* Search Bar - only show if vehicles exist */}
              {vehicles.length > 0 && (
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Suche: Kennzeichen, Modell, Typ, Ladekapazität..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bulk Actions Bar */}
            {selectedVehicles.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedVehicles.length === filteredVehicles.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="font-medium text-gray-900">
                    {selectedVehicles.length} Fahrzeug(e) ausgewählt
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedVehicles([])}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Löschen
                  </Button>
                </div>
              </div>
            )}

            {/* Vehicles List */}
            {vehicles.length > 0 ? (
              filteredVehicles.length > 0 ? (
                <div className="space-y-3">
                  {/* Select All Row */}
                  {filteredVehicles.length > 1 && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
                      <Checkbox
                        checked={selectedVehicles.length === filteredVehicles.length}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm text-gray-600">
                        Alle auswählen ({filteredVehicles.length})
                      </span>
                    </div>
                  )}

                  {/* Vehicle List Items */}
                  {filteredVehicles.map(vehicle => (
                    <VehicleListItem
                      key={vehicle.id}
                      vehicle={vehicle}
                      isSelected={selectedVehicles.includes(vehicle.id)}
                      onSelect={handleSelectVehicle}
                      onClick={() => handleVehicleClick(vehicle.id)}
                    />
                  ))}
                </div>
              ) : (
                // No search results
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                        <Search className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Fahrzeuge gefunden</h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Deine Suche nach "{searchQuery}" ergab keine Treffer.
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => setSearchQuery('')}
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        Suche zurücksetzen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                      <Truck className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Noch keine Fahrzeuge</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Füge dein erstes Fahrzeug hinzu und verwalte deine Flotte
                    </p>
                    <Button 
                      onClick={() => setVehicleDialogOpen(true)}
                      className="gap-2"
                    >
                      <Truck className="w-4 h-4" />
                      Erstes Fahrzeug hinzufügen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 3: Sonstige Arbeiten */}
          <TabsContent value="sonstige" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
                    <Wrench className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sonstige Arbeiten</h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Zusätzliche Aufgaben und Arbeiten
                  </p>
                  <div className="inline-flex flex-col gap-3 text-left max-w-sm">
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-semibold">📝</span>
                      </div>
                      <span>Aufgaben erstellen und zuweisen</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-semibold">✅</span>
                      </div>
                      <span>Status verfolgen und updaten</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-semibold">👥</span>
                      </div>
                      <span>Teams koordinieren</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-semibold">📊</span>
                      </div>
                      <span>Fortschritt dokumentieren</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Vehicle Add Dialog */}
      <VehicleAddDialog
        open={vehicleDialogOpen}
        onOpenChange={setVehicleDialogOpen}
        onSave={handleSaveVehicle}
      />
    </div>
  );
}
