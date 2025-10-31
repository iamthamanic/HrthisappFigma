import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Users, UserCheck, UserX, Mail, Phone, Building2, 
  Search, X, Filter, Download, Plus 
} from '../icons/BrowoKoIcons';
import QuickActionsMenu from '../QuickActionsMenu';
import SortControls from '../SortControls';
import SavedSearchesDropdown from '../SavedSearchesDropdown';
import type { QuickActionType } from '../QuickActionsMenu';
import type { SortConfig } from '../SortControls';
import type { User, Location, Department, SavedSearch } from '../../types/database';

/**
 * HR EMPLOYEES LIST COMPONENT
 * ============================
 * Domain: BrowoKo
 * 
 * Displays employee list with stats, search, filters, and bulk selection
 */

interface EmployeesListProps {
  // Data
  users: User[];
  sortedUsers: User[];
  locations: Location[];
  departments: Department[];
  savedSearches: SavedSearch[];
  userTeamMemberships: Record<string, { role: string; teamName: string }[]>;
  
  // Filter states
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  setStatusFilter: (filter: 'all' | 'active' | 'inactive') => void;
  roleFilter: string;
  setRoleFilter: (filter: string) => void;
  teamRoleFilter: string;
  setTeamRoleFilter: (filter: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (filter: string) => void;
  locationFilter: string;
  setLocationFilter: (filter: string) => void;
  
  // Sort state
  sortConfig: SortConfig;
  setSortConfig: (config: SortConfig) => void;
  
  // Selection
  selectedUsers: User[];
  onToggleUserSelection: (user: User) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  
  // Actions
  onQuickAction: (action: QuickActionType, user: User) => void;
  onAddEmployee: () => void;
  onExport: () => void;
  onResetFilters: () => void;
  onApplySavedSearch: (config: any) => void;
  onSaveCurrentSearch: (name: string, description: string, isGlobal: boolean) => Promise<void>;
  onDeleteSavedSearch: (searchId: string) => Promise<void>;
  
  // User role
  isAdmin: boolean;
  hasActiveFilters: boolean;
}

export default function EmployeesList(props: EmployeesListProps) {
  const navigate = useNavigate();
  
  // Group users by status
  const activeUsers = props.users.filter(u => u.is_active);
  const inactiveUsers = props.users.filter(u => !u.is_active);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Gesamt Mitarbeiter</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {props.users.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Aktive</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {activeUsers.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inaktive</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {inactiveUsers.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                <UserX className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6 space-y-4">
          {/* Search Bar + Sort Controls */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Volltext-Suche: Name, E-Mail, Personalnummer, Position, Abteilung, Telefon, Adresse, Kleidergröße, Stunden, Urlaubstage..."
                value={props.searchQuery}
                onChange={(e) => props.setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {props.searchQuery && (
                <button
                  onClick={() => props.setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Controls */}
            <SortControls 
              currentSort={props.sortConfig}
              onSortChange={props.setSortConfig}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Status Filter */}
            <Select value={props.statusFilter} onValueChange={props.setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="emp-list-status-all" value="all">Alle Status</SelectItem>
                <SelectItem key="emp-list-status-active" value="active">Nur Aktive</SelectItem>
                <SelectItem key="emp-list-status-inactive" value="inactive">Nur Inaktive</SelectItem>
              </SelectContent>
            </Select>

            {/* Role Filter (Global Roles) */}
            <Select value={props.roleFilter} onValueChange={props.setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Globale Rolle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="emp-list-role-all" value="all">Alle Rollen</SelectItem>
                <SelectItem key="emp-list-role-employee" value="EMPLOYEE">Mitarbeiter</SelectItem>
                <SelectItem key="emp-list-role-hr" value="HR">HR</SelectItem>
                <SelectItem key="emp-list-role-admin" value="ADMIN">Admin</SelectItem>
                <SelectItem key="emp-list-role-superadmin" value="SUPERADMIN">Superadmin</SelectItem>
              </SelectContent>
            </Select>

            {/* Team Role Filter */}
            <Select value={props.teamRoleFilter} onValueChange={props.setTeamRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Team-Rolle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="emp-list-team-all" value="all">Alle Team-Rollen</SelectItem>
                <SelectItem key="emp-list-team-teamlead" value="TEAMLEAD">Teamlead</SelectItem>
                <SelectItem key="emp-list-team-member" value="MEMBER">Teammitglied</SelectItem>
                <SelectItem key="emp-list-team-none" value="NONE">Kein Team</SelectItem>
              </SelectContent>
            </Select>

            {/* Department Filter */}
            <Select value={props.departmentFilter} onValueChange={props.setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Abteilung" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="emp-list-dept-all" value="all">Alle Abteilungen</SelectItem>
                {props.departments.map((dept) => (
                  <SelectItem key={`emp-list-dept-${dept.id}`} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Location Filter */}
            <Select value={props.locationFilter} onValueChange={props.setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Standort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="emp-list-loc-all" value="all">Alle Standorte</SelectItem>
                {props.locations.map((loc) => (
                  <SelectItem key={`emp-list-loc-${loc.id}`} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Display */}
          {props.hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Filter className="w-4 h-4" />
                Aktive Filter:
              </span>
              {props.searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Suche: "{props.searchQuery.substring(0, 20)}{props.searchQuery.length > 20 ? '...' : ''}"
                  <button onClick={() => props.setSearchQuery('')} className="ml-1 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {props.statusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Status: {props.statusFilter === 'active' ? 'Aktiv' : 'Inaktiv'}
                  <button onClick={() => props.setStatusFilter('all')} className="ml-1 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {props.roleFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Rolle: {props.roleFilter}
                  <button onClick={() => props.setRoleFilter('all')} className="ml-1 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {props.teamRoleFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Team-Rolle: {
                    props.teamRoleFilter === 'TEAMLEAD' ? 'Teamlead' :
                    props.teamRoleFilter === 'MEMBER' ? 'Teammitglied' :
                    'Kein Team'
                  }
                  <button onClick={() => props.setTeamRoleFilter('all')} className="ml-1 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {props.departmentFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Abteilung: {props.departmentFilter}
                  <button onClick={() => props.setDepartmentFilter('all')} className="ml-1 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {props.locationFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Standort: {props.locations.find(l => l.id === props.locationFilter)?.name}
                  <button onClick={() => props.setLocationFilter('all')} className="ml-1 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={props.onResetFilters}
                className="text-xs h-6"
              >
                Alle Filter zurücksetzen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle>Mitarbeiter ({props.sortedUsers.length})</CardTitle>
          {props.sortedUsers.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={props.selectedUsers.length === props.sortedUsers.length ? props.onClearSelection : props.onSelectAll}
                className="w-full sm:w-auto"
              >
                {props.selectedUsers.length === props.sortedUsers.length ? 'Auswahl aufheben' : 'Alle auswählen'}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {props.sortedUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Keine Mitarbeiter gefunden</p>
                {props.searchQuery && (
                  <Button
                    variant="link"
                    onClick={() => props.setSearchQuery('')}
                    className="mt-2"
                  >
                    Suche zurücksetzen
                  </Button>
                )}
              </div>
            ) : (
              props.sortedUsers.map((user) => {
                const isSelected = props.selectedUsers.some(u => u.id === user.id);
                return (
                  <div
                    key={user.id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg transition-all gap-4 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {/* Mobile: Checkbox + Avatar + Info stacked */}
                    {/* Desktop: Checkbox | Avatar + Info | Actions */}
                    
                    <div className="flex items-start sm:items-center gap-4 flex-1">
                      {/* Checkbox */}
                      <div 
                        className="flex items-center cursor-pointer flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          props.onToggleUserSelection(user);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => props.onToggleUserSelection(user)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>

                      <div 
                        className="flex items-start sm:items-center gap-4 flex-1 cursor-pointer min-w-0"
                        onClick={() => navigate(`/admin/team-und-mitarbeiterverwaltung/user/${user.id}`)}
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {user.profile_picture ? (
                            <img 
                              src={user.profile_picture} 
                              alt={`${user.first_name} ${user.last_name}`}
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-200">
                              <span className="text-white font-semibold">
                                {user.first_name?.[0] || '?'}{user.last_name?.[0] || '?'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* User Info - Stack on Mobile */}
                        <div className="flex-1 min-w-0">
                          {/* Name + Badges - Wrap on mobile */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </p>
                            <Badge variant={user.is_active ? 'default' : 'secondary'}>
                              {user.is_active ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={
                                user.role === 'SUPERADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                user.role === 'ADMIN' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                user.role === 'HR' ? 'bg-green-50 text-green-700 border-green-200' :
                                'bg-gray-50'
                              }
                            >
                              {user.role === 'SUPERADMIN' ? 'Super Admin' :
                               user.role === 'ADMIN' ? 'Admin' :
                               user.role === 'HR' ? 'HR' :
                               'Mitarbeiter'}
                            </Badge>
                            {/* Show Teamlead badge if user is teamlead in any team */}
                            {props.userTeamMemberships[user.id]?.some(m => m.role === 'TEAMLEAD') && (
                              <Badge 
                                variant="outline" 
                                className="bg-orange-50 text-orange-700 border-orange-200"
                              >
                                Teamlead
                              </Badge>
                            )}
                          </div>
                          
                          {/* Details - Stack on mobile, horizontal on desktop */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-sm text-gray-500">
                            {user.employee_number && (
                              <span className="whitespace-nowrap">#{user.employee_number}</span>
                            )}
                            {user.department && (
                              <span className="flex items-center gap-1 whitespace-nowrap">
                                <Building2 className="w-3 h-3" />
                                {user.department}
                              </span>
                            )}
                            {user.position && (
                              <span className="truncate">{user.position}</span>
                            )}
                            {user.location_id && (() => {
                              const location = props.locations.find(l => l.id === user.location_id);
                              return location ? (
                                <span className="flex items-center gap-1 whitespace-nowrap">
                                  📍 {location.name}
                                </span>
                              ) : null;
                            })()}
                          </div>
                          
                          {/* Contact Info - Stack on mobile */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </span>
                            {user.phone && (
                              <span className="flex items-center gap-1 whitespace-nowrap">
                                <Phone className="w-3 h-3" />
                                {user.phone}
                              </span>
                            )}
                        </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions - Always on right side */}
                    <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0 self-start sm:self-center">
                      <QuickActionsMenu 
                        user={user}
                        onAction={props.onQuickAction}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
