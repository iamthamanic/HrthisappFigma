/**
 * @file BrowoKo_useCalendarScreen.ts
 * @domain BrowoKo - Calendar Screen
 * @description Custom hook for calendar screen logic
 * @created Phase 3D - Hooks Migration
 */

import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { de } from 'date-fns/locale';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import { useAdminStore } from '../stores/BrowoKo_adminStore';
import { LeaveRequest, User, Team } from '../types/database';
import { supabase } from '../utils/supabase/client';

// Shift type (same as in ShiftPlanningTab)
interface Shift {
  id: string;
  user_id: string;
  date: string; // "2025-01-20"
  shift_type: string;
  start_time: string; // "08:00"
  end_time: string; // "17:00"
  location_id?: string;
  department_id?: string;
  specialization?: string;
  notes?: string;
}

export function useCalendarScreen(selectedLocationId?: string | null) {
  const { profile } = useAuthStore();
  const { users } = useAdminStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'personal' | 'specialization' | 'team' | 'location' | 'company' | 'shifts'>('personal');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [teamUsers, setTeamUsers] = useState<Map<string, User>>(new Map());
  const [shifts, setShifts] = useState<Shift[]>([]);
  
  // 🔥 NEW: Week state for shift calendar
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  
  // 🔥 NEW: Export dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<'csv' | 'pdf' | null>(null);
  
  // 🔥 NEW: User's teams and specializations
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [userSpecializations, setUserSpecializations] = useState<string[]>([]);

  const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'SUPERADMIN' || profile?.role === 'HR' || profile?.role === 'TEAMLEAD';

  // 🔥 NEW: Load user's teams and specializations
  useEffect(() => {
    const loadUserTeamsAndSpecs = async () => {
      if (!profile?.id) return;

      try {
        // Load teams
        const { data: teamMemberships, error: teamError } = await supabase
          .from('team_members')
          .select('team_id, teams(id, name, description)')
          .eq('user_id', profile.id);

        if (!teamError && teamMemberships) {
          const teams = teamMemberships
            .map(tm => tm.teams)
            .filter(Boolean) as unknown as Team[];
          setUserTeams(teams);
        }

        // Load specializations from department field (comma-separated or single value)
        if (profile.department) {
          const specs = profile.department.split(',').map(s => s.trim()).filter(Boolean);
          setUserSpecializations(specs);
        } else {
          setUserSpecializations([]);
        }
      } catch (error) {
        console.error('Failed to load user teams/specs:', error);
        setUserTeams([]);
        setUserSpecializations([]);
      }
    };

    loadUserTeamsAndSpecs();
  }, [profile?.id, profile?.department]);

  // Load leave requests AND team users
  useEffect(() => {
    const loadLeaveRequests = async () => {
      if (!profile?.id) return;

      try {
        setLoadingLeaves(true);
        const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
        const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');

        let query = supabase
          .from('leave_requests')
          .select('*')
          .or(`start_date.lte.${end},end_date.gte.${start}`);

        if (viewMode === 'personal') {
          query = query.eq('user_id', profile.id);
        } else if (viewMode === 'location' && selectedLocationId) {
          // 🔥 NEW: Filter by location
          // First, get all users from this location
          const { data: locationUsers, error: locationError } = await supabase
            .from('users')
            .select('id')
            .eq('location_id', selectedLocationId);

          if (locationError) throw locationError;
          
          if (locationUsers && locationUsers.length > 0) {
            const locationUserIds = locationUsers.map(u => u.id);
            query = query.in('user_id', locationUserIds);
          } else {
            // No users at this location - return empty
            setLeaveRequests([]);
            setTeamUsers(new Map());
            setLoadingLeaves(false);
            return;
          }
        } else {
          query = query.eq('status', 'APPROVED');
        }

        try {
          const { data, error } = await query
            .is('withdrawn_at', null)
            .order('start_date', { ascending: false });

          if (error && error.code === '42703') {
            throw new Error('Column not found');
          }
          if (error) throw error;
          setLeaveRequests(data || []);
          
          // 🔥 PERFORMANCE FIX: Load all unique users ONCE
          if ((viewMode === 'team' || viewMode === 'location') && data && data.length > 0) {
            const uniqueUserIds = [...new Set(data.map(leave => leave.user_id))];
            const { data: usersData, error: usersError } = await supabase
              .from('users')
              .select('*')
              .in('id', uniqueUserIds);
            
            if (!usersError && usersData) {
              const userMap = new Map(usersData.map(user => [user.id, user]));
              setTeamUsers(userMap);
            }
          } else {
            setTeamUsers(new Map());
          }
        } catch (innerError: any) {
          if (innerError.message === 'Column not found' || innerError.code === '42703') {
            const { data, error } = await query.order('start_date', { ascending: false });
            if (error) throw error;
            setLeaveRequests(data || []);
            
            // Load team users for fallback too
            if ((viewMode === 'team' || viewMode === 'location') && data && data.length > 0) {
              const uniqueUserIds = [...new Set(data.map(leave => leave.user_id))];
              const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('*')
                .in('id', uniqueUserIds);
              
              if (!usersError && usersData) {
                const userMap = new Map(usersData.map(user => [user.id, user]));
                setTeamUsers(userMap);
              }
            } else {
              setTeamUsers(new Map());
            }
          } else {
            throw innerError;
          }
        }
      } catch (error: any) {
        // Silent fail - table doesn't exist or column not found
        // This is expected when migrations haven't been run
      } finally {
        setLoadingLeaves(false);
      }
    };

    loadLeaveRequests();
  }, [profile?.id, currentDate, viewMode, refreshTrigger, selectedLocationId]);

  // Load shifts (🔥 FOR WEEK - not month!)
  useEffect(() => {
    const loadShifts = async () => {
      if (!profile?.id || viewMode !== 'shifts') return;

      try {
        // Use selectedWeek for shift loading
        const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 }); // Sunday
        const start = format(weekStart, 'yyyy-MM-dd');
        const end = format(weekEnd, 'yyyy-MM-dd');

        // Load shifts for the current week
        const { data, error } = await supabase
          .from('shifts')
          .select('*')
          .gte('date', start)
          .lte('date', end)
          .eq('user_id', profile.id) // Only current user's shifts
          .order('date', { ascending: true });

        if (error) {
          console.error('[useCalendarScreen] Error loading shifts:', error);
          throw error;
        }
        
        setShifts(data || []);
      } catch (error: any) {
        console.error('[useCalendarScreen] Failed to load shifts:', error);
        // Silent fail - table might not exist
        setShifts([]);
      }
    };

    loadShifts();
  }, [profile?.id, selectedWeek, viewMode, refreshTrigger]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Get records for a specific day (empty now - time tracking removed)
  const getRecordsForDay = (date: Date) => {
    return [];
  };

  // Get leave requests for a specific day
  const getLeaveRequestsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return (leaveRequests || []).filter(leave => {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const day = new Date(dateStr);
      return isWithinInterval(day, { start, end });
    });
  };

  // Get shifts for a specific day
  const getShiftsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return (shifts || []).filter(shift => shift.date === dateStr);
  };

  // Navigation
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  const handleRefreshCalendar = async () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Export functions (removed - time tracking removed)
  const handleExportCSV = (startDate?: string, endDate?: string) => {
    try {
      // Filter leave requests by date range if provided
      let filteredLeaves = leaveRequests;
      if (startDate && endDate) {
        filteredLeaves = leaveRequests.filter(leave => {
          // Check if leave overlaps with selected range
          return leave.start_date <= endDate && leave.end_date >= startDate;
        });
      }

      // Create CSV content from leave requests
      const csvRows: string[] = [];
      
      // Header
      csvRows.push('Start Datum,End Datum,Typ,Status,Grund,Tage');
      
      // Data rows
      filteredLeaves.forEach(leave => {
        const row = [
          leave.start_date,
          leave.end_date,
          leave.type,
          leave.status,
          (leave.reason || '').replace(/,/g, ';'), // Replace commas to avoid CSV issues
          leave.days_requested?.toString() || '0'
        ];
        csvRows.push(row.join(','));
      });
      
      // Create and download
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const filename = startDate && endDate 
        ? `kalender-${startDate}_${endDate}.csv`
        : `kalender-${format(currentDate, 'yyyy-MM')}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ CSV export successful:', filteredLeaves.length, 'entries');
    } catch (error) {
      console.error('❌ CSV export failed:', error);
    }
  };

  const handleExportPDF = (startDate?: string, endDate?: string) => {
    try {
      // Filter leave requests by date range if provided
      let filteredLeaves = leaveRequests;
      if (startDate && endDate) {
        filteredLeaves = leaveRequests.filter(leave => {
          // Check if leave overlaps with selected range
          return leave.start_date <= endDate && leave.end_date >= startDate;
        });
      }

      // Create printable HTML content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Bitte Pop-ups für diese Seite erlauben');
        return;
      }
      
      const titleText = startDate && endDate
        ? `${format(new Date(startDate), 'dd.MM.yyyy', { locale: de })} - ${format(new Date(endDate), 'dd.MM.yyyy', { locale: de })}`
        : format(currentDate, 'MMMM yyyy', { locale: de });
      
      // Build HTML table
      let tableRows = '';
      filteredLeaves.forEach(leave => {
        tableRows += `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${leave.start_date}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${leave.end_date}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${leave.type}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${leave.status}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${leave.reason || '-'}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${leave.days_requested || 0}</td>
          </tr>
        `;
      });
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Kalender Export - ${titleText}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
              }
              h1 {
                color: #333;
                margin-bottom: 20px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th {
                background-color: #3b82f6;
                color: white;
                padding: 10px;
                text-align: left;
                border: 1px solid #ddd;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              @media print {
                button {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <h1>Kalender Export - ${titleText}</h1>
            <p>Exportiert am: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
            <p>Anzahl Einträge: ${filteredLeaves.length}</p>
            
            <table>
              <thead>
                <tr>
                  <th>Start Datum</th>
                  <th>End Datum</th>
                  <th>Typ</th>
                  <th>Status</th>
                  <th>Grund</th>
                  <th>Tage</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            
            <div style="margin-top: 20px;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Drucken / Als PDF speichern
              </button>
              <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
                Schließen
              </button>
            </div>
          </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      console.log('✅ PDF export window opened:', filteredLeaves.length, 'entries');
    } catch (error) {
      console.error('❌ PDF export failed:', error);
    }
  };

  const handleExportICal = () => {
    try {
      // Create iCal content
      const icalLines: string[] = [];
      
      icalLines.push('BEGIN:VCALENDAR');
      icalLines.push('VERSION:2.0');
      icalLines.push('PRODID:-//BrowoKoordinator//Calendar//DE');
      icalLines.push('CALSCALE:GREGORIAN');
      icalLines.push('METHOD:PUBLISH');
      icalLines.push('X-WR-CALNAME:Urlaub & Abwesenheit');
      icalLines.push('X-WR-TIMEZONE:Europe/Berlin');
      
      // Add each leave request as event
      leaveRequests.forEach(leave => {
        const uid = `leave-${leave.id}@browokoordinator.app`;
        const startDate = leave.start_date.replace(/-/g, '');
        const endDate = leave.end_date.replace(/-/g, '');
        const timestamp = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
        
        icalLines.push('BEGIN:VEVENT');
        icalLines.push(`UID:${uid}`);
        icalLines.push(`DTSTAMP:${timestamp}`);
        icalLines.push(`DTSTART;VALUE=DATE:${startDate}`);
        icalLines.push(`DTEND;VALUE=DATE:${endDate}`);
        icalLines.push(`SUMMARY:${leave.type} - ${leave.status}`);
        icalLines.push(`DESCRIPTION:${leave.reason || 'Keine Beschreibung'}`);
        icalLines.push('STATUS:CONFIRMED');
        icalLines.push('END:VEVENT');
      });
      
      icalLines.push('END:VCALENDAR');
      
      // Create and download
      const icalContent = icalLines.join('\r\n');
      const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `kalender-${format(currentDate, 'yyyy-MM')}.ics`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ iCal export successful');
    } catch (error) {
      console.error('❌ iCal export failed:', error);
    }
  };

  return {
    currentDate,
    setCurrentDate,
    selectedDay,
    setSelectedDay,
    viewMode,
    setViewMode,
    refreshTrigger,
    setRefreshTrigger,
    leaveRequests,
    loadingLeaves,
    isAdmin,
    calendarDays,
    users,
    teamUsers,
    getRecordsForDay,
    getLeaveRequestsForDay,
    getShiftsForDay,
    previousMonth,
    nextMonth,
    today,
    handleRefreshCalendar,
    handleExportCSV,
    handleExportPDF,
    handleExportICal,
    selectedWeek,
    setSelectedWeek,
    shifts, // 🔥 NEW: Export shifts for WeeklyShiftCalendar
    exportDialogOpen,
    setExportDialogOpen,
    exportType,
    setExportType,
    userTeams,
    setUserTeams,
    userSpecializations,
    setUserSpecializations,
  };
}