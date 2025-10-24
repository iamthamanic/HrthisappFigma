import { format, isToday, isSameMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { Clock, Umbrella, Heart, Calendar, AlertCircle, CheckCircle2, XCircle } from './icons/HRTHISIcons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { LeaveRequest } from '../types/database';

interface TimeRecord {
  id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  break_minutes: number;
  total_hours: number | null;
}

interface CalendarDayCellProps {
  day: Date;
  currentDate: Date;
  records: TimeRecord[];
  leaveRequests: LeaveRequest[];
  viewMode: 'personal' | 'team';
  onClick: () => void;
}

const getLeaveBlockColor = (leave: LeaveRequest, viewMode: 'personal' | 'team') => {
  if (viewMode === 'personal') {
    if (leave.status === 'REJECTED') {
      return 'bg-red-100 border-red-300 text-red-700';
    } else if (leave.status === 'PENDING') {
      return 'bg-yellow-100 border-yellow-300 text-yellow-700';
    } else if (leave.type === 'VACATION' && leave.status === 'APPROVED') {
      return 'bg-green-100 border-green-300 text-green-700';
    } else if (leave.type === 'SICK') {
      return 'bg-blue-100 border-blue-300 text-blue-700';
    } else if (leave.type === 'UNPAID_LEAVE') {
      return 'bg-purple-100 border-purple-300 text-purple-700';
    }
  } else {
    if (leave.type === 'VACATION') {
      return 'bg-green-100 border-green-300 text-green-700';
    } else if (leave.type === 'SICK') {
      return 'bg-blue-100 border-blue-300 text-blue-700';
    } else if (leave.type === 'UNPAID_LEAVE') {
      return 'bg-purple-100 border-purple-300 text-purple-700';
    }
  }
  return 'bg-gray-100 border-gray-300 text-gray-500';
};

const getLeaveIcon = (leave: LeaveRequest) => {
  if (leave.type === 'VACATION') {
    return <Umbrella className="w-3 h-3" />;
  } else if (leave.type === 'SICK') {
    return <Heart className="w-3 h-3" />;
  } else if (leave.type === 'UNPAID_LEAVE') {
    return <Calendar className="w-3 h-3" />;
  }
  return <AlertCircle className="w-3 h-3" />;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return <CheckCircle2 className="w-3 h-3" />;
    case 'PENDING':
      return <Clock className="w-3 h-3" />;
    case 'REJECTED':
      return <XCircle className="w-3 h-3" />;
    default:
      return null;
  }
};

export function CalendarDayCell({
  day,
  currentDate,
  records,
  leaveRequests,
  viewMode,
  onClick
}: CalendarDayCellProps) {
  const isCurrentMonth = isSameMonth(day, currentDate);
  const isDayToday = isToday(day);
  const dayRecords = records;
  const dayLeaves = leaveRequests;

  const totalHours = dayRecords.reduce((sum, r) => sum + (r.total_hours || 0), 0);

  return (
    <div
      onClick={onClick}
      className={`
        min-h-[120px] p-2 border border-gray-200 cursor-pointer transition-colors
        ${!isCurrentMonth ? 'bg-gray-50' : 'bg-white hover:bg-blue-50'}
        ${isDayToday ? 'border-blue-500 border-2' : ''}
      `}
    >
      {/* Day Number */}
      <div className={`
        text-sm font-medium mb-1
        ${!isCurrentMonth ? 'text-gray-400' : isDayToday ? 'text-blue-600' : 'text-gray-900'}
      `}>
        {format(day, 'd', { locale: de })}
      </div>

      {/* Leave Requests */}
      {dayLeaves.length > 0 && (
        <div className="space-y-1">
          {dayLeaves.slice(0, 2).map((leave, idx) => (
            <TooltipProvider key={idx}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`
                    text-xs px-2 py-1 rounded border flex items-center gap-1
                    ${getLeaveBlockColor(leave, viewMode)}
                  `}>
                    {getLeaveIcon(leave)}
                    {viewMode === 'personal' && getStatusIcon(leave.status)}
                    <span className="truncate flex-1">
                      {leave.type === 'VACATION' ? 'Urlaub' :
                       leave.type === 'SICK' ? 'Krank' :
                       leave.type === 'UNPAID_LEAVE' ? 'Unbezahlt' : leave.type}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {leave.type === 'VACATION' ? 'Urlaub' :
                     leave.type === 'SICK' ? 'Krankmeldung' :
                     leave.type === 'UNPAID_LEAVE' ? 'Unbezahlter Urlaub' : leave.type}
                  </p>
                  {viewMode === 'personal' && (
                    <p className="text-xs">
                      Status: {leave.status === 'APPROVED' ? 'Genehmigt' :
                               leave.status === 'PENDING' ? 'Ausstehend' :
                               leave.status === 'REJECTED' ? 'Abgelehnt' : leave.status}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {dayLeaves.length > 2 && (
            <div className="text-xs text-gray-500 px-2">
              +{dayLeaves.length - 2} weitere
            </div>
          )}
        </div>
      )}

      {/* Time Records */}
      {viewMode === 'personal' && dayRecords.length > 0 && (
        <div className="mt-2 space-y-1">
          {dayRecords.map((record, idx) => (
            <div key={idx} className="text-xs text-gray-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {record.time_in && record.time_out ? (
                <span className="truncate">
                  {record.time_in.substring(0, 5)} - {record.time_out.substring(0, 5)}
                </span>
              ) : record.time_in ? (
                <span className="text-orange-600 truncate">Läuft seit {record.time_in.substring(0, 5)}</span>
              ) : (
                <span className="text-gray-400 truncate">Keine Zeit</span>
              )}
            </div>
          ))}
          {totalHours > 0 && (
            <div className="text-xs font-medium text-blue-600">
              {Math.floor(totalHours)}h {Math.round((totalHours - Math.floor(totalHours)) * 60)}m
            </div>
          )}
        </div>
      )}
    </div>
  );
}
