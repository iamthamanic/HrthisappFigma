import { useState, useEffect } from 'react';
import { X, UserPlus, User, Users } from './icons/BrowoKoIcons';
import { Dialog } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

/**
 * ASSIGN EMPLOYEES DIALOG
 * =========================
 * Dialog zum Zuweisen von Mitarbeitern zu einem Organigram-Node
 * 
 * Features:
 * - Primary User (Hauptverantwortlicher)
 * - Backup User (Standard-Vertretung)
 * - Backup Backup User (Vertretung der Vertretung)
 * - Multi-Select für zusätzliche Mitarbeiter
 */

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture?: string;
  role?: string;
}

interface AssignEmployeesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
  nodeTitle: string;
  nodeType?: string; // 'department', 'specialization', etc.
  currentEmployeeIds?: string[];
  currentPrimaryUserId?: string;
  currentBackupUserId?: string;
  currentBackupBackupUserId?: string;
  currentTeamLeadId?: string;
  readOnly?: boolean; // 🆕 Read-only mode (User View)
  onSave: (data: {
    employeeIds: string[];
    primaryUserId?: string;
    backupUserId?: string;
    backupBackupUserId?: string;
    teamLeadId?: string;
  }) => void;
}

export default function AssignEmployeesDialog({
  isOpen,
  onClose,
  nodeId,
  nodeTitle,
  nodeType,
  currentEmployeeIds = [],
  currentPrimaryUserId,
  currentBackupUserId,
  currentBackupBackupUserId,
  currentTeamLeadId,
  readOnly = false,
  onSave,
}: AssignEmployeesDialogProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teamLeads, setTeamLeads] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected values
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(currentEmployeeIds);
  const [primaryUserId, setPrimaryUserId] = useState<string | undefined>(currentPrimaryUserId);
  const [backupUserId, setBackupUserId] = useState<string | undefined>(currentBackupUserId);
  const [backupBackupUserId, setBackupBackupUserId] = useState<string | undefined>(currentBackupBackupUserId);
  const [teamLeadId, setTeamLeadId] = useState<string | undefined>(currentTeamLeadId);
  
  // Check if this node type supports team lead assignment
  const supportsTeamLead = nodeType === 'department' || nodeType === 'specialization';

  // ✅ FIX: Reset state when dialog opens with new node
  useEffect(() => {
    if (isOpen) {
      setSelectedEmployeeIds(currentEmployeeIds);
      setPrimaryUserId(currentPrimaryUserId);
      setBackupUserId(currentBackupUserId);
      setBackupBackupUserId(currentBackupBackupUserId);
      setTeamLeadId(currentTeamLeadId);
    }
  }, [isOpen, nodeId]); // Only when dialog opens or nodeId changes

  // Load employees and team leads from database
  useEffect(() => {
    if (!isOpen) return;
    
    async function loadEmployees() {
      try {
        setLoading(true);
        
        // Load all employees
        const { data: allEmployees, error: employeesError } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, profile_picture, role')
          .order('last_name', { ascending: true });

        if (employeesError) throw employeesError;
        
        setEmployees(allEmployees || []);
        
        // Load team leads (only users with TEAMLEAD role)
        if (supportsTeamLead) {
          const { data: teamLeadData, error: teamLeadError } = await supabase
            .from('users')
            .select('id, first_name, last_name, email, profile_picture, role')
            .eq('role', 'TEAMLEAD')
            .order('last_name', { ascending: true });

          if (teamLeadError) throw teamLeadError;
          
          setTeamLeads(teamLeadData || []);
          console.log('📋 Loaded team leads:', teamLeadData?.length);
        }
      } catch (error) {
        console.error('Error loading employees:', error);
        toast.error('Fehler beim Laden der Mitarbeiter');
      } finally {
        setLoading(false);
      }
    }

    loadEmployees();
  }, [isOpen, supportsTeamLead]);

  const handleSave = () => {
    onSave({
      employeeIds: selectedEmployeeIds,
      primaryUserId,
      backupUserId,
      backupBackupUserId,
      teamLeadId: supportsTeamLead ? teamLeadId : undefined,
    });
    onClose();
  };

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const getEmployeeName = (id?: string) => {
    if (!id) return 'Nicht zugewiesen';
    const employee = employees.find((e) => e.id === id);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unbekannt';
  };

  // Helper to get full name
  const getFullName = (employee: Employee) => {
    return `${employee.first_name} ${employee.last_name}`;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {readOnly ? 'Mitarbeiterzuweisung (View)' : 'Mitarbeiterzuweisung (Edit)'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{nodeTitle}</p>
              {readOnly && (
                <p className="text-xs text-blue-600 mt-1">
                  👁️ Nur-Lesemodus - Keine Bearbeitung möglich
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {/* Primary User */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <Label className="text-base font-semibold">
                      Hauptverantwortlicher (Primary)
                    </Label>
                  </div>
                  {readOnly ? (
                    <div className="field-readonly-v2">
                      {getEmployeeName(primaryUserId)}
                    </div>
                  ) : (
                    <select
                      value={primaryUserId || ''}
                      onChange={(e) => setPrimaryUserId(e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Nicht zugewiesen</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {getFullName(employee)} ({employee.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Backup User */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-orange-600" />
                    <Label className="text-base font-semibold">
                      Standard-Vertretung (Backup)
                    </Label>
                  </div>
                  {readOnly ? (
                    <div className="field-readonly-v2">
                      {getEmployeeName(backupUserId)}
                    </div>
                  ) : (
                    <select
                      value={backupUserId || ''}
                      onChange={(e) => setBackupUserId(e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Nicht zugewiesen</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {getFullName(employee)} ({employee.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Backup Backup User */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-600" />
                    <Label className="text-base font-semibold">
                      Vertretung der Vertretung (Backup Backup)
                    </Label>
                  </div>
                  {readOnly ? (
                    <div className="field-readonly-v2">
                      {getEmployeeName(backupBackupUserId)}
                    </div>
                  ) : (
                    <select
                      value={backupBackupUserId || ''}
                      onChange={(e) => setBackupBackupUserId(e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Nicht zugewiesen</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {getFullName(employee)} ({employee.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Team Lead (nur für Department & Specialization) */}
                {supportsTeamLead && (
                  <div className="space-y-3 border-t pt-6">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-green-600" />
                      <Label className="text-base font-semibold">
                        Team Lead (Abteilungsleiter)
                      </Label>
                      <span className="text-xs text-gray-500 ml-2">
                        Nur TEAMLEAD-Rolle
                      </span>
                    </div>
                    {readOnly ? (
                      <div className="field-readonly-v2">
                        {teamLeadId ? getEmployeeName(teamLeadId) : 'Kein Team Lead zugewiesen'}
                      </div>
                    ) : (
                      <>
                        <select
                          value={teamLeadId || ''}
                          onChange={(e) => setTeamLeadId(e.target.value || undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Kein Team Lead zugewiesen</option>
                          {teamLeads.length === 0 ? (
                            <option disabled>Keine Team Leads verfügbar</option>
                          ) : (
                            teamLeads.map((lead) => (
                              <option key={lead.id} value={lead.id}>
                                {getFullName(lead)} ({lead.email})
                              </option>
                            ))
                          )}
                        </select>
                        {teamLeads.length === 0 && (
                          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            ⚠️ Keine Benutzer mit TEAMLEAD-Rolle gefunden. Bitte weise einem Benutzer die TEAMLEAD-Rolle zu, um ihn hier auswählen zu können.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* All Employees (Multi-Select or View-Only List) */}
                <div className="space-y-3 border-t pt-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <Label className="text-base font-semibold">
                      Alle zugewiesenen Mitarbeiter
                    </Label>
                  </div>
                  {!readOnly && (
                    <p className="text-sm text-gray-600">
                      Wählen Sie alle Mitarbeiter aus, die diesem Node zugeordnet sind
                    </p>
                  )}
                  <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                    {employees.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Keine Mitarbeiter verfügbar
                      </div>
                    ) : readOnly ? (
                      /* 👁️ READ-ONLY: Show only assigned employees */
                      <div className="divide-y divide-gray-100">
                        {selectedEmployeeIds.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            Keine Mitarbeiter zugewiesen
                          </div>
                        ) : (
                          employees
                            .filter(employee => selectedEmployeeIds.includes(employee.id))
                            .map((employee) => (
                              <div
                                key={employee.id}
                                className="flex items-center gap-3 px-4 py-3"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {getFullName(employee)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {employee.email}
                                  </div>
                                </div>
                                {/* Badges for special assignments */}
                                <div className="flex gap-1">
                                  {employee.id === primaryUserId && (
                                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                      Primary
                                    </span>
                                  )}
                                  {employee.id === backupUserId && (
                                    <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
                                      Backup
                                    </span>
                                  )}
                                  {employee.id === backupBackupUserId && (
                                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                                      Backup²
                                    </span>
                                  )}
                                  {employee.id === teamLeadId && (
                                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                                      Team Lead
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    ) : (
                      /* ✏️ EDIT MODE: Checkboxes for selection */
                      <div className="divide-y divide-gray-100">
                        {employees.map((employee) => (
                          <label
                            key={employee.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedEmployeeIds.includes(employee.id)}
                              onChange={() => toggleEmployee(employee.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {getFullName(employee)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {employee.email}
                              </div>
                            </div>
                            {/* Badges for special assignments */}
                            <div className="flex gap-1">
                              {employee.id === primaryUserId && (
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                  Primary
                                </span>
                              )}
                              {employee.id === backupUserId && (
                                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
                                  Backup
                                </span>
                              )}
                              {employee.id === backupBackupUserId && (
                                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                                  Backup²
                                </span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedEmployeeIds.length} Mitarbeiter {readOnly ? 'zugewiesen' : 'ausgewählt'}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-600">
              {primaryUserId && (
                <div>
                  <strong>Primary:</strong> {getEmployeeName(primaryUserId)}
                </div>
              )}
              {backupUserId && (
                <div>
                  <strong>Backup:</strong> {getEmployeeName(backupUserId)}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              {readOnly ? (
                /* 👁️ READ-ONLY: Only show Close button */
                <Button onClick={onClose}>
                  Schließen
                </Button>
              ) : (
                /* ✏️ EDIT MODE: Show Cancel and Save buttons */
                <>
                  <Button onClick={onClose} variant="outline">
                    Abbrechen
                  </Button>
                  <Button onClick={handleSave} disabled={loading}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Speichern
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
