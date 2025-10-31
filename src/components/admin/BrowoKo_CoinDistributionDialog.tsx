/**
 * ============================================
 * COIN DISTRIBUTION DIALOG (v3.9.3)
 * ============================================
 * Description: Admin Dialog für Coin-Verteilung mit Multi-Select
 * ============================================
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Coins, Search, Users, X, Building2, MapPin } from '../icons/BrowoKoIcons';
import { toast } from 'sonner@2.0.3';
import { UserService } from '../../services/BrowoKo_userService';
import { supabase } from '../../utils/supabase/client';
import * as coinAchievementsService from '../../services/BrowoKo_coinAchievementsService';

// Create service instance with Supabase client
const userService = new UserService(supabase);

interface CoinDistributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDistribute: (data: CoinDistributionData) => Promise<void>;
  organizationId: string;
}

export interface CoinDistributionData {
  user_ids: string[]; // Multiple users
  amount: number;
  reason: string;
}

interface UserOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  position?: string;
  department?: string;
  location_id?: string;
  location_name?: string;
  profile_picture?: string;
  employee_number?: string;
  is_active: boolean;
  teams: { role: string; teamName: string }[];
  coin_balance?: number;
}

export default function CoinDistributionDialog({
  open,
  onOpenChange,
  onDistribute,
  organizationId,
}: CoinDistributionDialogProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [amount, setAmount] = useState<number>(100);
  const [reason, setReason] = useState<string>('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load users when dialog opens
  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open, organizationId]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      console.log('🔄 Loading users for organization:', organizationId);
      
      // Load all users
      const allUsers = await userService.getAllUsers({ organization_id: organizationId });
      console.log('✅ Loaded users:', allUsers.length);
      
      // Get coin balances
      const userIds = allUsers.map((u) => u.id);
      const coinBalances = await coinAchievementsService.getUsersCoinBalances(userIds);
      console.log('💰 Loaded coin balances:', coinBalances);
      
      // Load locations
      const { data: locationsData } = await supabase
        .from('locations')
        .select('*')
        .eq('organization_id', organizationId);
      
      const locationsMap = new Map(locationsData?.map(l => [l.id, l.name]) || []);
      
      // Load team memberships for all users
      const { data: teamMemberships } = await supabase
        .from('team_members')
        .select(`
          user_id,
          role,
          teams!inner (
            id,
            name,
            organization_id
          )
        `)
        .eq('teams.organization_id', organizationId)
        .in('user_id', userIds);
      
      // Group team memberships by user
      const userTeams: Record<string, { role: string; teamName: string }[]> = {};
      teamMemberships?.forEach((tm: any) => {
        if (!userTeams[tm.user_id]) {
          userTeams[tm.user_id] = [];
        }
        userTeams[tm.user_id].push({
          role: tm.role,
          teamName: tm.teams.name,
        });
      });
      
      // Map to options with all data
      const userOptions: UserOption[] = allUsers.map((u) => ({
        id: u.id,
        first_name: u.first_name || '',
        last_name: u.last_name || '',
        email: u.email,
        role: u.role,
        position: u.position,
        department: u.department,
        location_id: u.location_id,
        location_name: u.location_id ? locationsMap.get(u.location_id) : undefined,
        profile_picture: u.profile_picture,
        employee_number: u.employee_number,
        is_active: u.is_active,
        teams: userTeams[u.id] || [],
        coin_balance: coinBalances[u.id] || 0,
      }));

      // Sort by coin balance (lowest first)
      userOptions.sort((a, b) => (a.coin_balance || 0) - (b.coin_balance || 0));
      
      setUsers(userOptions);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      toast.error('Fehler beim Laden der Mitarbeiter');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleReset = () => {
    setSelectedUserIds([]);
    setAmount(100);
    setReason('');
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (selectedUserIds.length === 0) {
      toast.error('Bitte wähle mindestens einen Mitarbeiter aus');
      return;
    }

    if (amount <= 0) {
      toast.error('Betrag muss größer als 0 sein');
      return;
    }

    if (!reason.trim()) {
      toast.error('Bitte gib einen Grund an');
      return;
    }

    try {
      setDistributing(true);
      
      const data: CoinDistributionData = {
        user_ids: selectedUserIds,
        amount,
        reason: reason.trim(),
      };

      await onDistribute(data);
      
      // Success handled by parent
      handleReset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error distributing coins:', error);
      // Error toast handled by parent
    } finally {
      setDistributing(false);
    }
  };

  const handleClose = () => {
    if (!distributing) {
      handleReset();
      onOpenChange(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      // Deselect all
      setSelectedUserIds([]);
    } else {
      // Select all filtered users
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  // Filter users based on search query
  // Search by name, email, role, team, department, location, employee number
  const filteredUsers = searchQuery
    ? users.filter((user) => {
        const query = searchQuery.toLowerCase();
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        const email = user.email.toLowerCase();
        const empNumber = (user.employee_number || '').toLowerCase();
        const role = (
          user.role === 'SUPERADMIN' ? 'super admin' :
          user.role === 'ADMIN' ? 'admin' :
          user.role === 'HR' ? 'hr' :
          'mitarbeiter'
        ).toLowerCase();
        const position = (user.position || '').toLowerCase();
        const department = (user.department || '').toLowerCase();
        const location = (user.location_name || '').toLowerCase();
        const teams = user.teams.map(t => t.teamName.toLowerCase()).join(' ');
        
        return (
          fullName.includes(query) ||
          email.includes(query) ||
          empNumber.includes(query) ||
          role.includes(query) ||
          position.includes(query) ||
          department.includes(query) ||
          location.includes(query) ||
          teams.includes(query)
        );
      })
    : users; // Show ALL users, sorted by coin balance (lowest first)

  const totalCoins = amount * selectedUserIds.length;

  // Get selected user details
  const selectedUsersDetails = users.filter(u => selectedUserIds.includes(u.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-600" />
            Coins verteilen
          </DialogTitle>
          <DialogDescription>
            Wähle Mitarbeiter aus und verteile Coins als Belohnung oder Anerkennung
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col space-y-4 overflow-y-auto pr-2">
          {/* Search & Select All */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Mitarbeiter auswählen *</Label>
              {!loadingUsers && filteredUsers.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="h-8 text-xs"
                >
                  {selectedUserIds.length === filteredUsers.length ? 'Alle abwählen' : 'Alle auswählen'}
                </Button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Durchsuche alle Mitarbeiter (Name, Email, Nummer, Rolle, Team, Abteilung, Standort...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Selected Users Display - Compact */}
            {selectedUsersDetails.length > 0 && (
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-blue-900">
                    ✓ {selectedUsersDetails.length} ausgewählt
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedUserIds([])}
                    className="text-xs text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    Alle abwählen
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedUsersDetails.map((user) => {
                    const fullName = `${user.first_name} ${user.last_name}`.trim();
                    return (
                      <div
                        key={user.id}
                        className="flex items-center gap-1.5 px-2 py-1 bg-white border border-blue-300 rounded text-xs"
                      >
                        <span className="font-medium text-gray-900">{fullName}</span>
                        <span className="text-yellow-600">💰{user.coin_balance || 0}</span>
                        <button
                          type="button"
                          onClick={() => toggleUser(user.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Users List */}
          <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col flex-shrink-0" style={{ height: '300px' }}>
            {loadingUsers ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Lade Mitarbeiter...</p>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    {searchQuery ? 'Keine Mitarbeiter gefunden' : 'Keine Mitarbeiter verfügbar'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => {
                    const isSelected = selectedUserIds.includes(user.id);
                    const fullName = `${user.first_name} ${user.last_name}`.trim() || user.email;

                    return (
                      <label
                        key={user.id}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 hover:bg-blue-100' : ''
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleUser(user.id)}
                          className="mt-1"
                        />
                        
                        {/* Profile Picture / Avatar */}
                        <div className="flex-shrink-0">
                          {user.profile_picture ? (
                            <img 
                              src={user.profile_picture} 
                              alt={fullName}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-200">
                              <span className="text-white text-sm font-semibold">
                                {user.first_name?.[0] || '?'}{user.last_name?.[0] || '?'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* User Info - Compact */}
                        <div className="flex-1 min-w-0">
                          {/* Name + Key Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900">
                              {fullName}
                            </span>
                            
                            {/* Only show key badges */}
                            {user.role !== 'EMPLOYEE' && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  user.role === 'SUPERADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                  user.role === 'ADMIN' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  'bg-green-50 text-green-700 border-green-200'
                                }`}
                              >
                                {user.role === 'SUPERADMIN' ? 'Super Admin' :
                                 user.role === 'ADMIN' ? 'Admin' :
                                 'HR'}
                              </Badge>
                            )}
                            
                            {user.teams.some(t => t.role === 'TEAMLEAD') && (
                              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                Teamlead
                              </Badge>
                            )}
                            
                            <span className="text-xs text-yellow-600 font-medium">
                              💰 {user.coin_balance || 0}
                            </span>
                          </div>
                          
                          {/* Compact Info Line */}
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            {user.position && <span>{user.position}</span>}
                            {user.department && (
                              <>
                                {user.position && <span>•</span>}
                                <span>{user.department}</span>
                              </>
                            )}
                            {user.location_name && (
                              <>
                                {(user.position || user.department) && <span>•</span>}
                                <span>📍 {user.location_name}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Selected Indicator */}
                        {isSelected && (
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center">
                              <span className="text-xs">✓</span>
                            </div>
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Selected Count */}
          {selectedUserIds.length > 0 && (
            <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <Users className="w-4 h-4 inline mr-1 text-blue-600" />
              <strong>{selectedUserIds.length}</strong> {selectedUserIds.length === 1 ? 'Mitarbeiter' : 'Mitarbeiter'} ausgewählt
            </div>
          )}

          {/* Amount */}
          <div>
            <Label htmlFor="amount">Coin-Betrag pro Mitarbeiter *</Label>
            <div className="relative">
              <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-600" />
              <Input
                id="amount"
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                placeholder="z.B. 100"
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Grund *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="z.B. Bonus für gute Leistung, Teambuilding Event, etc."
              rows={3}
              required
            />
          </div>

          {/* Summary */}
          {selectedUserIds.length > 0 && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-600" />
                Zusammenfassung
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Empfänger:</span>
                  <span className="font-medium text-gray-900">
                    {selectedUserIds.length} {selectedUserIds.length === 1 ? 'Mitarbeiter' : 'Mitarbeiter'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Betrag pro Person:</span>
                  <span className="font-medium text-gray-900">{amount} Coins</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-yellow-300">
                  <span className="font-medium text-gray-900">Gesamt:</span>
                  <span className="text-lg font-bold text-yellow-700">
                    {totalCoins.toLocaleString('de-DE')} Coins
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Dialog Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={distributing}
            >
              Abbrechen
            </Button>
            <Button 
              type="submit" 
              disabled={distributing || selectedUserIds.length === 0}
            >
              {distributing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Wird verteilt...
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4 mr-2" />
                  Coins verteilen
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
