/**
 * @file BrowoKo_DraggableUser.tsx
 * @version 3.0.0
 * @description Draggable user component with shift assignment, overview and detailed employee info
 */

import { useState, useEffect, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ChevronDown, ChevronRight, Edit, Trash2, MapPin, Building2, Briefcase, Star } from './icons/BrowoKoIcons';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '../utils/supabase/client';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  specialization?: string;
  location_id?: string;
  department?: string;
  profile_picture?: string | null;
  position?: string;
}

interface Location {
  id: string;
  name: string;
}

interface Shift {
  id: string;
  date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  location_id?: string;
  department_id?: string;
  notes?: string;
}

interface Props {
  user: User;
  hasShift?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onAssignShift?: (user: User) => void;
  getUserShifts?: (userId: string) => Promise<Shift[]>;
  onEditShift?: (shift: Shift) => void;
  onDeleteShift?: (shiftId: string) => void;
  locations?: Location[];
}

export function BrowoKo_DraggableUser({ 
  user, 
  hasShift = false,
  isSelected = false,
  onClick,
  onAssignShift,
  getUserShifts,
  onEditShift,
  onDeleteShift,
  locations = [],
}: Props) {
  const [isShiftsOpen, setIsShiftsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);

  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();

  // Get the proper profile picture URL
  const profilePictureUrl = useMemo(() => {
    if (!user.profile_picture) return undefined;

    // If it's already a full URL (starts with http:// or https://), use it as-is
    if (user.profile_picture.startsWith('http://') || user.profile_picture.startsWith('https://')) {
      return user.profile_picture;
    }

    // If it's a Base64 string (starts with data:), use it as-is
    if (user.profile_picture.startsWith('data:')) {
      return user.profile_picture;
    }

    // Otherwise, it's a storage path - convert to public URL
    try {
      const { data } = supabase.storage
        .from('make-f659121d-profile-pictures')
        .getPublicUrl(user.profile_picture);
      
      return data.publicUrl;
    } catch (error) {
      console.warn('Failed to get public URL for profile picture:', error);
      return undefined;
    }
  }, [user.profile_picture]);
  
  // Get location name from ID
  const getLocationName = (locationId?: string) => {
    if (!locationId) return 'Nicht zugewiesen';
    const location = locations.find(l => l.id === locationId);
    return location?.name || locationId;
  };

  // Load shifts when dropdown is opened
  useEffect(() => {
    if (isShiftsOpen && getUserShifts && shifts.length === 0) {
      setLoading(true);
      getUserShifts(user.id)
        .then((data) => setShifts(data))
        .finally(() => setLoading(false));
    }
  }, [isShiftsOpen, getUserShifts, user.id]);

  const handleAssignClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAssignShift?.(user);
  };

  const getShiftTypeLabel = (type: string) => {
    switch (type) {
      case 'MORNING':
        return '🌅 Früh';
      case 'AFTERNOON':
        return '☀️ Spät';
      case 'NIGHT':
        return '🌙 Nacht';
      default:
        return type;
    }
  };

  const handleCardClick = () => {
    // Update info card without opening dialog
    onClick?.();
  };

  return (
    <div 
      className={`border rounded-lg overflow-hidden bg-white cursor-pointer hover:border-blue-500 hover:shadow-md transition-all ${
        isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200'
      }`}
      onClick={handleCardClick}
    >
      {/* User Header with Avatar, Name, and Action Button */}
      <div className="flex items-center gap-3 p-3">
        <Avatar className="h-9 w-9 flex-shrink-0">
          {profilePictureUrl && (
            <AvatarImage src={profilePictureUrl} alt={user.first_name} />
          )}
          <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {user.first_name} {user.last_name}
          </div>
        </div>

        {hasShift && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 flex-shrink-0">
            Geplant
          </Badge>
        )}

        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-7 text-[11px] px-2.5 flex-shrink-0"
          onClick={handleAssignClick}
        >
          Schicht zuweisen
        </Button>
      </div>

      {/* Mitarbeiterinformationen Dropdown */}
      <Collapsible open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <div className="px-3 pb-2">
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs justify-start px-2 hover:bg-gray-100"
            >
              {isInfoOpen ? (
                <ChevronDown className="h-3 w-3 mr-1.5" />
              ) : (
                <ChevronRight className="h-3 w-3 mr-1.5" />
              )}
              Mitarbeiterinformationen
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2 text-xs">
            {/* Position */}
            {user.position && (
              <div className="flex items-start gap-2">
                <Briefcase className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">Position</div>
                  <div className="text-gray-900 truncate">{user.position}</div>
                </div>
              </div>
            )}

            {/* Standort */}
            <div className="flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide">Standort</div>
                <div className="text-gray-900 truncate">{getLocationName(user.location_id)}</div>
              </div>
            </div>

            {/* Abteilung */}
            <div className="flex items-start gap-2">
              <Building2 className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide">Abteilung</div>
                <div className="text-gray-900 truncate">{user.department || 'Nicht zugewiesen'}</div>
              </div>
            </div>

            {/* Spezialisierung */}
            <div className="flex items-start gap-2">
              <Star className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide">Spezialisierung</div>
                <div className="text-gray-900 truncate">{user.specialization || 'Nicht zugewiesen'}</div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Schichten Dropdown (nur wenn Schichten vorhanden) */}
      {hasShift && getUserShifts && (
        <>
          <div className="px-3 pb-2 border-t border-gray-100 pt-2">
            <Collapsible open={isShiftsOpen} onOpenChange={setIsShiftsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs justify-start px-2 hover:bg-gray-100"
                >
                  {isShiftsOpen ? (
                    <ChevronDown className="h-3 w-3 mr-1.5" />
                  ) : (
                    <ChevronRight className="h-3 w-3 mr-1.5" />
                  )}
                  Geplante Schichten
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-2">
                <div className="max-h-[180px] overflow-y-auto">
                  {loading ? (
                    <div className="text-xs text-gray-500 text-center py-3">
                      Lade Schichten...
                    </div>
                  ) : shifts.length === 0 ? (
                    <div className="text-xs text-gray-500 text-center py-3">
                      Keine Schichten gefunden
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {shifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="bg-gray-50 p-2 rounded border border-gray-200 text-xs hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900 text-[11px]">
                                  {format(new Date(shift.date), 'dd.MM.yyyy', { locale: de })}
                                </span>
                                <span className="text-[10px] text-gray-600">
                                  {getShiftTypeLabel(shift.shift_type)}
                                </span>
                              </div>
                              <div className="text-gray-600 text-[11px]">
                                {shift.start_time} - {shift.end_time}
                              </div>
                              {shift.notes && (
                                <div className="text-gray-500 mt-1 italic text-[10px]">
                                  {shift.notes}
                                </div>
                              )}
                            </div>
                            
                            {/* EDIT/DELETE BUTTONS */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {onEditShift && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditShift(shift);
                                  }}
                                  className="h-6 w-6 p-0 hover:bg-blue-50"
                                  title="Schicht bearbeiten"
                                >
                                  <Edit className="h-3 w-3 text-blue-600" />
                                </Button>
                              )}
                              {onDeleteShift && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Schicht wirklich löschen?')) {
                                      onDeleteShift(shift.id);
                                    }
                                  }}
                                  className="h-6 w-6 p-0 hover:bg-red-50"
                                  title="Schicht löschen"
                                >
                                  <Trash2 className="h-3 w-3 text-red-600" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </>
      )}
    </div>
  );
}
