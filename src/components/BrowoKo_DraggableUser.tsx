/**
 * @file BrowoKo_DraggableUser.tsx
 * @version 1.0.0
 * @description Draggable User Card for Shift Planning
 */

// Temporarily disabled react-dnd for debugging
// import { useDrag } from 'react-dnd';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  specialization?: string;
}

interface Props {
  user: User;
  hasShift: boolean;
}

export function BrowoKo_DraggableUser({ user, hasShift }: Props) {
  // Temporarily disabled drag functionality
  // const [{ isDragging }, drag] = useDrag({
  //   type: 'user',
  //   item: { user },
  //   collect: (monitor) => ({
  //     isDragging: monitor.isDragging(),
  //   }),
  // });

  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();

  return (
    <div
      // ref={drag}
      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-all"
    >
      <Avatar className="h-9 w-9 flex-shrink-0">
        <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900 truncate">
          {user.first_name} {user.last_name}
        </div>
        {user.specialization && (
          <div className="text-xs text-gray-500 truncate">
            {user.specialization}
          </div>
        )}
      </div>

      {hasShift && (
        <Badge variant="secondary" className="text-xs flex-shrink-0">
          Geplant
        </Badge>
      )}
    </div>
  );
}
