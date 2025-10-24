import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Search } from '../icons/HRTHISIcons';
import type { User, Team } from '../../types/database';

/**
 * HR TEAM DIALOG COMPONENT
 * =========================
 * Domain: HRTHIS
 * 
 * Dialog for creating and editing teams with teamleads and members
 */

interface TeamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    name: string,
    description: string,
    teamLeads: string[],
    members: string[],
    teamLeadTags: Record<string, 'PRIMARY' | 'BACKUP' | 'BACKUP_BACKUP'>
  ) => Promise<void>;
  editingTeam: Team | null;
  users: User[];
  initialData?: {
    name: string;
    description: string;
    leads: string[];
    members: string[];
    tags: Record<string, 'PRIMARY' | 'BACKUP' | 'BACKUP_BACKUP'>;
  };
}

export default function TeamDialog({
  isOpen,
  onClose,
  onSave,
  editingTeam,
  users,
  initialData,
}: TeamDialogProps) {
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [selectedTeamLeads, setSelectedTeamLeads] = useState<string[]>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [teamLeadTags, setTeamLeadTags] = useState<Record<string, 'PRIMARY' | 'BACKUP' | 'BACKUP_BACKUP'>>({});
  const [teamLeadSearch, setTeamLeadSearch] = useState('');
  const [teamMemberSearch, setTeamMemberSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Initialize from initialData when dialog opens
  useEffect(() => {
    if (isOpen && initialData) {
      setTeamName(initialData.name);
      setTeamDescription(initialData.description);
      setSelectedTeamLeads(initialData.leads);
      setSelectedTeamMembers(initialData.members);
      setTeamLeadTags(initialData.tags);
    }
  }, [isOpen, initialData]);

  // Reset state when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Reset after animation
      setTimeout(() => {
        setTeamName('');
        setTeamDescription('');
        setSelectedTeamLeads([]);
        setSelectedTeamMembers([]);
        setTeamLeadTags({});
        setTeamLeadSearch('');
        setTeamMemberSearch('');
      }, 300);
    }
  };

  // Initialize state from editingTeam
  const initializeState = (
    name: string,
    description: string,
    leads: string[],
    members: string[],
    tags: Record<string, 'PRIMARY' | 'BACKUP' | 'BACKUP_BACKUP'>
  ) => {
    setTeamName(name);
    setTeamDescription(description);
    setSelectedTeamLeads(leads);
    setSelectedTeamMembers(members);
    setTeamLeadTags(tags);
    setTeamLeadSearch('');
    setTeamMemberSearch('');
  };

  const handleSave = async () => {
    if (!teamName.trim()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(teamName, teamDescription, selectedTeamLeads, selectedTeamMembers, teamLeadTags);
      onClose();
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setSaving(false);
    }
  };

  // Filter teamleads (ADMIN, HR, SUPERADMIN only)
  const availableTeamLeads = users
    .filter(u => !selectedTeamMembers.includes(u.id))
    .filter(u => u.role === 'ADMIN' || u.role === 'HR' || u.role === 'SUPERADMIN')
    .filter(u => {
      if (!teamLeadSearch.trim()) return true;
      const search = teamLeadSearch.toLowerCase();
      const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
      const email = u.email?.toLowerCase() || '';
      return fullName.includes(search) || email.includes(search);
    })
    .sort((a, b) => {
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

  // Filter team members (all users except selected teamleads)
  const availableMembers = users
    .filter(u => !selectedTeamLeads.includes(u.id))
    .filter(u => {
      if (!teamMemberSearch.trim()) return true;
      const search = teamMemberSearch.toLowerCase();
      const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
      const email = u.email?.toLowerCase() || '';
      return fullName.includes(search) || email.includes(search);
    })
    .sort((a, b) => {
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTeam ? 'Team bearbeiten' : 'Neues Team erstellen'}
          </DialogTitle>
          <DialogDescription>
            {editingTeam 
              ? 'Ändere die Team-Informationen und Mitglieder'
              : 'Erstelle ein neues Team und weise Teamleads und Mitglieder zu'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Team Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Team-Informationen</h3>
            
            <div className="space-y-2">
              <Label htmlFor="team-name">Team-Name *</Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="z.B. Büro Berlin, Entwicklung, Marketing"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="team-description">Beschreibung (optional)</Label>
              <Textarea
                id="team-description"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                placeholder="Beschreibe die Aufgaben und Verantwortlichkeiten dieses Teams"
                rows={3}
              />
            </div>
          </div>

          {/* Team Leads */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Teamleads</h3>
              <p className="text-xs text-gray-500 mt-1">
                Teamleads können Urlaubsanträge ihres Teams genehmigen. HR und SUPERADMIN werden automatisch vorausgewählt, können aber manuell abgewählt werden.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="flex-shrink-0">Teamleads auswählen</Label>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Suchen..."
                    value={teamLeadSearch}
                    onChange={(e) => setTeamLeadSearch(e.target.value)}
                    className="pl-9 h-8 text-sm"
                  />
                </div>
              </div>
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {availableTeamLeads.map(user => {
                  const isSelected = selectedTeamLeads.includes(user.id);
                  const currentTag = teamLeadTags[user.id];
                  
                  return (
                    <div
                      key={user.id}
                      className="p-3 border-b last:border-b-0 space-y-2"
                    >
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTeamLeads([...selectedTeamLeads, user.id]);
                              // Auto-assign default priority tag based on role
                              if (!teamLeadTags[user.id]) {
                                const newTags = { ...teamLeadTags };
                                if (user.role === 'ADMIN') {
                                  newTags[user.id] = 'PRIMARY';
                                } else if (user.role === 'HR') {
                                  newTags[user.id] = 'BACKUP';
                                } else if (user.role === 'SUPERADMIN') {
                                  newTags[user.id] = 'BACKUP_BACKUP';
                                }
                                setTeamLeadTags(newTags);
                              }
                            } else {
                              setSelectedTeamLeads(selectedTeamLeads.filter(id => id !== user.id));
                              // Remove tag when deselected
                              const newTags = { ...teamLeadTags };
                              delete newTags[user.id];
                              setTeamLeadTags(newTags);
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {user.first_name} {user.last_name}
                            </span>
                            {isSelected && currentTag && (
                              <Badge 
                                variant={
                                  currentTag === 'PRIMARY' ? 'default' :
                                  currentTag === 'BACKUP' ? 'secondary' :
                                  'outline'
                                }
                                className="text-xs"
                              >
                                {currentTag === 'PRIMARY' ? 'Primary' :
                                 currentTag === 'BACKUP' ? 'Backup' :
                                 'Backup Backup'}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.email} · {user.role}
                          </div>
                        </div>
                      </label>
                      
                      {/* Priority Tag Buttons - Only show if selected */}
                      {isSelected && (
                        <div className="ml-7 flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant={currentTag === 'PRIMARY' ? 'default' : 'outline'}
                            onClick={() => {
                              setTeamLeadTags({ ...teamLeadTags, [user.id]: 'PRIMARY' });
                            }}
                            className="text-xs h-7"
                          >
                            Primary
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={currentTag === 'BACKUP' ? 'default' : 'outline'}
                            onClick={() => {
                              setTeamLeadTags({ ...teamLeadTags, [user.id]: 'BACKUP' });
                            }}
                            className="text-xs h-7"
                          >
                            Backup
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={currentTag === 'BACKUP_BACKUP' ? 'default' : 'outline'}
                            onClick={() => {
                              setTeamLeadTags({ ...teamLeadTags, [user.id]: 'BACKUP_BACKUP' });
                            }}
                            className="text-xs h-7"
                          >
                            Backup Backup
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {availableTeamLeads.length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-500">
                    {teamLeadSearch.trim() 
                      ? 'Keine Teamleads gefunden' 
                      : 'Keine verfügbaren Admins. Nur Benutzer mit Rolle ADMIN, HR oder SUPERADMIN können Teamleads sein.'}
                  </div>
                )}
              </div>
              {selectedTeamLeads.length > 0 && (
                <p className="text-xs text-gray-500">
                  {selectedTeamLeads.length} Teamlead{selectedTeamLeads.length !== 1 ? 's' : ''} ausgewählt
                </p>
              )}
            </div>
          </div>

          {/* Team Members */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Team-Mitglieder</h3>
              <p className="text-xs text-gray-500 mt-1">
                Normale Mitglieder des Teams
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="flex-shrink-0">Mitglieder auswählen</Label>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Suchen..."
                    value={teamMemberSearch}
                    onChange={(e) => setTeamMemberSearch(e.target.value)}
                    className="pl-9 h-8 text-sm"
                  />
                </div>
              </div>
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {availableMembers.map(user => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTeamMembers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTeamMembers([...selectedTeamMembers, user.id]);
                        } else {
                          setSelectedTeamMembers(selectedTeamMembers.filter(id => id !== user.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.email} · {user.role}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {selectedTeamMembers.length > 0 && (
                <p className="text-xs text-gray-500">
                  {selectedTeamMembers.length} Mitglied{selectedTeamMembers.length !== 1 ? 'er' : ''} ausgewählt
                </p>
              )}
            </div>
          </div>

          {/* Info Box */}
          <Alert>
            <AlertDescription className="text-sm">
              ℹ️ Hinweis: HR und SUPERADMIN werden automatisch als Teamlead zu allen Teams hinzugefügt und sind immer für alle Urlaubsanträge zuständig.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving || !teamName.trim()}>
            {saving ? 'Speichert...' : editingTeam ? 'Aktualisieren' : 'Erstellen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Export helper to initialize dialog state from parent
export function useTeamDialogState() {
  return {
    initializeForCreate: (users: User[]) => {
      const autoTeamleads = users.filter(u => u.role === 'HR' || u.role === 'SUPERADMIN');
      const leads = autoTeamleads.map(u => u.id);
      const tags: Record<string, 'PRIMARY' | 'BACKUP' | 'BACKUP_BACKUP'> = {};
      autoTeamleads.forEach(u => {
        if (u.role === 'HR') {
          tags[u.id] = 'BACKUP';
        } else if (u.role === 'SUPERADMIN') {
          tags[u.id] = 'BACKUP_BACKUP';
        }
      });
      return { name: '', description: '', leads, members: [], tags };
    },
  };
}
