/**
 * @file BrowoKo_DraggableShiftBlock.tsx
 * @version 1.0.0
 * @description Draggable Shift Block for Timeline
 */

// Temporarily disabled react-dnd for debugging
// import { useDrag } from 'react-dnd';
import { CSSProperties } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
}

interface Shift {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  specialization?: string;
  notes?: string;
}

interface Props {
  shift: Shift;
  user: User;
  displayValue: string;
  color: string;
  style: CSSProperties;
}

export function BrowoKo_DraggableShiftBlock({ shift, user, displayValue, color, style }: Props) {
  // Temporarily disabled drag functionality
  // const [{ isDragging }, drag] = useDrag({
  //   type: 'shift',
  //   item: { shift },
  //   collect: (monitor) => ({
  //     isDragging: monitor.isDragging(),
  //   }),
  // });

  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();

  return (
    <div
      // ref={drag}
      style={style}
      className={`rounded-lg p-2 cursor-pointer ${color} text-white shadow-sm hover:shadow-md transition-all`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarFallback className="text-xs bg-white/20 text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="font-medium text-sm truncate">{displayValue}</div>
      </div>
      <div className="text-xs opacity-90">
        {shift.start_time} - {shift.end_time}
      </div>
    </div>
  );
}
