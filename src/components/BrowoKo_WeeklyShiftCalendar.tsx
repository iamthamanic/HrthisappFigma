/**
 * @file BrowoKo_WeeklyShiftCalendar.tsx
 * @version 2.1.0
 * @description Horizontale Wochenansicht für Schichtplanung (24h scrollbar)
 * 
 * Features:
 * - KW oben mit Navigation (← →)
 * - Wochentage vertikal (Montag bis Sonntag)
 * - Zeit horizontal (00:00 - 24:00) - SCROLLBAR
 * - Schichten als farbige horizontale Balken mit Profilbild + Name
 */

import { format, getWeek, addDays, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { ChevronLeft, ChevronRight } from './icons/BrowoKoIcons';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture?: string;
  specialization?: string;
}

interface Shift {
  id: string;
  user_id: string;
  date: string; // "2025-01-20"
  shift_type: string;
  start_time: string; // "08:00"
  end_time: string; // "17:00"
  location_id?: string;
  department_id?: string;
  specialization?: string;
  notes?: string;
}

interface Props {
  selectedWeek: Date;
  shifts: Shift[];
  users: User[];
  onWeekChange: (newWeek: Date) => void;
  getSpecializationColor: (spec: string) => string;
}

// Timeline-Konfiguration (24 Stunden)
const START_HOUR = 0; // 0:00
const END_HOUR = 24; // 24:00
const HOUR_SLOTS = Array.from({ length: (END_HOUR - START_HOUR) * 2 + 1 }, (_, i) => {
  const hour = START_HOUR + Math.floor(i / 2);
  const minutes = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minutes}`;
});

const WEEKDAYS = [
  { short: 'Montag', long: 'Montag' },
  { short: 'Dienstag', long: 'Dienstag' },
  { short: 'Mittwoch', long: 'Mittwoch' },
  { short: 'Donnerstag', long: 'Donnerstag' },
  { short: 'Freitag', long: 'Freitag' },
  { short: 'Samstag', long: 'Samstag' },
  { short: 'Sonntag', long: 'Sonntag' },
];

export function BrowoKo_WeeklyShiftCalendar({
  selectedWeek,
  shifts,
  users,
  onWeekChange,
  getSpecializationColor,
}: Props) {
  const weekNumber = getWeek(selectedWeek, { weekStartsOn: 1, locale: de });
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });

  // Helpers für Zeit-Berechnung
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const calculatePosition = (startTime: string): number => {
    const startMinutes = timeToMinutes(startTime);
    const timelineStartMinutes = START_HOUR * 60;
    const timelineWidthMinutes = (END_HOUR - START_HOUR) * 60;
    return ((startMinutes - timelineStartMinutes) / timelineWidthMinutes) * 100;
  };

  const calculateWidth = (startTime: string, endTime: string): number => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const durationMinutes = endMinutes - startMinutes;
    const timelineWidthMinutes = (END_HOUR - START_HOUR) * 60;
    return (durationMinutes / timelineWidthMinutes) * 100;
  };

  // Navigation
  const handlePreviousWeek = () => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    onWeekChange(newWeek);
  };

  const handleNextWeek = () => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    onWeekChange(newWeek);
  };

  const handleToday = () => {
    onWeekChange(new Date());
  };

  return (
    <div className="flex flex-col w-full">
      {/* Header: KW Navigation */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousWeek}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="font-semibold text-lg px-4">
            KW {weekNumber}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextWeek}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
        >
          Heute
        </Button>
      </div>

      {/* Scrollable Timeline Container */}
      <div className="w-full overflow-x-auto overflow-y-auto border border-gray-200 rounded-md max-h-[500px] md:max-h-[600px] xl:max-h-[calc(100vh-24rem)]">
        <div className="min-w-[1400px] md:min-w-[1800px]">
          {/* Timeline Header: Hours - 25 Spalten für 0:00 bis 24:00 */}
          <div className="grid gap-0 border-b border-gray-200 bg-gray-50 sticky top-0 z-10" style={{ gridTemplateColumns: `120px repeat(${END_HOUR - START_HOUR + 1}, 1fr)` }}>
            <div className="px-2 md:px-4 py-2 border-r border-gray-200 font-medium text-xs md:text-sm bg-gray-50 sticky left-0 z-20">Tag</div>
            {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => {
              const hour = START_HOUR + i;
              return (
                <div
                  key={i}
                  className="text-center text-xs text-gray-600 py-2 border-r border-gray-200"
                >
                  {`${hour.toString().padStart(2, '0')}:00`}
                </div>
              );
            })}
          </div>

          {/* Week Rows */}
          <div>
            {WEEKDAYS.map((weekday, dayIndex) => {
              const currentDate = addDays(weekStart, dayIndex);
              const dateStr = format(currentDate, 'yyyy-MM-dd');
              const dayShifts = shifts.filter((s) => s.date === dateStr);

              // Check if today
              const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;
              const isPast = new Date(dateStr) < new Date(format(new Date(), 'yyyy-MM-dd'));

              return (
                <div
                  key={dayIndex}
                  className={`relative min-h-[80px] border-b border-gray-200 ${
                    isToday ? 'bg-blue-50' : isPast ? 'bg-gray-50' : 'bg-white'
                  }`}
                  style={{ 
                    display: 'grid',
                    gridTemplateColumns: `120px repeat(${END_HOUR - START_HOUR + 1}, 1fr)`,
                    minHeight: `${Math.max(80, dayShifts.length * 44 + 16)}px`
                  }}
                >
                  {/* Day Label */}
                  <div className={`px-2 md:px-4 py-2 md:py-3 border-r border-gray-200 flex flex-col justify-start sticky left-0 z-20 ${
                    isToday ? 'bg-blue-50' : isPast ? 'bg-gray-50' : 'bg-white'
                  }`}>
                    <div className={`text-sm md:text-base font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {weekday.long}
                    </div>
                    <div className="text-xs md:text-sm text-gray-500">
                      {format(currentDate, 'd. MMM', { locale: de })}
                    </div>
                    {dayShifts.length === 0 && (
                      <div className="text-xs text-gray-400 mt-1 hidden md:block">
                        Keine Schichten
                      </div>
                    )}
                  </div>

                  {/* Timeline Grid Cells with borders - 25 Spalten für 0:00 bis 24:00 */}
                  {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, hourIndex) => (
                    <div
                      key={hourIndex}
                      className="border-r border-gray-200"
                    />
                  ))}

                  {/* Shifts Container - absolute positioned over grid */}
                  <div 
                    className="absolute left-[120px] right-0 top-0 bottom-0 pointer-events-none"
                  >
                    <div className="relative w-full h-full pointer-events-auto">

                    {/* Shift Blocks - Stacked vertically */}
                    <div className="relative z-10 px-2" style={{ minHeight: `${dayShifts.length * 44}px` }}>
                      {dayShifts.map((shift, shiftIndex) => {
                        const user = users.find((u) => u.id === shift.user_id);
                        if (!user) return null;

                        const leftPos = calculatePosition(shift.start_time);
                        const width = calculateWidth(shift.start_time, shift.end_time);
                        const color = getSpecializationColor(
                          shift.specialization || user.specialization || ''
                        );

                        return (
                          <div
                            key={shift.id}
                            className="relative group cursor-pointer hover:z-20"
                            style={{
                              position: 'absolute',
                              left: `${leftPos}%`,
                              top: `${shiftIndex * 44}px`,
                              width: `${width}%`,
                              minWidth: '120px',
                              height: '40px',
                            }}
                          >
                            <div
                              className="flex items-center gap-2 px-2 py-1.5 rounded shadow-sm hover:shadow-md transition-shadow border border-gray-300 h-full"
                              style={{ backgroundColor: color }}
                            >
                              {/* Avatar */}
                              <Avatar className="h-6 w-6 border border-white flex-shrink-0">
                                {user.profile_picture ? (
                                  <AvatarImage src={user.profile_picture} alt={user.first_name} />
                                ) : null}
                                <AvatarFallback className="text-xs">
                                  {user.first_name[0]}{user.last_name[0]}
                                </AvatarFallback>
                              </Avatar>

                              {/* Name & Time */}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-gray-900 truncate">
                                  {user.last_name}, {user.first_name}
                                </div>
                                <div className="text-xs text-gray-700">
                                  {shift.start_time}-{shift.end_time}
                                </div>
                              </div>

                              {/* Specialization Badge (optional, nur bei hover) */}
                              {shift.specialization && (
                                <Badge
                                  variant="secondary"
                                  className="hidden group-hover:inline-flex text-xs h-5 flex-shrink-0"
                                >
                                  {shift.specialization}
                                </Badge>
                              )}
                            </div>

                            {/* Tooltip on hover */}
                            <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-30">
                              <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                                <div className="font-medium">
                                  {user.first_name} {user.last_name}
                                </div>
                                <div>{shift.start_time} - {shift.end_time}</div>
                                {shift.notes && <div className="text-gray-300">{shift.notes}</div>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-gray-600 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded" />
          <span>Heute</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded" />
          <span>Vergangene Tage</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border border-gray-200 rounded" />
          <span>Zukünftige Tage</span>
        </div>
      </div>
    </div>
  );
}
