/**
 * @file BrowoKo_VehicleListItem.tsx
 * @version 4.5.8
 * @description Vehicle list item component - List layout wie Team Management
 * 
 * Features:
 * - Thumbnail Image links
 * - Fahrzeugdaten rechts (Kennzeichen, Modell, Typ, Ladekapazität)
 * - Checkbox zum Auswählen
 * - Click to view details
 * - Mobile + Desktop Responsive
 */

import { Truck, Calendar, Weight } from '../components/icons/BrowoKoIcons';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';

interface VehicleListItemProps {
  vehicle: {
    id: string;
    kennzeichen: string;
    modell: string;
    fahrzeugtyp: string;
    ladekapazitaet: number;
    dienst_start?: string;
    letzte_wartung?: string;
    thumbnail?: string;
  };
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onClick: () => void;
}

export function VehicleListItem({ vehicle, isSelected, onSelect, onClick }: VehicleListItemProps) {
  return (
    <div 
      className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all group"
    >
      {/* Checkbox */}
      <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(vehicle.id, checked as boolean)}
          className="w-5 h-5"
        />
      </div>

      {/* Thumbnail */}
      <div 
        className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
        onClick={onClick}
      >
        {vehicle.thumbnail ? (
          <img
            src={vehicle.thumbnail}
            alt={vehicle.kennzeichen}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Truck className="w-10 h-10 text-gray-300" />
          </div>
        )}
      </div>

      {/* Vehicle Info */}
      <div 
        className="flex-1 min-w-0 cursor-pointer" 
        onClick={onClick}
      >
        {/* Row 1: Kennzeichen + Modell */}
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-semibold text-gray-900 text-base">
            {vehicle.kennzeichen}
          </h3>
          <span className="text-gray-600 text-sm truncate">
            {vehicle.modell}
          </span>
        </div>

        {/* Row 2: Fahrzeugtyp Badge + Ladekapazität */}
        <div className="flex flex-wrap items-center gap-3">
          <Badge 
            variant="secondary" 
            className="bg-blue-100 text-blue-700"
          >
            {vehicle.fahrzeugtyp}
          </Badge>
          
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Weight className="w-4 h-4" />
            <span>{vehicle.ladekapazitaet.toLocaleString('de-DE')} kg</span>
          </div>

          {vehicle.dienst_start && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>
                Seit {new Date(vehicle.dienst_start).toLocaleDateString('de-DE')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Arrow Indicator (Desktop only) */}
      <div className="hidden md:flex flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
          <svg 
            className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
