/**
 * @file HRTHIS_MyRequestsCalendar.tsx
 * @domain HRTHIS - My Requests Calendar
 * @description Collapsible personal calendar widget for "Meine Anträge" tab
 * @version v4.10.21 - Component naming alignment with UI titles
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent } from './ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Clock, Coffee } from './icons/HRTHISIcons';
import MonthYearPicker from './MonthYearPicker';
import { useMonthYearPicker } from '../hooks/useMonthYearPicker';
import { CalendarDayCell } from './HRTHIS_CalendarDayCell';
import { CalendarExportMenu } from './HRTHIS_CalendarExportMenu';
import { useCalendarScreen } from '../hooks/HRTHIS_useCalendarScreen';
import { useComponentDisplayName } from '../hooks/HRTHIS_useComponentDisplayName';

interface MyRequestsCalendarProps {
  userId?: string;
  defaultCollapsed?: boolean;
  onRefresh?: () => void;
}

export default function MyRequestsCalendar({
  userId,
  defaultCollapsed = true,
  onRefresh,
}: MyRequestsCalendarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Get display name from component function name
  const displayName = useComponentDisplayName(MyRequestsCalendar);

  const {
    currentDate,
    setCurrentDate,
    calendarDays,
    getRecordsForDay,
    getLeaveRequestsForDay,
    previousMonth,
    nextMonth,
    today,
    handleRefreshCalendar,
    handleExportCSV,
    handleExportPDF,
    handleExportICal,
  } = useCalendarScreen();

  // Month/Year Picker Hook
  const monthYearPicker = useMonthYearPicker({
    initialDate: currentDate,
    onChange: (date) => {
      setCurrentDate(date);
    }
  });

  // Helper: Format hours/minutes
  const formatHoursMinutes = (totalHours: number) => {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleRefreshClick = async () => {
    await handleRefreshCalendar();
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={handleToggle}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-gray-600" />
              <CardTitle>{displayName}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {!isCollapsed && (
                <CalendarExportMenu
                  onExportCSV={handleExportCSV}
                  onExportPDF={handleExportPDF}
                  onExportICal={handleExportICal}
                />
              )}
              <Button variant="ghost" size="sm">
                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MonthYearPicker
                  date={currentDate}
                  onDateChange={setCurrentDate}
                  isOpen={monthYearPicker.isOpen}
                  onOpenChange={monthYearPicker.setIsOpen}
                  displayYear={monthYearPicker.displayYear}
                  currentMonth={monthYearPicker.currentMonth}
                  isCurrentMonth={monthYearPicker.isCurrentMonth}
                  previousYear={monthYearPicker.previousYear}
                  nextYear={monthYearPicker.nextYear}
                  setYear={monthYearPicker.setYear}
                  selectMonth={monthYearPicker.selectMonth}
                  goToToday={monthYearPicker.goToToday}
                  onRefresh={handleRefreshClick}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={today}>
                  Heute
                </Button>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={previousMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={nextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Color Legend */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700 text-sm block mb-2">Legende:</span>
              <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3 text-xs md:text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-green-100 border border-green-300"></div>
                  <span className="text-gray-600">Genehmigt</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-yellow-100 border border-yellow-300"></div>
                  <span className="text-gray-600">Ausstehend</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-blue-100 border border-blue-300"></div>
                  <span className="text-gray-600">Krank</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-purple-100 border border-purple-300"></div>
                  <span className="text-gray-600">Unbezahlt</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-red-100 border border-red-300"></div>
                  <span className="text-gray-600">Abgelehnt</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2 md:col-span-1">
                  <Badge variant="secondary" className="text-xs">8.0h</Badge>
                  <span className="text-gray-600">Arbeitszeit</span>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0.5 md:gap-1">
              {/* Weekday Headers */}
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs md:text-sm font-medium text-gray-500 py-1 md:py-2"
                >
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {calendarDays.map((day) => {
                const dayRecords = getRecordsForDay(day);
                const dayLeaves = getLeaveRequestsForDay(day);
                const totalHours = dayRecords.reduce((sum, r) => sum + (r.total_hours || 0), 0);
                const totalBreakMinutes = dayRecords.reduce((sum, r) => sum + (r.break_minutes || 0), 0);
                const hasRecords = dayRecords.length > 0;
                const hasLeaves = dayLeaves.length > 0;
                const hasContent = hasRecords || hasLeaves;

                return (
                  <TooltipProvider key={day.toString()}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <CalendarDayCell
                            day={day}
                            currentDate={currentDate}
                            records={dayRecords}
                            leaveRequests={dayLeaves}
                            viewMode="personal"
                            onClick={() => {}}
                          />
                        </div>
                      </TooltipTrigger>
                      {hasContent && (
                        <TooltipContent className="bg-gray-900 text-white p-3 rounded-lg">
                          <div className="space-y-2 text-sm">
                            {hasRecords && (
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatHoursMinutes(totalHours)}</span>
                                </div>
                                {totalBreakMinutes > 0 && (
                                  <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <Coffee className="w-3 h-3" />
                                    <span>{totalBreakMinutes} Min Pause</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {hasLeaves && (
                              <div className="border-t border-gray-700 pt-2">
                                {dayLeaves.map((leave, idx) => (
                                  <div key={idx} className="text-xs">
                                    {leave.type === 'VACATION' && '🏖️ Urlaub'}
                                    {leave.type === 'SICK' && '🤒 Krank'}
                                    {leave.type === 'UNPAID' && '💼 Unbezahlt'}
                                    {leave.type === 'OTHER' && '📋 Sonstiges'}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
