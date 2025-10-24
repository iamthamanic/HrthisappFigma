/**
 * @file HRTHIS_VehicleCard.tsx
 * @version 4.5.3
 * @description Vehicle card component for vehicle list
 */

import { Truck, Calendar, Weight } from '../components/icons/HRTHISIcons';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface VehicleCardProps {
  vehicle: {
    id: string;
    kennzeichen: string;
    fahrzeugtyp: string;
    ladekapazitaet: number;
    letzte_wartung?: string;
    thumbnail?: string;
  };
  onClick: () => void;
}

export function VehicleCard({ vehicle, onClick }: VehicleCardProps) {
  return (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Thumbnail */}
        <div className="relative h-40 bg-gray-100 rounded-t-lg overflow-hidden">
          {vehicle.thumbnail ? (
            <img
              src={vehicle.thumbnail}
              alt={vehicle.kennzeichen}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Truck className="w-16 h-16 text-gray-300" />
            </div>
          )}
          
          {/* Kennzeichen Badge */}
          <div className="absolute top-2 left-2 bg-white px-3 py-1.5 rounded-lg shadow-md">
            <span className="font-bold text-gray-900">{vehicle.kennzeichen}</span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 space-y-3">
          {/* Type */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {vehicle.fahrzeugtyp}
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Weight className="w-4 h-4" />
              <span>{vehicle.ladekapazitaet.toLocaleString('de-DE')} kg</span>
            </div>
            
            {vehicle.letzte_wartung && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  Wartung: {new Date(vehicle.letzte_wartung).toLocaleDateString('de-DE')}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
