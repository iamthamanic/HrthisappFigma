/**
 * @file BrowoKo_ShiftPlanningTab.tsx
 * @version 1.0.0
 * @description Schichtplanung Tab Component with Timeline & Drag & Drop
 * 
 * Features:
 * - Sub-Tabs: Standort | Abteilung | Spezialisierung
 * - Left Sidebar: Mini-Kalender + Team/Mitarbeiter Accordion
 * - Right: Wochenansicht Timeline (Mo-So, 7:00-19:00)
 * - Drag & Drop: User → Timeline, Shift verschieben
 * - Farbcodierung nach Spezialisierung
 */

import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Users, ChevronDown, ChevronRight, Search, X } from './icons/BrowoKoIcons';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Button } from './ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { de } from 'date-fns/locale';
import { BrowoKo_WeeklyShiftCalendar } from './BrowoKo_WeeklyShiftCalendar';
import { BrowoKo_MiniCalendar } from './BrowoKo_MiniCalendar';
import { BrowoKo_DraggableUser } from './BrowoKo_DraggableUser';
import { BrowoKo_CreateShiftDialog } from './BrowoKo_CreateShiftDialog';
import { BrowoKo_EmployeeInfoCard } from './BrowoKo_EmployeeInfoCard';
import { BrowoKo_WeeklyAbsenceWidget } from './BrowoKo_WeeklyAbsenceWidget';
import { BrowoKo_useShiftPlanning } from '../hooks/BrowoKo_useShiftPlanning';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture?: string;
  location_id?: string;
  department?: string;
  specialization?: string;
  team_id?: string;
}

interface Team {
  id: string;
  name: string;
  member_count: number;
  scheduled_count: number;
  members: User[];
}

interface Shift {
  id: string;
  user_id: string;
  date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  location_id?: string;
  department_id?: string;
  specialization?: string;
  notes?: string;
}

interface Location {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

export function BrowoKo_ShiftPlanningTab() {
  // State
  const [viewMode, setViewMode] = useState<'location' | 'department' | 'specialization'>('specialization');
  const [selectedWeek, setSelectedWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterSpecialization, setFilterSpecialization] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>(''); // Mitarbeiter-Suche
  
  // Dialog State für Schicht-Erstellung und -Bearbeitung
  const [createShiftDialogOpen, setCreateShiftDialogOpen] = useState(false);
  const [selectedUserForShift, setSelectedUserForShift] = useState<User | null>(null);
  const [editShift, setEditShift] = useState<Shift | null>(null);
  
  // State für ausgewählten Mitarbeiter in Info-Karte
  const [selectedUserForInfo, setSelectedUserForInfo] = useState<User | null>(null);

  // ✅ REAL DATA from Supabase (NO MORE MOCK DATA!)
  const {
    locations,
    departments,
    teams,
    shifts,
    users,
    loading,
    error,
    refetch,
    createShift,
    createMultipleShifts,
    getUserShifts,
    getUserShiftsForWeek,
    checkShiftOverlap,
    updateShift,
    deleteShift,
  } = BrowoKo_useShiftPlanning(selectedWeek);

  // Extract unique specializations from users
  const specializations = useMemo(() => {
    const specs = new Set<string>();
    users.forEach(user => {
      if (user.specialization) specs.add(user.specialization);
    });
    return Array.from(specs).sort();
  }, [users]);

  // Helpers
  const getDisplayValue = (shift: Shift, user: User): string => {
    if (viewMode === 'location') {
      const location = locations.find(l => l.id === shift.location_id);
      return location?.name || 'Unbekannt';
    } else if (viewMode === 'department') {
      return user.department || 'Unbekannt';
    } else {
      return shift.specialization || user.specialization || 'Unbekannt';
    }
  };

  // Get color for specialization (returns HEX color for inline styles)
  const getSpecializationColor = (spec: string): string => {
    const colors: Record<string, string> = {
      'Baustelle': '#FB923C', // orange-400
      'BACKSTUBE': '#F97316', // orange-500
      'GEMÜSE': '#C084FC', // purple-400
      'SCHUMIBÄCKER ZONE': '#FACC15', // yellow-400
      'NETZWERKRAUM-APPLE': '#60A5FA', // blue-400
    };
    
    // Simple hash for consistent colors
    if (!colors[spec]) {
      const hash = spec.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const colorOptions = ['#F472B6', '#818CF8', '#4ADE80', '#F87171', '#2DD4BF']; // pink, indigo, green, red, teal
      return colorOptions[hash % colorOptions.length];
    }
    
    return colors[spec];
  };

  // Week navigation
  const previousWeek = () => setSelectedWeek(prev => subWeeks(prev, 1));
  const nextWeek = () => setSelectedWeek(prev => addWeeks(prev, 1));
  const goToToday = () => setSelectedWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Shift edit/delete handlers
  const handleEditShift = (shift: Shift) => {
    // Find the user for this shift
    const user = users.find(u => u.id === shift.user_id);
    if (user) {
      setSelectedUserForShift(user);
      setEditShift(shift);
      setCreateShiftDialogOpen(true);
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    await deleteShift(shiftId);
    refetch(); // Refresh data
  };

  const handleUpdateShift = async (shiftId: string, shiftData: any) => {
    await updateShift(shiftId, shiftData);
    refetch(); // Refresh data
  };

  // Filter users based on selected team and filters (für Mitarbeiterauswahl)
  const filteredUsers = useMemo(() => {
    let filteredList: User[] = [];
    
    // Team Filter
    if (selectedTeam === 'all') {
      // Alle User anzeigen (sowohl mit als auch ohne Team)
      filteredList = users;
    } else if (selectedTeam === 'none') {
      // Nur Mitarbeiter ohne Team-Zuweisung
      const allTeamMemberIds = new Set(teams.flatMap(t => t.members.map(m => m.id)));
      filteredList = users.filter(u => !allTeamMemberIds.has(u.id));
    } else {
      // Spezifisches Team
      const team = teams.find(t => t.id === selectedTeam);
      filteredList = team?.members || [];
    }

    // Apply additional filters
    if (filterLocation !== 'all') {
      if (filterLocation === 'none') {
        filteredList = filteredList.filter(u => !u.location_id || u.location_id === '');
      } else {
        filteredList = filteredList.filter(u => u.location_id === filterLocation);
      }
    }
    if (filterDepartment !== 'all') {
      if (filterDepartment === 'none') {
        filteredList = filteredList.filter(u => !u.department || u.department === '');
      } else {
        filteredList = filteredList.filter(u => u.department === filterDepartment);
      }
    }
    if (filterSpecialization !== 'all') {
      if (filterSpecialization === 'none') {
        filteredList = filteredList.filter(u => !u.specialization || u.specialization === '');
      } else {
        filteredList = filteredList.filter(u => u.specialization === filterSpecialization);
      }
    }

    // Apply search query (Volltextsuche)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredList = filteredList.filter(u => {
        const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
        const email = u.email?.toLowerCase() || '';
        const specialization = u.specialization?.toLowerCase() || '';
        const department = u.department?.toLowerCase() || '';
        
        return fullName.includes(query) || 
               email.includes(query) || 
               specialization.includes(query) ||
               department.includes(query);
      });
    }

    return filteredList;
  }, [selectedTeam, filterLocation, filterDepartment, filterSpecialization, searchQuery, teams, users]);

  // Filter shifts based on viewMode and filters (für KW-Ansicht)
  const filteredShifts = useMemo(() => {
    let filtered = [...shifts];

    if (viewMode === 'location' && filterLocation !== 'all') {
      if (filterLocation === 'none') {
        filtered = filtered.filter(s => !s.location_id || s.location_id === '');
      } else {
        filtered = filtered.filter(s => s.location_id === filterLocation);
      }
    }
    if (viewMode === 'department' && filterDepartment !== 'all') {
      if (filterDepartment === 'none') {
        filtered = filtered.filter(s => {
          const shiftUser = users.find(u => u.id === s.user_id);
          return !shiftUser?.department || shiftUser.department === '';
        });
      } else {
        filtered = filtered.filter(s => {
          const shiftUser = users.find(u => u.id === s.user_id);
          return shiftUser?.department === filterDepartment;
        });
      }
    }
    if (viewMode === 'specialization' && filterSpecialization !== 'all') {
      if (filterSpecialization === 'none') {
        filtered = filtered.filter(s => !s.specialization || s.specialization === '');
      } else {
        filtered = filtered.filter(s => s.specialization === filterSpecialization);
      }
    }

    return filtered;
  }, [shifts, viewMode, filterLocation, filterDepartment, filterSpecialization, users]);

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Lade Schichtplanung...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Fehler</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={() => refetch()}>Erneut versuchen</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ✅ MAX-WIDTH CONTAINER für große Monitore */}
      <div className="max-w-[1800px] mx-auto">
      {/* TOP ROW: Mini-Kalender + Filter | Mitarbeiter-Info nebeneinander */}
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4">
        {/* LEFT COLUMN: Mini-Kalender + Filter Box */}
        <div className="space-y-4">
          {/* Mini-Kalender */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="max-w-sm">
                <BrowoKo_MiniCalendar
                  selectedWeek={selectedWeek}
                  onWeekChange={setSelectedWeek}
                />
                
                {/* Legende */}
                <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-500 pl-10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500 ring-1 ring-blue-500 ring-offset-1" />
                    <span>Heute</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Feiertag (hover für Details)</span>
                  </div>
                </div>

                {/* Abwesenheiten Widget */}
                <BrowoKo_WeeklyAbsenceWidget selectedWeek={selectedWeek} />
              </div>
            </CardContent>
          </Card>

          {/* Filter Box */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Filter</h3>
              
              <div className="grid grid-cols-1 gap-2">
                {/* Team Filter */}
                <div>
                  <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Team</label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Teams</SelectItem>
                      <SelectItem value="none" className="text-gray-500 italic">Keine Zuweisung</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Standort Filter */}
                <div>
                  <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Standort</label>
                  <Select value={filterLocation} onValueChange={setFilterLocation}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Standort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Standorte</SelectItem>
                      <SelectItem value="none" className="text-gray-500 italic">Keine Zuweisung</SelectItem>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Abteilung Filter */}
                <div>
                  <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Abteilung</label>
                  <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Abteilung" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Abteilungen</SelectItem>
                      <SelectItem value="none" className="text-gray-500 italic">Keine Zuweisung</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Spezialisierung Filter */}
                <div>
                  <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Spezialisierung</label>
                  <Select value={filterSpecialization} onValueChange={setFilterSpecialization}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Spezialisierung" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Spezialisierungen</SelectItem>
                      <SelectItem value="none" className="text-gray-500 italic">Keine Zuweisung</SelectItem>
                      {specializations.map(spec => (
                        <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Mitarbeiter-Info-Karte */}
        <BrowoKo_EmployeeInfoCard 
          selectedUser={selectedUserForInfo}
          locations={locations}
          onAssignShift={(user) => {
            setSelectedUserForShift(user);
            setSelectedUserForInfo(user);
            setEditShift(null);
            setCreateShiftDialogOpen(true);
          }}
        />
      </div>

      {/* MAIN CONTENT: Mitarbeiterliste links | KW-Kalender rechts */}
      <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-4 xl:items-start">
        
        {/* LEFT: Mitarbeiterauswahl */}
        <Card className="flex flex-col xl:sticky xl:top-4 xl:max-h-[calc(100vh-8rem)]">
          <CardContent className="pt-4 space-y-3 flex-1 flex flex-col overflow-hidden max-h-full">
              {/* Mitarbeiter Liste Header */}
              <div className="flex items-center justify-between flex-shrink-0">
                <h3 className="text-sm font-semibold text-gray-900">Mitarbeiter:innen</h3>
                <Badge variant="secondary" className="text-[11px] px-1.5 py-0.5">
                  {filteredUsers.length}
                </Badge>
              </div>

              {/* Mitarbeiter-Suchfeld */}
              <div className="relative flex-shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Mitarbeiter suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 pr-9 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Mitarbeiter Liste */}
              {filteredUsers.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-8 flex-1 flex flex-col items-center justify-center">
                  {searchQuery ? (
                    <>
                      <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="font-medium">Keine Ergebnisse</p>
                      <p className="text-xs mt-1">Versuche einen anderen Suchbegriff</p>
                    </>
                  ) : (
                    'Keine Mitarbeiter gefunden'
                  )}
                </div>
              ) : (
                <>
                  {/* Stats */}
                  <div className="flex items-center justify-between text-[11px] text-gray-500 px-1 flex-shrink-0">
                    <span className="hidden xl:inline">
                      {searchQuery ? (
                        <span className="text-blue-600 font-medium">🔍 {filteredUsers.length} Treffer</span>
                      ) : (
                        'Klicke für Schicht'
                      )}
                    </span>
                    <span className="xl:hidden">
                      {searchQuery ? `${filteredUsers.length} Treffer` : 'Schicht erstellen'}
                    </span>
                    <span className="font-medium text-blue-600">
                      {filteredUsers.filter(user => shifts.some(s => s.user_id === user.id)).length} eingeplant
                    </span>
                  </div>

                  {/* Mitarbeiter Liste mit Scroll */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 min-h-0">
                    {filteredUsers.map(user => (
                      <BrowoKo_DraggableUser
                        key={user.id}
                        user={user}
                        hasShift={shifts.some(s => s.user_id === user.id)}
                        isSelected={selectedUserForInfo?.id === user.id}
                        onClick={() => {
                          // Nur Info-Karte aktualisieren (KEIN Dialog!)
                          setSelectedUserForInfo(user);
                        }}
                        onAssignShift={(user) => {
                          // Schicht-Dialog öffnen + Info-Karte aktualisieren
                          setSelectedUserForShift(user);
                          setSelectedUserForInfo(user);
                          setEditShift(null);
                          setCreateShiftDialogOpen(true);
                        }}
                        getUserShifts={getUserShifts}
                        onEditShift={handleEditShift}
                        onDeleteShift={handleDeleteShift}
                        locations={locations}
                      />
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

        {/* RIGHT: WEEKLY SHIFT CALENDAR */}
        <Card className="flex flex-col min-w-0 overflow-hidden">
          <CardContent className="pt-4 md:pt-6 flex-1 flex flex-col min-h-0 min-w-0 space-y-4">
            {/* Filter für Schichten-Ansicht */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 pb-4 border-b">
              <span className="text-sm font-medium text-gray-700 shrink-0">Schichten filtern:</span>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                <Select value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                  <SelectTrigger className="w-full sm:w-[180px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="location">Nach Standort</SelectItem>
                    <SelectItem value="department">Nach Abteilung</SelectItem>
                    <SelectItem value="specialization">Nach Spezialisierung</SelectItem>
                  </SelectContent>
                </Select>

                {viewMode === 'location' && (
                  <Select value={filterLocation} onValueChange={setFilterLocation}>
                    <SelectTrigger className="w-full sm:w-[200px] h-9">
                      <SelectValue placeholder="Alle Standorte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Standorte</SelectItem>
                      <SelectItem value="none" className="text-gray-500 italic">Keine Zuweisung</SelectItem>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {viewMode === 'department' && (
                  <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                    <SelectTrigger className="w-full sm:w-[200px] h-9">
                      <SelectValue placeholder="Alle Abteilungen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Abteilungen</SelectItem>
                      <SelectItem value="none" className="text-gray-500 italic">Keine Zuweisung</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {viewMode === 'specialization' && (
                  <Select value={filterSpecialization} onValueChange={setFilterSpecialization}>
                    <SelectTrigger className="w-full sm:w-[200px] h-9">
                      <SelectValue placeholder="Alle Spezialisierungen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Spezialisierungen</SelectItem>
                      <SelectItem value="none" className="text-gray-500 italic">Keine Zuweisung</SelectItem>
                      {specializations.map(spec => (
                        <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Badge variant="outline" className="ml-auto shrink-0">
                {filteredShifts.length} Schichten
              </Badge>
            </div>

            {/* Horizontal Weekly Calendar (scrollable on mobile) */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <BrowoKo_WeeklyShiftCalendar
                selectedWeek={selectedWeek}
                shifts={filteredShifts}
                users={filteredUsers}
                onWeekChange={setSelectedWeek}
                getSpecializationColor={getSpecializationColor}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Shift Dialog */}
      <BrowoKo_CreateShiftDialog
        open={createShiftDialogOpen}
        onClose={() => {
          setCreateShiftDialogOpen(false);
          setSelectedUserForShift(null);
          setEditShift(null);
        }}
        user={selectedUserForShift}
        selectedWeek={selectedWeek}
        locations={locations}
        departments={departments}
        specializations={specializations}
        onCreateShift={createShift}
        onCreateMultipleShifts={createMultipleShifts}
        onUpdateShift={handleUpdateShift}
        editShift={editShift}
        getUserShiftsForWeek={getUserShiftsForWeek}
        checkShiftOverlap={checkShiftOverlap}
      />
      </div> {/* ✅ Close max-width container */}
    </div>
  );
}
