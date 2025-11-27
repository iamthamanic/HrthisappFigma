/**
 * @file BrowoKo_TaskCard.tsx
 * @domain HR - Task Management
 * @description Task card component for Kanban board
 * @created v4.10.16
 */

import { Calendar, AlertCircle, User } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  due_date?: string;
  assignments?: any[];
}

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isSelected?: boolean;
}

const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-red-100 text-red-700',
};

const PRIORITY_LABELS = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
};

export function BrowoKo_TaskCard({ task, onClick, isSelected }: TaskCardProps) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date();

  return (
    <Card
      className={`hover:shadow-md transition-shadow cursor-pointer bg-white ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        {/* Priority Badge */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs px-2 py-0.5 rounded ${PRIORITY_COLORS[task.priority]}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {isOverdue && (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
        </div>

        {/* Title */}
        <h4 className="font-medium text-sm mb-2 line-clamp-2">
          {task.title}
        </h4>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          {/* Due Date */}
          {task.due_date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span className={isOverdue ? 'text-red-500' : ''}>
                {new Date(task.due_date).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                })}
              </span>
            </div>
          )}

          {/* Assignments */}
          {task.assignments && task.assignments.length > 0 && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{task.assignments.length}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
