import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, Coffee } from '../components/icons/BrowoKoIcons';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import MonthYearPicker from '../components/MonthYearPicker';
import { useMonthYearPicker } from '../hooks/useMonthYearPicker';
import RequestLeaveDialog from '../components/RequestLeaveDialog';
import { CalendarDayCell } from '../components/BrowoKo_CalendarDayCell';
import { CalendarExportMenu } from '../components/BrowoKo_CalendarExportMenu';
import { TeamAbsenceAvatar } from '../components/TeamAbsenceAvatar';
import { useCalendarScreen } from '../hooks/BrowoKo_useCalendarScreen';
import { useAuthStore } from '../stores/BrowoKo_authStore';

export default function CalendarScreen() {
  const { profile } = useAuthStore();
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailDialogDay, setDetailDialogDay] = useState<Date | null>(null);
  const [requestLeaveDialogOpen, setRequestLeaveDialogOpen] = useState(false);

  const {
    currentDate,
    setCurrentDate,
    selectedDay,
    setSelectedDay,
    viewMode,
    setViewMode,
    setRefreshTrigger,
    isAdmin,
    calendarDays,
    users,
    teamUsers, // 🔥 NEW: Pre-loaded user map
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

  // Handle day click
  const handleDayClick = (day: Date) => {
    const dayRecords = getRecordsForDay(day);
    if (dayRecords.length > 0) {
      setDetailDialogDay(day);
      setDetailDialogOpen(true);
    }
  };

  // Helper: Format hours/minutes
  const formatHoursMinutes = (totalHours: number) => {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  // Helper: Determine if break was automatic or manual
  const getBreakType = (record: any) => {
    if (profile?.break_auto && record.break_minutes === profile?.break_minutes) {
      return 'automatisch';
    }
    if (record.break_minutes > 0) {
      return 'manuell';
    }
    return null;
  };

  // Detail dialog content
  const detailDialogDayRecords = detailDialogDay ? getRecordsForDay(detailDialogDay) : [];

  return (
    <div className="min-h-screen pt-20 md:pt-6 px-4 md:px-6">
      {/* ✅ MAX-WIDTH CONTAINER */}
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 pb-20 md:pb-0">
      {/* Header - Desktop */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Kalender</h1>
          <p className="text-sm text-gray-500 mt-1">
            Übersicht über Arbeitszeiten und Termine
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export Buttons */}
          <CalendarExportMenu
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            onExportICal={handleExportICal}
          />
          
          {/* VIEW MODE TOGGLE */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('personal')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'personal'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Persönlich
            </button>
            <button
              onClick={() => setViewMode('specialization')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'specialization'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Spezialisierung
            </button>
            <button
              onClick={() => setViewMode('team')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'team'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Team
            </button>
            <button
              onClick={() => setViewMode('location')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'location'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Standort
            </button>
            <button
              onClick={() => setViewMode('company')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'company'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Firma
            </button>
          </div>
          
          <Button onClick={() => setRequestLeaveDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Urlaub/Abwesenheit
          </Button>
        </div>
      </div>

      {/* Header - Mobile */}
      <div className="md:hidden space-y-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Urlaub & Abwesenheit</h1>
          <p className="text-sm text-gray-500 mt-1">
            Arbeitszeiten & Termine
          </p>
        </div>
        
        {/* Mobile Actions */}
        <div className="space-y-2">
          {/* VIEW MODE TOGGLE - 3x2 Grid on Mobile (5 tabs) */}
          <div className="grid grid-cols-3 gap-2 bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('personal')}
              className={`px-2 py-2 text-sm rounded-md transition-colors ${
                viewMode === 'personal'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Persönlich
            </button>
            <button
              onClick={() => setViewMode('specialization')}
              className={`px-2 py-2 text-sm rounded-md transition-colors ${
                viewMode === 'specialization'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Spezialisierung
            </button>
            <button
              onClick={() => setViewMode('team')}
              className={`px-2 py-2 text-sm rounded-md transition-colors ${
                viewMode === 'team'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Team
            </button>
            <button
              onClick={() => setViewMode('location')}
              className={`px-2 py-2 text-sm rounded-md transition-colors ${
                viewMode === 'location'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Standort
            </button>
            <button
              onClick={() => setViewMode('company')}
              className={`px-2 py-2 text-sm rounded-md transition-colors ${
                viewMode === 'company'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Firma
            </button>
          </div>
          
          {/* Export Menu - Mobile */}
          <div className="flex justify-end">
            <CalendarExportMenu
              onExportCSV={handleExportCSV}
              onExportPDF={handleExportPDF}
              onExportICal={handleExportICal}
            />
          </div>
        </div>

        {/* Add Leave Button - Full Width on Mobile */}
        <Button onClick={() => setRequestLeaveDialogOpen(true)} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Urlaub/Abwesenheit beantragen
        </Button>
      </div>

      {/* Request Leave Dialog */}
      <RequestLeaveDialog
        open={requestLeaveDialogOpen}
        onOpenChange={setRequestLeaveDialogOpen}
        onSuccess={() => setRefreshTrigger(prev => prev + 1)}
      />

      <Card>
        <CardHeader>
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-gray-600" />
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
                onRefresh={handleRefreshCalendar}
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

          {/* Mobile Header */}
          <div className="md:hidden space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-gray-600" />
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
                  onRefresh={handleRefreshCalendar}
                />
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={previousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={today} className="text-xs px-2">
                  Heute
                </Button>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Color Legend */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700 text-sm block mb-2">Legende:</span>
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3 text-xs md:text-sm">
              {(viewMode === 'personal' || viewMode === 'specialization') ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full ring-2 ring-red-500 ring-offset-2 bg-gray-300 flex-shrink-0"></div>
                    <span className="text-gray-600">Abwesenheit</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2 md:col-span-1">
                    <span className="text-xs text-gray-500 italic">Tippe auf Tag für Details</span>
                  </div>
                </>
              )}
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
              const isSelected = selectedDay && format(day, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd');
              const hasRecords = dayRecords.length > 0;
              const hasLeaves = dayLeaves.length > 0;
              const hasContent = hasRecords || hasLeaves;

              // For Team View: Show team member absences
              if (viewMode === 'team' && hasLeaves) {
                return (
                  <div
                    key={day.toString()}
                    className={`
                      min-h-[80px] md:min-h-[120px] p-1 md:p-2 border border-gray-200 bg-white text-xs md:text-sm
                      ${format(day, 'M') !== format(currentDate, 'M') ? 'bg-gray-50' : ''}
                    `}
                  >
                    <div className="text-xs md:text-sm font-medium text-gray-900 mb-1 md:mb-2">
                      {format(day, 'd', { locale: de })}
                    </div>
                    <div className="space-y-0.5 md:space-y-1">
                      {dayLeaves.slice(0, 2).map((leave, idx) => {
                        const user = teamUsers.get(leave.user_id);
                        if (!user) return null;
                        
                        return (
                          <TeamAbsenceAvatar
                            key={`${leave.user_id}-${idx}`}
                            user={user}
                            leaveType={leave.type}
                            startDate={leave.start_date}
                            endDate={leave.end_date}
                          />
                        );
                      })}
                      {dayLeaves.length > 2 && (
                        <div className="text-[10px] md:text-xs text-gray-500 px-1 md:px-2">
                          +{dayLeaves.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Personal View or Team View without leaves
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
                          viewMode={viewMode}
                          onClick={() => handleDayClick(day)}
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
                          <p className="text-xs text-gray-400 mt-2 border-t border-gray-700 pt-1">
                            Klicken für Details
                          </p>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Details für {detailDialogDay && format(detailDialogDay, 'dd. MMMM yyyy', { locale: de })}
            </DialogTitle>
            <DialogDescription>
              Arbeitszeiten und Pausen
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {detailDialogDayRecords.map((record, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Arbeitsbeginn</p>
                    <p className="font-medium">{record.time_in || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Arbeitsende</p>
                    <p className="font-medium">{record.time_out || 'Läuft noch'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pause</p>
                    <p className="font-medium">
                      {record.break_minutes || 0} Min
                      {getBreakType(record) && (
                        <span className="text-xs text-gray-500 ml-2">
                          ({getBreakType(record)})
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gesamt</p>
                    <p className="font-medium">
                      {record.total_hours ? formatHoursMinutes(record.total_hours) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      </div> {/* ✅ Close max-width container */}
    </div>
  );
}
