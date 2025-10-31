/**
 * @file BrowoKo_MiniCalendar.tsx
 * @version 1.0.0
 * @description Mini Calendar for Week Selection
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from './icons/BrowoKoIcons';
import { Button } from './ui/button';
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
} from 'date-fns';
import { de } from 'date-fns/locale';

interface Props {
  selectedWeek: Date;
  onWeekChange: (week: Date) => void;
}

export function BrowoKo_MiniCalendar({ selectedWeek, onWeekChange }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const handleDayClick = (day: Date) => {
    const weekStart = startOfWeek(day, { weekStartsOn: 1 });
    onWeekChange(weekStart);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={previousMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="font-medium text-sm text-gray-900">
          {format(currentMonth, 'MMMM yyyy', { locale: de })}
        </div>
        <Button variant="ghost" size="sm" onClick={nextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}

        {/* Days */}
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameWeek(day, selectedWeek, { weekStartsOn: 1 });
          const isCurrentDay = isToday(day);

          return (
            <button
              key={index}
              onClick={() => handleDayClick(day)}
              className={`
                aspect-square text-sm rounded-md transition-all
                ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                ${isSelected ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100'}
                ${isCurrentDay ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
