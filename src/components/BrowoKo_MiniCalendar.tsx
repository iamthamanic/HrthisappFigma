/**
 * @file BrowoKo_MiniCalendar.tsx
 * @version 2.1.0
 * @description Mini Calendar for Week Selection with KW display and German holidays (all states)
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from './icons/BrowoKoIcons';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameWeek,
  isToday,
  getWeek,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { useGermanHolidays, FEDERAL_STATES } from '../hooks/useGermanHolidays';

interface Props {
  selectedWeek: Date;
  onWeekChange: (week: Date) => void;
}

export function BrowoKo_MiniCalendar({ selectedWeek, onWeekChange }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Hook für Feiertage (alle Bundesländer - kein Filter)
  const { isHoliday, getHolidayInfo } = useGermanHolidays();

  const previousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const nextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  // Group days into weeks
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const handleDayClick = (day: Date) => {
    const weekStart = startOfWeek(day, { weekStartsOn: 1 });
    onWeekChange(weekStart);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 ml-10">
        <Button variant="ghost" size="sm" onClick={previousMonth} className="h-7 w-7 p-0">
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        <div className="font-medium text-sm text-gray-900">
          {format(currentMonth, 'MMMM yyyy', { locale: de })}
        </div>
        <Button variant="ghost" size="sm" onClick={nextMonth} className="h-7 w-7 p-0">
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Grid: KW + Calendar (8 columns total: 1 for KW + 7 for days) */}
      <div className="grid grid-cols-8 gap-0.5">
        {/* Header Row */}
        <div className="col-span-1" /> {/* Empty cell for KW column */}
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
          <div key={day} className="text-center text-[10px] font-medium text-gray-500 py-0.5">
            {day}
          </div>
        ))}

        {/* Week Rows */}
        <TooltipProvider delayDuration={200}>
          {weeks.map((week, weekIndex) => {
            const weekNumber = getWeek(week[0], { weekStartsOn: 1, locale: de });
            
            return (
              <>
                {/* KW Number for this week */}
                <div
                  key={`kw-${weekIndex}`}
                  className="aspect-square flex items-center justify-center text-[11px] font-semibold text-gray-600 border-r border-gray-200"
                >
                  {weekNumber}
                </div>

                {/* 7 Days of this week */}
                {week.map((day, dayIndex) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = isSameWeek(day, selectedWeek, { weekStartsOn: 1 });
                  const isCurrentDay = isToday(day);
                  const dayIsHoliday = isHoliday(day);
                  const holidayInfo = getHolidayInfo(day);

                  const dayButton = (
                    <button
                      key={`day-${weekIndex}-${dayIndex}`}
                      onClick={() => handleDayClick(day)}
                      className={`
                        aspect-square text-xs rounded transition-all
                        flex items-center justify-center relative
                        ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                        ${isSelected ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100'}
                        ${isCurrentDay ? 'ring-1 ring-blue-500 ring-offset-1' : ''}
                        ${dayIsHoliday && isCurrentMonth ? 'text-red-600 font-semibold' : ''}
                      `}
                    >
                      {format(day, 'd')}
                      {dayIsHoliday && isCurrentMonth && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full" />
                      )}
                    </button>
                  );

                  // Wrap in Tooltip if it's a holiday
                  if (dayIsHoliday && holidayInfo && isCurrentMonth) {
                    const stateNames = holidayInfo.states
                      .map(code => FEDERAL_STATES.find(s => s.code === code)?.name || code)
                      .join(', ');

                    return (
                      <Tooltip key={`day-${weekIndex}-${dayIndex}`}>
                        <TooltipTrigger asChild>
                          {dayButton}
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-semibold text-sm mb-1">{holidayInfo.name}</p>
                          <p className="text-xs text-gray-600">
                            {holidayInfo.states.length === 16 
                              ? 'Bundesweiter Feiertag'
                              : `Feiertag in: ${stateNames}`
                            }
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return dayButton;
                })}
              </>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
}
