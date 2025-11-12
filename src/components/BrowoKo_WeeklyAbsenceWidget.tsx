/**
 * @file BrowoKo_WeeklyAbsenceWidget.tsx
 * @version 1.0.0
 * @description Zeigt Abwesenheiten (Krank/Urlaub) für die ausgewählte Woche
 * 
 * Features:
 * - Profilbilder der abwesenden Mitarbeiter
 * - Hover zeigt Details (von-bis, Typ)
 * - Gruppierung nach Abwesenheitstyp
 */

import { useState, useEffect, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Badge } from './ui/badge';
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '../utils/supabase/client';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  profile_picture?: string;
}

interface LeaveRequest {
  id: string;
  user_id: string;
  type: 'SICK' | 'VACATION' | 'UNPAID';
  start_date: string;
  end_date: string;
  status: string;
  user?: User;
}

interface WeeklyAbsenceWidgetProps {
  selectedWeek: Date;
}

const LEAVE_TYPE_LABELS = {
  SICK: 'Krank',
  VACATION: 'Urlaub',
  UNPAID: 'Unbezahlte Abwesenheit'
};

const LEAVE_TYPE_COLORS = {
  SICK: 'bg-red-100 text-red-700 border-red-300',
  VACATION: 'bg-blue-100 text-blue-700 border-blue-300',
  UNPAID: 'bg-gray-100 text-gray-700 border-gray-300'
};

export function BrowoKo_WeeklyAbsenceWidget({ selectedWeek }: WeeklyAbsenceWidgetProps) {
  const [absences, setAbsences] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch absences for selected week
  useEffect(() => {
    const fetchAbsences = async () => {
      setLoading(true);
      try {
        const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });

        const { data, error } = await supabase
          .from('leave_requests')
          .select(`
            id,
            user_id,
            type,
            start_date,
            end_date,
            status
          `)
          .eq('status', 'approved')
          .gte('end_date', format(weekStart, 'yyyy-MM-dd'))
          .lte('start_date', format(weekEnd, 'yyyy-MM-dd'))
          .order('start_date', { ascending: true });

        if (error) {
          console.error('Error fetching absences:', error);
          return;
        }

        // Fetch user details for each leave request
        if (data && data.length > 0) {
          const userIds = [...new Set(data.map(item => item.user_id))];
          const { data: usersData } = await supabase
            .from('users')
            .select('id, first_name, last_name, profile_picture')
            .in('id', userIds);

          const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);
          
          const transformedData = data.map(item => ({
            ...item,
            user: usersMap.get(item.user_id)
          }));

          setAbsences(transformedData as LeaveRequest[]);
        } else {
          setAbsences([]);
        }
      } catch (error) {
        console.error('Error fetching absences:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAbsences();
  }, [selectedWeek]);

  // Group absences by type
  const groupedAbsences = useMemo(() => {
    const groups: Record<string, LeaveRequest[]> = {
      SICK: [],
      VACATION: [],
      UNPAID: []
    };

    absences.forEach(absence => {
      if (absence.type && groups[absence.type]) {
        groups[absence.type].push(absence);
      }
    });

    return groups;
  }, [absences]);

  // Get total count
  const totalAbsences = absences.length;

  if (loading) {
    return (
      <div className="pt-3 border-t">
        <div className="text-xs text-gray-500">Lade Abwesenheiten...</div>
      </div>
    );
  }

  if (totalAbsences === 0) {
    return (
      <div className="pt-3 border-t">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">Abwesenheiten</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">0</Badge>
        </div>
        <p className="text-[11px] text-gray-500">Keine Abwesenheiten diese Woche</p>
      </div>
    );
  }

  return (
    <div className="pt-3 border-t space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">Abwesenheiten</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{totalAbsences}</Badge>
      </div>

      {/* Absence Groups */}
      <div className="space-y-2">
        {Object.entries(groupedAbsences).map(([type, items]) => {
          if (items.length === 0) return null;

          return (
            <div key={type} className="space-y-1.5">
              {/* Type Label */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-gray-600">
                  {LEAVE_TYPE_LABELS[type as keyof typeof LEAVE_TYPE_LABELS]}:
                </span>
                <span className="text-[10px] text-gray-500">({items.length})</span>
              </div>

              {/* Avatars */}
              <div className="flex flex-wrap gap-1.5">
                <TooltipProvider>
                  {items.map(absence => {
                    const user = absence.user;
                    if (!user) return null;

                    const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
                    const startDate = parseISO(absence.start_date);
                    const endDate = parseISO(absence.end_date);

                    return (
                      <Tooltip key={absence.id}>
                        <TooltipTrigger asChild>
                          <div className={`relative rounded-full ring-2 ${LEAVE_TYPE_COLORS[type as keyof typeof LEAVE_TYPE_COLORS]} ring-offset-1 cursor-pointer hover:scale-110 transition-transform`}>
                            <Avatar className="h-7 w-7">
                              {user.profile_picture && (
                                <AvatarImage src={user.profile_picture} alt={`${user.first_name} ${user.last_name}`} />
                              )}
                              <AvatarFallback className="text-[10px]">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px]">
                          <div className="space-y-1">
                            <p className="font-semibold text-xs">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-[11px] text-gray-600">
                              {LEAVE_TYPE_LABELS[type as keyof typeof LEAVE_TYPE_LABELS]}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {format(startDate, 'dd.MM.yyyy', { locale: de })} - {format(endDate, 'dd.MM.yyyy', { locale: de })}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
