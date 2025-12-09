import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { MapPin, Plus, Pencil, Trash2, X } from '../icons/BrowoKoIcons';
import { Location } from '../../types/database';
import { Badge } from '../ui/badge';
import { useAdminStore } from '../../stores/BrowoKo_adminStore';

interface LocationManagerProps {
  locations?: Location[]; // Optional - will use adminStore if not provided
  onCreateLocation?: (data: Omit<Location, 'id' | 'organization_id' | 'created_at'>) => Promise<void>;
  onUpdateLocation?: (id: string, data: Partial<Location>) => Promise<void>;
  onDeleteLocation?: (id: string) => Promise<void>;
  // NEW: Optional callbacks for unified screen (receive full Location object after DB operation)
  onLocationCreate?: (location: Location) => Promise<void>;
  onLocationUpdate?: (location: Location) => Promise<void>;
  onLocationDelete?: (locationId: string) => Promise<void>;
}

export default function LocationManager({
  locations: locationsProp,
  onCreateLocation,
  onUpdateLocation,
  onDeleteLocation,
  onLocationCreate,
  onLocationUpdate,
  onLocationDelete
}: LocationManagerProps) {
  // Use adminStore if locations not provided
  const adminStore = useAdminStore();
  const locations = locationsProp || adminStore.locations;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Deutschland');

  const resetForm = () => {
    setName('');
    setStreet('');
    setPostalCode('');
    setCity('');
    setCountry('Deutschland');
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (location: Location) => {
    setEditing(location);
    setName(location.name);
    setStreet(location.street || '');
    setPostalCode(location.postal_code || '');
    setCity(location.city || '');
    setCountry(location.country || 'Deutschland');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      street: street.trim() || null,
      postal_code: postalCode.trim() || null,
      city: city.trim() || null,
      country: country.trim() || null
    };

    if (editing) {
      if (onUpdateLocation) {
        await onUpdateLocation(editing.id, data);
      }
      // Call the new callback with full Location object
      if (onLocationUpdate) {
        await onLocationUpdate({ ...editing, ...data });
      }
    } else {
      if (onCreateLocation) {
        await onCreateLocation(data);
      }
      // For create, we need to get the created location from adminStore
      // The new callback will be called after the location is created in adminStore
      const createdLocation = locations.find(l => l.name === data.name);
      if (onLocationCreate && createdLocation) {
        await onLocationCreate(createdLocation);
      }
    }
    resetForm();
  };

  return (
    <Card>
      <CardHeader>
        <div className="card-header-with-actions">
          <div className="card-header-title">
            <MapPin className="w-5 h-5" />
            <CardTitle>Standorte</CardTitle>
          </div>
          <Button
            type="button"
            variant="outline"
            className="card-header-action"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Abbrechen
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Standort hinzufügen
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form */}
        {showForm && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
            <div>
              <Label htmlFor="location_name">Name *</Label>
              <Input
                id="location_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Hauptsitz Berlin"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="location_street">Straße</Label>
                <Input
                  id="location_street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Musterstraße 123"
                />
              </div>
              <div>
                <Label htmlFor="location_postal">PLZ</Label>
                <Input
                  id="location_postal"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="12345"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="location_city">Stadt</Label>
                <Input
                  id="location_city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Berlin"
                />
              </div>
              <div>
                <Label htmlFor="location_country">Land</Label>
                <Input
                  id="location_country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Deutschland"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={resetForm}>
                Abbrechen
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={!name.trim()}>
                {editing ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </div>
          </div>
        )}

        {/* Locations List */}
        {locations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Noch keine Standorte angelegt</p>
          </div>
        ) : (
          <div className="space-y-2">
            {locations.map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{location.name}</p>
                  {(location.street || location.city) && (
                    <p className="text-sm text-gray-500">
                      {[location.street, location.postal_code, location.city, location.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(location)}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (onDeleteLocation) {
                        await onDeleteLocation(location.id);
                      }
                      if (onLocationDelete) {
                        await onLocationDelete(location.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}