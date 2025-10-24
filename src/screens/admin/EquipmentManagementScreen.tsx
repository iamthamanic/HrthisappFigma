/**
 * @file EquipmentManagementScreen.tsx
 * @version 4.5.9
 * @description Equipment management screen - Overview of all equipment across all vehicles
 * 
 * Features:
 * - Liste aller Equipment Items (alle Fahrzeuge)
 * - Equipment Status Filter (Aktiv/Wartung/Defekt)
 * - Suche
 * - Equipment Details mit Fahrzeug-Zuordnung
 * - Mobile + Desktop Responsive
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, X, Truck, Calendar, Wrench, Filter } from '../../components/icons/HRTHISIcons';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner@2.0.3';

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
  vehicleId: string;
  vehicleKennzeichen: string;
  vehicleModell: string;
}

export default function EquipmentManagementScreen() {
  const navigate = useNavigate();
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AKTIV' | 'WARTUNG' | 'DEFEKT'>('ALL');
  const [loading, setLoading] = useState(true);

  // Load all equipment from all vehicles
  useEffect(() => {
    loadAllEquipment();
  }, []);

  const loadAllEquipment = () => {
    try {
      const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
      const equipment: Equipment[] = [];

      vehicles.forEach((vehicle: any) => {
        if (vehicle.equipment && Array.isArray(vehicle.equipment)) {
          vehicle.equipment.forEach((item: any) => {
            equipment.push({
              ...item,
              vehicleId: vehicle.id,
              vehicleKennzeichen: vehicle.kennzeichen,
              vehicleModell: vehicle.modell,
            });
          });
        }
      });

      setAllEquipment(equipment);
    } catch (error) {
      console.error('Load equipment error:', error);
      toast.error('Fehler beim Laden des Equipments');
    } finally {
      setLoading(false);
    }
  };

  // Filter equipment
  const filteredEquipment = useMemo(() => {
    let filtered = allEquipment;

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const searchableText = [
          item.name,
          item.description,
          item.serial_number,
          item.vehicleKennzeichen,
          item.vehicleModell,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(query);
      });
    }

    return filtered;
  }, [allEquipment, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: allEquipment.length,
      aktiv: allEquipment.filter(e => e.status === 'AKTIV').length,
      wartung: allEquipment.filter(e => e.status === 'WARTUNG').length,
      defekt: allEquipment.filter(e => e.status === 'DEFEKT').length,
    };
  }, [allEquipment]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Equipment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-20 md:pt-6 pb-20 md:pb-8">
      <div className="container-responsive">
        {/* Header */}
        <div className="screen-header">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Equipment Verwaltung</h1>
            <p className="text-gray-600">
              Übersicht über alle Equipment-Items aller Fahrzeuge
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">Gesamt</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Package className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{stats.aktiv}</div>
                <div className="text-sm text-gray-500">Aktiv</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Wrench className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">{stats.wartung}</div>
                <div className="text-sm text-gray-500">Wartung</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <X className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">{stats.defekt}</div>
                <div className="text-sm text-gray-500">Defekt</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Suche: Name, Beschreibung, Seriennummer, Fahrzeug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-48">
                <Select
                  value={statusFilter}
                  onValueChange={(value: 'ALL' | 'AKTIV' | 'WARTUNG' | 'DEFEKT') => setStatusFilter(value)}
                >
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Alle Status</SelectItem>
                    <SelectItem value="AKTIV">✅ Aktiv</SelectItem>
                    <SelectItem value="WARTUNG">🔧 Wartung</SelectItem>
                    <SelectItem value="DEFEKT">❌ Defekt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Info */}
            <div className="mt-4 text-sm text-gray-600">
              {filteredEquipment.length} von {allEquipment.length} Equipment-Items
              {searchQuery && ' gefunden'}
            </div>
          </CardContent>
        </Card>

        {/* Equipment List */}
        {filteredEquipment.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEquipment.map((item) => (
              <Card 
                key={item.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/admin/vehicle/${item.vehicleId}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base mb-1">{item.name}</CardTitle>
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
                      {item.status === 'AKTIV' && '✅'}
                      {item.status === 'WARTUNG' && '🔧'}
                      {item.status === 'DEFEKT' && '❌'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Equipment Image */}
                  {item.images.length > 0 && (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  )}

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Vehicle Info */}
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <div className="text-sm">
                      <div className="font-medium text-blue-900">{item.vehicleKennzeichen}</div>
                      <div className="text-xs text-blue-600">{item.vehicleModell}</div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-1 text-xs text-gray-500">
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
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery || statusFilter !== 'ALL' 
                    ? 'Kein Equipment gefunden'
                    : 'Noch kein Equipment erfasst'
                  }
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {searchQuery || statusFilter !== 'ALL'
                    ? 'Deine Filter ergaben keine Treffer. Versuche andere Suchkriterien.'
                    : 'Füge Equipment zu deinen Fahrzeugen hinzu, um sie hier zu sehen.'
                  }
                </p>
                {(searchQuery || statusFilter !== 'ALL') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                    }}
                  >
                    Filter zurücksetzen
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
