/**
 * @file BrowoKo_ShiftTimeline.tsx
 * @version 1.0.0
 * @description Weekly Timeline Component with Drag & Drop for Shifts
 * 
 * Features:
 * - Wochenansicht (Mo-So)
 * - Timeline: 7:00-19:00 (12 hours)
 * - Drag & Drop: Accept dragged users, draggable shift blocks
 * - Farbcodierte Schichtblöcke
 */

// Temporarily disabled react-dnd for debugging
// import { useDrop } from 'react-dnd';
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { Avatar, AvatarFallback } from './ui/avatar';
import { BrowoKo_DraggableShiftBlock } from './BrowoKo_DraggableShiftBlock';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  specialization?: string;
}

interface Shift {
  id: string;
  user_id: string;
  date: string;
  start_time: string; // "08:30"
  end_time: string; // "14:30"
  location_id?: string;
  department_id?: string;
  specialization?: string;
  notes?: string;
}

interface Props {
  selectedWeek: Date;
  shifts: Shift[];
  users: User[];
  viewMode: 'location' | 'department' | 'specialization';
  getDisplayValue: (shift: Shift, user: User) => string;
  getSpecializationColor: (spec: string) => string;
}

const DAYS_OF_WEEK = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const START_HOUR = 7; // 7:00
const END_HOUR = 19; // 19:00
const HOURS = END_HOUR - START_HOUR; // 12 hours

export function BrowoKo_ShiftTimeline({
  selectedWeek,
  shifts,
  users,
  viewMode,
  getDisplayValue,
  getSpecializationColor,
}: Props) {
  // Helper: Convert time string to hour offset
  const timeToOffset = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60 - START_HOUR;
  };

  // Helper: Calculate width percentage
  const getWidthPercentage = (startTime: string, endTime: string): number => {
    const start = timeToOffset(startTime);
    const end = timeToOffset(endTime);
    return ((end - start) / HOURS) * 100;
  };

  // Helper: Calculate left position percentage
  const getLeftPercentage = (startTime: string): number => {
    const offset = timeToOffset(startTime);
    return (offset / HOURS) * 100;
  };

  // Handle drop of user onto timeline
  const handleDrop = (user: User, day: Date, hour: number) => {
    console.log('Drop user:', user, 'on day:', day, 'at hour:', hour);
    // TODO: Open CreateShiftDialog with pre-filled data
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header: Days of Week */}
        <div className="grid grid-cols-8 gap-px bg-gray-200 mb-px">
          {/* Empty cell for time column */}
          <div className="bg-white p-3" />
          
          {/* Day headers */}
          {DAYS_OF_WEEK.map((dayName, index) => {
            const day = addDays(selectedWeek, index);
            return (
              <div key={index} className="bg-white p-3 text-center">
                <div className="text-sm font-medium text-gray-900">{dayName}</div>
                <div className="text-xs text-gray-500">
                  {format(day, 'd. MMM', { locale: de })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline Grid */}
        <div className="grid grid-cols-8 gap-px bg-gray-200">
          {/* Time column */}
          <div className="bg-white">
            {Array.from({ length: HOURS + 1 }).map((_, i) => {
              const hour = START_HOUR + i;
              return (
                <div
                  key={i}
                  className="h-20 border-b border-gray-200 flex items-start justify-end pr-2 pt-1"
                >
                  <span className="text-xs text-gray-500">{hour}:00</span>
                </div>
              );
            })}
          </div>

          {/* Day columns */}
          {DAYS_OF_WEEK.map((_, dayIndex) => {
            const day = addDays(selectedWeek, dayIndex);
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayShifts = shifts.filter(s => s.date === dateStr);

            return (
              <DayColumn
                key={dayIndex}
                day={day}
                shifts={dayShifts}
                users={users}
                getDisplayValue={getDisplayValue}
                getSpecializationColor={getSpecializationColor}
                getLeftPercentage={getLeftPercentage}
                getWidthPercentage={getWidthPercentage}
                onDrop={handleDrop}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// DayColumn Component with Drop Target
interface DayColumnProps {
  day: Date;
  shifts: Shift[];
  users: User[];
  getDisplayValue: (shift: Shift, user: User) => string;
  getSpecializationColor: (spec: string) => string;
  getLeftPercentage: (time: string) => number;
  getWidthPercentage: (start: string, end: string) => number;
  onDrop: (user: User, day: Date, hour: number) => void;
}

function DayColumn({
  day,
  shifts,
  users,
  getDisplayValue,
  getSpecializationColor,
  getLeftPercentage,
  getWidthPercentage,
  onDrop,
}: DayColumnProps) {
  // Temporarily disabled drop functionality
  // const [{ isOver }, drop] = useDrop({
  //   accept: 'user',
  //   drop: (item: { user: User }, monitor) => {
  //     const clientOffset = monitor.getClientOffset();
  //     if (!clientOffset) return;
  //
  //     // Calculate which hour was dropped on (simplified)
  //     const hour = START_HOUR + 8; // TODO: Calculate from mouse position
  //     onDrop(item.user, day, hour);
  //   },
  //   collect: (monitor) => ({
  //     isOver: monitor.isOver(),
  //   }),
  // });

  return (
    <div
      // ref={drop}
      className="bg-white relative"
      style={{ minHeight: `${(HOURS + 1) * 80}px` }}
    >
      {/* Hour grid lines */}
      {Array.from({ length: HOURS + 1 }).map((_, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 border-b border-gray-200"
          style={{ top: `${i * 80}px`, height: '80px' }}
        />
      ))}

      {/* Shift blocks */}
      {shifts.map((shift) => {
        const user = users.find(u => u.id === shift.user_id);
        if (!user) return null;

        const displayValue = getDisplayValue(shift, user);
        const color = getSpecializationColor(shift.specialization || user.specialization || '');
        const top = getLeftPercentage(shift.start_time);
        const height = getWidthPercentage(shift.start_time, shift.end_time);

        return (
          <BrowoKo_DraggableShiftBlock
            key={shift.id}
            shift={shift}
            user={user}
            displayValue={displayValue}
            color={color}
            style={{
              position: 'absolute',
              top: `${top}%`,
              left: '4px',
              right: '4px',
              height: `${height}%`,
            }}
          />
        );
      })}
    </div>
  );
}
