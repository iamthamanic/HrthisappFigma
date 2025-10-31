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
import { Calendar as CalendarIcon, Users, ChevronDown, ChevronRight } from './icons/BrowoKoIcons';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Button } from './ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { de } from 'date-fns/locale';
// Temporarily disabled DnD to debug
// import { DndProvider } from 'react-dnd';
// import { HTML5Backend } from 'react-dnd-html5-backend';
import { BrowoKo_WeeklyShiftCalendar } from './BrowoKo_WeeklyShiftCalendar';
import { BrowoKo_MiniCalendar } from './BrowoKo_MiniCalendar';
import { BrowoKo_DraggableUser } from './BrowoKo_DraggableUser';
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

  // Filter users based on selected team
  const filteredUsers = useMemo(() => {
    let users: User[] = [];
    
    if (selectedTeam === 'all') {
      users = teams.flatMap(t => t.members);
    } else {
      const team = teams.find(t => t.id === selectedTeam);
      users = team?.members || [];
    }

    // Apply additional filters
    if (filterLocation !== 'all') {
      users = users.filter(u => u.location_id === filterLocation);
    }
    if (filterDepartment !== 'all') {
      users = users.filter(u => u.department === filterDepartment);
    }
    if (filterSpecialization !== 'all') {
      users = users.filter(u => u.specialization === filterSpecialization);
    }

    return users;
  }, [selectedTeam, filterLocation, filterDepartment, filterSpecialization, teams]);

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
        {/* Sub-Tabs: Standort | Abteilung | Spezialisierung */}
        <Card>
          <CardContent className="pt-6">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="location">Standort</TabsTrigger>
                <TabsTrigger value="department">Abteilung</TabsTrigger>
                <TabsTrigger value="specialization">Spezialisierung</TabsTrigger>
              </TabsList>

              <TabsContent value="location" className="mt-6">
                {/* Filter: Standort */}
                <div className="flex items-center gap-4 mb-6">
                  <Select value={filterLocation} onValueChange={setFilterLocation}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Standort wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Standorte</SelectItem>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="department" className="mt-6">
                {/* Filter: Abteilung */}
                <div className="flex items-center gap-4 mb-6">
                  <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Abteilung wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Abteilungen</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="specialization" className="mt-6">
                {/* Filter: Spezialisierung */}
                <div className="flex items-center gap-4 mb-6">
                  <Select value={filterSpecialization} onValueChange={setFilterSpecialization}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Spezialisierung wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Spezialisierungen</SelectItem>
                      {specializations.map(spec => (
                        <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Main Layout: Sidebar + Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* LEFT SIDEBAR */}
          <div className="space-y-4 flex-shrink-0">
            {/* Mini-Kalender */}
            <Card>
              <CardContent className="pt-6">
                <BrowoKo_MiniCalendar
                  selectedWeek={selectedWeek}
                  onWeekChange={setSelectedWeek}
                />
              </CardContent>
            </Card>

            {/* Team & Mitarbeiter Filter */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Team Dropdown */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Team</label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Team wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Teams</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mitarbeiter Dropdown */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Mitarbeiter:in</label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mitarbeiter wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                      {filteredUsers.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.first_name} {user.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Mitarbeiterauswahl */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 border-b">
                    <h3 className="font-semibold text-gray-900">Mitarbeiterauswahl</h3>
                    {selectedTeam !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        {filteredUsers.length} Mitarbeiter
                      </Badge>
                    )}
                  </div>

                  {/* Info Text */}
                  {selectedTeam === 'all' ? (
                    <div className="text-sm text-gray-500 text-center py-4">
                      Bitte wähle ein Team aus, um Mitarbeiter anzuzeigen
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-4">
                      Keine Mitarbeiter in diesem Team
                    </div>
                  ) : (
                    <>
                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-gray-500 px-2">
                        <span>Ziehe Mitarbeiter auf den Kalender</span>
                        <span>
                          {filteredUsers.filter(user => shifts.some(s => s.user_id === user.id)).length} eingeplant
                        </span>
                      </div>

                      {/* Mitarbeiter Liste */}
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {filteredUsers.map(user => (
                          <BrowoKo_DraggableUser
                            key={user.id}
                            user={user}
                            hasShift={shifts.some(s => s.user_id === user.id)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: WEEKLY SHIFT CALENDAR */}
          <div className="min-w-0">
            <Card className="flex flex-col">
              <CardContent className="pt-6 flex-1 flex flex-col min-h-0">
                {/* New Horizontal Weekly Calendar */}
                <BrowoKo_WeeklyShiftCalendar
                  selectedWeek={selectedWeek}
                  shifts={shifts}
                  users={filteredUsers}
                  onWeekChange={setSelectedWeek}
                  getSpecializationColor={getSpecializationColor}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
}
