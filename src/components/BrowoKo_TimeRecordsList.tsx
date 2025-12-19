/**
 * ============================================
 * BROWO KOORDINATOR - TIME RECORDS LIST
 * ============================================
 * Factorial-Style Time Records Display
 * ============================================
 */

import { Clock, Coffee, Calendar } from '../components/icons/BrowoKoIcons';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface TimeRecord {
  id: string;
  user_id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  break_minutes: number;
  total_hours: number | null;
  work_type: 'office' | 'field' | 'extern';
  location_id?: string | null;
  status: 'running' | 'completed';
}

interface TimeRecordsListProps {
  records: TimeRecord[];
  summary: {
    total_hours: number;
    total_break_minutes: number;
    record_count: number;
  };
  filter: 'today' | 'week' | 'month';
  onFilterChange: (filter: 'today' | 'week' | 'month') => void;
  loading?: boolean;
}

export function BrowoKo_TimeRecordsList({
  records,
  summary,
  filter,
  onFilterChange,
  loading = false,
}: TimeRecordsListProps) {
  
  // Get work type badge color
  const getWorkTypeBadge = (workType: string) => {
    switch (workType) {
      case 'office':
        return { label: 'Office 🏢', className: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'field':
        return { label: 'Field 🌍', className: 'bg-green-100 text-green-700 border-green-200' };
      case 'extern':
        return { label: 'Extern 👥', className: 'bg-purple-100 text-purple-700 border-purple-200' };
      default:
        return { label: 'Office 🏢', className: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  // Format hours/minutes
  const formatHoursMinutes = (totalHours: number) => {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  // Group records by date
  const groupedRecords = records.reduce((acc, record) => {
    const date = record.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {} as Record<string, TimeRecord[]>);

  return (
    <Card className="overflow-hidden">
      {/* Header with Filter Tabs */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Meine Stempelzeiten
          </h3>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onFilterChange('today')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === 'today'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Heute
          </button>
          <button
            onClick={() => onFilterChange('week')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === 'week'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Diese Woche
          </button>
          <button
            onClick={() => onFilterChange('month')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === 'month'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Dieser Monat
          </button>
        </div>
      </div>

      {/* Summary Card */}
      {!loading && records.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-4 py-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-900">
                {formatHoursMinutes(summary.total_hours)}
              </p>
              <p className="text-xs text-blue-600 mt-1">Gesamtzeit</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-900">
                {summary.total_break_minutes} Min
              </p>
              <p className="text-xs text-orange-600 mt-1">Pausen</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900">
                {summary.record_count}
              </p>
              <p className="text-xs text-green-600 mt-1">Einträge</p>
            </div>
          </div>
        </div>
      )}

      {/* Records List */}
      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-500 mt-2">Lade Zeitaufzeichnungen...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 mb-1">
              Keine Zeitaufzeichnungen
            </h4>
            <p className="text-sm text-gray-500">
              {filter === 'today' && 'Du hast heute noch nicht gestempelt.'}
              {filter === 'week' && 'Du hast diese Woche noch nicht gestempelt.'}
              {filter === 'month' && 'Du hast diesen Monat noch nicht gestempelt.'}
            </p>
          </div>
        ) : (
          Object.entries(groupedRecords).map(([date, dateRecords]) => {
            const dayTotalHours = dateRecords.reduce((sum, r) => sum + (r.total_hours || 0), 0);
            const dayTotalBreak = dateRecords.reduce((sum, r) => sum + (r.break_minutes || 0), 0);

            return (
              <div key={date} className="p-4 hover:bg-gray-50 transition-colors">
                {/* Date Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {format(parseISO(date), 'EEEE, dd. MMMM yyyy', { locale: de })}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-600">
                        Gesamt: <strong>{formatHoursMinutes(dayTotalHours)}</strong>
                      </span>
                      {dayTotalBreak > 0 && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Coffee className="w-3 h-3" />
                          {dayTotalBreak} Min Pause
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Time Entries for this day */}
                <div className="space-y-2">
                  {dateRecords.map((record) => {
                    const workTypeBadge = getWorkTypeBadge(record.work_type);
                    
                    return (
                      <div
                        key={record.id}
                        className="bg-white border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {record.status === 'running' ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-orange-600">
                                  {record.time_in?.substring(0, 5)} - Läuft noch
                                </span>
                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-700">
                                <strong>{record.time_in?.substring(0, 5)}</strong>
                                {' - '}
                                <strong>{record.time_out?.substring(0, 5)}</strong>
                                <span className="text-gray-500 ml-2">
                                  ({record.total_hours ? formatHoursMinutes(record.total_hours) : '0h 0m'})
                                </span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {record.break_minutes > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <Coffee className="w-3 h-3 mr-1" />
                                {record.break_minutes} Min
                              </Badge>
                            )}
                            <Badge variant="outline" className={`text-xs ${workTypeBadge.className}`}>
                              {workTypeBadge.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
