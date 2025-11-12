/**
 * @file BrowoKo_EmployeeInfoCard.tsx
 * @version 1.0.0
 * @description Detaillierte Mitarbeiter-Informationskarte für Schichtplanung
 * 
 * Features:
 * - Mitarbeiter-Profil (Standort, Abteilung, Spezialisierung)
 * - Monatliche Stunden (Soll/Ist)
 * - Letzte Aktivität (Arbeitstag, Ausstempel-Zeit)
 * - Durchschnittliche Schichtzeiten (7/14/30 Tage)
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Clock, MapPin, Briefcase, Calendar, TrendingUp, LogOut } from '../components/icons/BrowoKoIcons';
import { format, startOfMonth, endOfMonth, subDays, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '../utils/supabase/client';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture?: string;
  location_id?: string;
  department?: string;
  specialization?: string;
  weekly_hours?: number;
}

interface Location {
  id: string;
  name: string;
}

interface TimeRecord {
  id: string;
  user_id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  total_hours: number | null;
}

interface Shift {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
}

interface EmployeeInfoCardProps {
  selectedUser: User | null;
  locations: Location[];
  onAssignShift?: (user: User) => void;
}

type TimeRangeFilter = 7 | 14 | 30;

export function BrowoKo_EmployeeInfoCard({ selectedUser, locations, onAssignShift }: EmployeeInfoCardProps) {
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>(7);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch time records and shifts when user is selected
  useEffect(() => {
    if (!selectedUser) {
      setTimeRecords([]);
      setShifts([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
        const rangeStart = format(subDays(now, timeRange), 'yyyy-MM-dd');
        const rangeEnd = format(now, 'yyyy-MM-dd');

        // Fetch time records for current month
        const { data: recordsData, error: recordsError } = await supabase
          .from('time_records')
          .select('*')
          .eq('user_id', selectedUser.id)
          .gte('date', monthStart)
          .lte('date', monthEnd)
          .order('date', { ascending: false });

        if (recordsError) {
          console.error('Error fetching time records:', recordsError);
        }

        // Fetch shifts for selected time range
        const { data: shiftsData, error: shiftsError } = await supabase
          .from('shifts')
          .select('*')
          .eq('user_id', selectedUser.id)
          .gte('date', rangeStart)
          .lte('date', rangeEnd)
          .order('date', { ascending: false });

        if (shiftsError) {
          console.error('Error fetching shifts:', shiftsError);
        }

        setTimeRecords(recordsData || []);
        setShifts(shiftsData || []);
      } catch (error) {
        console.error('Error fetching employee data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedUser, timeRange]);

  // Calculate monthly hours
  const monthlyHours = useMemo(() => {
    if (!selectedUser) return { target: 0, worked: 0, percentage: 0 };

    const now = new Date();
    const daysInMonth = endOfMonth(now).getDate();
    const currentDay = now.getDate();
    
    // Calculate target hours based on weekly hours
    const weeklyHours = selectedUser.weekly_hours || 40;
    const totalMonthHours = (weeklyHours / 7) * daysInMonth;
    const targetHoursToDate = (weeklyHours / 7) * currentDay;

    // Calculate worked hours from time records
    const workedHours = timeRecords
      .filter(r => r.total_hours)
      .reduce((sum, r) => sum + (r.total_hours || 0), 0);

    const percentage = targetHoursToDate > 0 ? (workedHours / targetHoursToDate) * 100 : 0;

    return {
      target: Math.round(targetHoursToDate * 10) / 10,
      worked: Math.round(workedHours * 10) / 10,
      total: Math.round(totalMonthHours * 10) / 10,
      percentage: Math.round(percentage)
    };
  }, [selectedUser, timeRecords]);

  // Get last time record
  const lastTimeRecord = useMemo(() => {
    if (timeRecords.length === 0) return null;
    return timeRecords[0]; // Already sorted by date desc
  }, [timeRecords]);

  // Calculate average shift times
  const averageShiftTimes = useMemo(() => {
    if (shifts.length === 0) return null;

    const totalMinutes = shifts.reduce((sum, shift) => {
      const start = new Date(`2000-01-01 ${shift.start_time}`);
      const end = new Date(`2000-01-01 ${shift.end_time}`);
      let minutes = (end.getTime() - start.getTime()) / 60000;
      
      // Handle overnight shifts
      if (minutes < 0) minutes += 24 * 60;
      
      return sum + minutes;
    }, 0);

    const avgMinutes = totalMinutes / shifts.length;
    const avgHours = Math.floor(avgMinutes / 60);
    const avgMins = Math.round(avgMinutes % 60);

    // Calculate most common start time
    const startTimes = shifts.map(s => s.start_time);
    const startTimeCount = startTimes.reduce((acc, time) => {
      acc[time] = (acc[time] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostCommonStart = Object.entries(startTimeCount).sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      avgDuration: `${avgHours}h ${avgMins}m`,
      avgHours,
      avgMins,
      mostCommonStart: mostCommonStart || 'N/A',
      shiftCount: shifts.length
    };
  }, [shifts]);

  // Get location name
  const locationName = useMemo(() => {
    if (!selectedUser?.location_id) return 'Nicht zugewiesen';
    const location = locations.find(l => l.id === selectedUser.location_id);
    return location?.name || 'Unbekannt';
  }, [selectedUser, locations]);

  // Empty State
  if (!selectedUser) {
    return (
      <Card className="flex flex-col h-[480px]">
        <CardContent className="flex items-center justify-center flex-1">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 max-w-[200px]">
              Bitte Mitarbeiter:in auswählen um Informationen zu erhalten
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get initials
  const initials = `${selectedUser.first_name.charAt(0)}${selectedUser.last_name.charAt(0)}`.toUpperCase();

  return (
    <Card className="flex flex-col h-[480px]">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Mitarbeiter-Informationen</CardTitle>
          <Button
            variant="default"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onAssignShift?.(selectedUser)}
          >
            Schicht zuweisen
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 overflow-y-auto">
        {/* Profile Section */}
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            {selectedUser.profile_picture && (
              <AvatarImage src={selectedUser.profile_picture} alt={`${selectedUser.first_name} ${selectedUser.last_name}`} />
            )}
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">
              {selectedUser.first_name} {selectedUser.last_name}
            </h3>
            <p className="text-xs text-gray-500 truncate">{selectedUser.email}</p>
          </div>
        </div>

        <Separator />

        {/* Location, Department, Specialization */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600">Standort:</span>
            <span className="font-medium truncate">{locationName}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Briefcase className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600">Abteilung:</span>
            <span className="font-medium truncate">{selectedUser.department || 'Nicht zugewiesen'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600">Spezialisierung:</span>
            <span className="font-medium truncate">{selectedUser.specialization || 'Nicht zugewiesen'}</span>
          </div>
        </div>

        <Separator />

        {/* Monthly Hours */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">Stunden im {format(new Date(), 'MMMM', { locale: de })}</span>
            <Badge variant={monthlyHours.percentage >= 90 ? 'default' : monthlyHours.percentage >= 70 ? 'secondary' : 'destructive'} className="text-xs">
              {monthlyHours.percentage}%
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Geleistet:</span>
              <span className="font-semibold text-green-600">{monthlyHours.worked}h</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Soll (bisher):</span>
              <span className="font-medium">{monthlyHours.target}h</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Monatssoll gesamt:</span>
              <span>{monthlyHours.total}h</span>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                monthlyHours.percentage >= 90 ? 'bg-green-500' :
                monthlyHours.percentage >= 70 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(monthlyHours.percentage, 100)}%` }}
            />
          </div>
        </div>

        <Separator />

        {/* Last Activity */}
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">Letzte Aktivität</h4>
          {lastTimeRecord ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">Letzter Arbeitstag:</span>
                <span className="font-medium">
                  {format(new Date(lastTimeRecord.date), 'dd.MM.yyyy', { locale: de })}
                </span>
              </div>
              {lastTimeRecord.time_out && (
                <div className="flex items-center gap-2 text-xs">
                  <LogOut className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">Ausgestempelt um:</span>
                  <span className="font-medium">
                    {lastTimeRecord.time_out} Uhr
                  </span>
                </div>
              )}
              {lastTimeRecord.total_hours && (
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">Arbeitszeit:</span>
                  <span className="font-medium">
                    {lastTimeRecord.total_hours}h
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500">Keine Aktivitäten im aktuellen Monat</p>
          )}
        </div>

        <Separator />

        {/* Average Shift Times */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-gray-700">Durchschn. Schichtzeiten</h4>
            <div className="flex gap-1">
              {[7, 14, 30].map((days) => (
                <Button
                  key={days}
                  size="sm"
                  variant={timeRange === days ? 'default' : 'ghost'}
                  className="h-6 px-2 text-xs"
                  onClick={() => setTimeRange(days as TimeRangeFilter)}
                >
                  {days}T
                </Button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="text-xs text-gray-500">Lade Daten...</div>
          ) : averageShiftTimes ? (
            <div className="space-y-2">
              <div className="bg-blue-50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Ø Schichtlänge:</span>
                  <span className="font-semibold text-blue-700">{averageShiftTimes.avgDuration}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Häufigster Start:</span>
                  <span className="font-medium">{averageShiftTimes.mostCommonStart} Uhr</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Schichten gesamt:</span>
                  <span>{averageShiftTimes.shiftCount}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Keine Schichten in den letzten {timeRange} Tagen</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
