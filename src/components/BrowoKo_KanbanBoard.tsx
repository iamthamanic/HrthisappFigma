/**
 * @file BrowoKo_KanbanBoard.tsx
 * @domain HR - Task Management
 * @description Kanban board with drag & drop functionality (Desktop) and click-to-move (Mobile)
 * @created v4.10.16
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { BrowoKo_TaskCard } from './BrowoKo_TaskCard';
import { ChevronRight } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  due_date?: string;
  assignments?: any[];
}

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskStatusChange: (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => void;
}

const COLUMNS = [
  { id: 'TODO' as const, title: 'To Do', color: 'bg-gray-50' },
  { id: 'IN_PROGRESS' as const, title: 'In Bearbeitung', color: 'bg-blue-50' },
  { id: 'DONE' as const, title: 'Erledigt', color: 'bg-green-50' },
];

interface KanbanColumnProps {
  columnId: 'TODO' | 'IN_PROGRESS' | 'DONE';
  title: string;
  color: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskStatusChange: (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => void;
  selectedTask: string | null;
  onTaskSelect: (taskId: string | null) => void;
}

function KanbanColumn({ 
  columnId, 
  title, 
  color, 
  tasks, 
  onTaskClick, 
  onTaskStatusChange,
  selectedTask,
  onTaskSelect 
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('sourceStatus', columnId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const taskId = e.dataTransfer.getData('taskId');
    const sourceStatus = e.dataTransfer.getData('sourceStatus');
    
    if (taskId && sourceStatus !== columnId) {
      onTaskStatusChange(taskId, columnId);
    }
  };

  const handleTaskCardClick = (task: Task, e: React.MouseEvent) => {
    // If task is already selected, show context menu for moving
    if (selectedTask === task.id) {
      e.stopPropagation();
      return;
    }
    
    // On mobile, select task for moving
    if (window.innerWidth < 768) {
      onTaskSelect(task.id);
    } else {
      // On desktop, open task details
      onTaskClick(task);
    }
  };

  const handleMoveHere = () => {
    if (selectedTask) {
      const task = tasks.find(t => t.id === selectedTask);
      if (task && task.status !== columnId) {
        onTaskStatusChange(selectedTask, columnId);
      }
      onTaskSelect(null);
    }
  };

  return (
    <Card 
      className={`flex-1 min-w-[300px] ${isDragOver ? 'ring-2 ring-blue-400' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader className={`${color} border-b`}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 bg-white px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
            {selectedTask && !tasks.find(t => t.id === selectedTask) && (
              <button
                onClick={handleMoveHere}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                Hierher
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-3 min-h-[400px]">
        {tasks.map(task => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => handleDragStart(e, task.id)}
            className={`cursor-move transition-all ${selectedTask === task.id ? 'ring-2 ring-blue-400 scale-105' : ''}`}
            onClick={(e) => handleTaskCardClick(task, e)}
          >
            <BrowoKo_TaskCard 
              task={task} 
              onClick={() => onTaskClick(task)}
              isSelected={selectedTask === task.id}
            />
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-8">
            {selectedTask ? 'Klicke "Hierher" um die Task zu verschieben' : 'Keine Tasks'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function BrowoKo_KanbanBoard({ tasks, onTaskClick, onTaskStatusChange }: KanbanBoardProps) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const getTasksByStatus = (status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    return tasks.filter(task => task.status === status);
  };

  // Deselect task when clicking outside
  const handleBackgroundClick = () => {
    if (selectedTask) {
      setSelectedTask(null);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" onClick={handleBackgroundClick}>
      {COLUMNS.map(column => (
        <KanbanColumn
          key={column.id}
          columnId={column.id}
          title={column.title}
          color={column.color}
          tasks={getTasksByStatus(column.id)}
          onTaskClick={onTaskClick}
          onTaskStatusChange={onTaskStatusChange}
          selectedTask={selectedTask}
          onTaskSelect={setSelectedTask}
        />
      ))}
    </div>
  );
}
