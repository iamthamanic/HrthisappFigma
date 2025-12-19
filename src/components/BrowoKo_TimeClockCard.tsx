/**
 * ============================================
 * BROWO KOORDINATOR - TIME CLOCK CARD
 * ============================================
 * Factorial-Style Clock In/Out Widget
 * ============================================
 */

import { Clock, Play, Square } from '../components/icons/BrowoKoIcons';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface TimeClockCardProps {
  workType: 'office' | 'field' | 'extern';
  locationId?: string;
  isClockedIn: boolean;
  currentRecord: any;
  elapsedTime: { hours: number; minutes: number; formatted: string };
  onClockIn: () => void;
  onClockOut: () => void;
  loading: boolean;
}

export function BrowoKo_TimeClockCard({
  workType,
  locationId,
  isClockedIn,
  currentRecord,
  elapsedTime,
  onClockIn,
  onClockOut,
  loading,
}: TimeClockCardProps) {
  
  // Get work type display info
  const getWorkTypeInfo = () => {
    switch (workType) {
      case 'office':
        return { label: 'Office', color: 'bg-blue-500', icon: '🏢' };
      case 'field':
        return { label: 'Field', color: 'bg-green-500', icon: '🌍' };
      case 'extern':
        return { label: 'Extern', color: 'bg-purple-500', icon: '👥' };
      default:
        return { label: 'Office', color: 'bg-blue-500', icon: '🏢' };
    }
  };

  const workTypeInfo = getWorkTypeInfo();

  return (
    <Card className="overflow-hidden border-2 shadow-sm">
      {/* Status Banner */}
      <div className={`${workTypeInfo.color} px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2 text-white">
          <span className="text-lg">{workTypeInfo.icon}</span>
          <span className="font-medium text-sm">{workTypeInfo.label}</span>
        </div>
        {isClockedIn && (
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
            Aktiv
          </Badge>
        )}
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Status Display */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {isClockedIn ? 'Du bist eingecheckt' : 'Du bist nicht eingecheckt'}
            </h3>
          </div>

          {isClockedIn && currentRecord && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                seit {currentRecord.time_in ? currentRecord.time_in.substring(0, 5) : ''} Uhr
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-2xl font-bold text-orange-600">
                  {elapsedTime.formatted}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: de })}
              </p>
            </div>
          )}

          {!isClockedIn && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Bereit zum Arbeiten?
              </p>
              <p className="text-xs text-gray-400">
                {format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: de })}
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="space-y-3">
          {isClockedIn ? (
            <Button
              onClick={onClockOut}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg font-semibold"
            >
              <Square className="w-5 h-5 mr-2" />
              {loading ? 'Ausstempeln...' : 'Ausstempeln'}
            </Button>
          ) : (
            <Button
              onClick={onClockIn}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold"
            >
              <Play className="w-5 h-5 mr-2" />
              {loading ? 'Einstempeln...' : 'Einstempeln'}
            </Button>
          )}

          {/* Info Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-900">
              <strong>ℹ️ Hinweis:</strong>{' '}
              {isClockedIn 
                ? 'Vergiss nicht auszustempeln, wenn du Feierabend machst!'
                : 'Pausen werden automatisch nach Arbeitsrecht berechnet.'
              }
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
