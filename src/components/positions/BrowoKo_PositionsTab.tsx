/**
 * @file components/positions/BrowoKo_PositionsTab.tsx
 * @description Positions tab for Team & Mitarbeiterverwaltung
 * Displays table of all positions with CRUD operations
 */

import { useEffect, useState } from 'react';
import { usePositionsStore } from '../../stores/BrowoKo_positionsStore';
import { useAdminStore } from '../../stores/BrowoKo_adminStore';
import { Button } from '../ui/button';
import { Plus, Pencil, Trash2, Users, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { CreateEditPositionDialog } from './BrowoKo_CreateEditPositionDialog';
import { PositionEmployeesDialog } from './BrowoKo_PositionEmployeesDialog';
import { PositionWithRelations } from '../../types/positions';
import { POSITION_LEVEL_LABELS, POSITION_STATUS_LABELS } from '../../types/positions';

export function PositionsTab() {
  const { positions, loading, hasLoaded, loadPositions, deletePosition } = usePositionsStore();
  const { loadDepartments, loadLocations } = useAdminStore();
  
  const [showCreateEditDialog, setShowCreateEditDialog] = useState(false);
  const [showEmployeesDialog, setShowEmployeesDialog] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<PositionWithRelations | null>(null);
  const [employeesDialogPosition, setEmployeesDialogPosition] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    console.log('[PositionsTab] 🎬 COMPONENT MOUNTED - hasLoaded:', hasLoaded);
    
    // Only load if not already loaded
    if (!hasLoaded) {
      loadPositions();
      loadDepartments();
      loadLocations();
    }
    
    return () => {
      console.log('[PositionsTab] 💀 COMPONENT UNMOUNTED');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoaded]);

  const handleCreate = () => {
    setSelectedPosition(null);
    setShowCreateEditDialog(true);
  };

  const handleEdit = (position: PositionWithRelations) => {
    setSelectedPosition(position);
    setShowCreateEditDialog(true);
  };

  const handleDelete = async (position: PositionWithRelations) => {
    const confirmed = window.confirm(
      `Position "${position.name}" wirklich löschen?` +
      (position.employee_count && position.employee_count > 0
        ? `\n\nWarnung: ${position.employee_count} Mitarbeiter haben diese Position!`
        : '')
    );

    if (confirmed) {
      await deletePosition(position.id);
    }
  };

  const handleShowEmployees = (position: PositionWithRelations) => {
    setEmployeesDialogPosition({
      id: position.id,
      name: position.name,
    });
    setShowEmployeesDialog(true);
  };

  const formatSalary = (position: PositionWithRelations) => {
    if (!position.salary_min || !position.salary_max) return '-';
    
    const currency = position.salary_currency === 'EUR' ? '€' : 
                    position.salary_currency === 'USD' ? '$' : 
                    position.salary_currency === 'GBP' ? '£' : 
                    position.salary_currency === 'CHF' ? 'Fr' : '';
    
    const formatNumber = (num: number) => {
      return num >= 1000 ? `${(num / 1000).toFixed(0)}k` : num.toString();
    };

    return `${formatNumber(position.salary_min)}-${formatNumber(position.salary_max)} ${currency}`;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'RECRUITING': return 'secondary';
      case 'INACTIVE': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Positionen</h2>
          <p className="text-gray-600 mt-1">
            Verwalten Sie Stellenpositionen, Anforderungen und Gehaltsbänder
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Position
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty State */}
      {!loading && positions.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-600 mb-4">Noch keine Positionen angelegt</p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Erste Position anlegen
          </Button>
        </div>
      )}

      {/* Table */}
      {!loading && positions.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Position</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Level</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Abteilung(en)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Mitarbeiter</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Gehalt</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {positions.map((position) => (
                <tr key={position.id} className="hover:bg-gray-50 transition-colors">
                  {/* Position Name */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{position.name}</p>
                      {position.reports_to_position_name && (
                        <p className="text-xs text-gray-500">
                          Berichtet an: {position.reports_to_position_name}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Level */}
                  <td className="px-4 py-3">
                    {position.level ? (
                      <Badge variant="outline">
                        {POSITION_LEVEL_LABELS[position.level]}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  {/* Departments */}
                  <td className="px-4 py-3">
                    {position.departments && position.departments.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {position.departments.slice(0, 2).map((dept) => (
                          <Badge key={dept.id} variant="secondary" className="text-xs">
                            {dept.name}
                          </Badge>
                        ))}
                        {position.departments.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{position.departments.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">Keine Abteilung</span>
                    )}
                  </td>

                  {/* Employees */}
                  <td className="px-4 py-3">
                    {position.employee_count && position.employee_count > 0 ? (
                      <button
                        onClick={() => handleShowEmployees(position)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        <Users className="h-4 w-4" />
                        {position.employee_count} {position.employee_count === 1 ? 'Person' : 'Personen'}
                      </button>
                    ) : (
                      <span className="text-gray-400">0 Personen</span>
                    )}
                  </td>

                  {/* Salary */}
                  <td className="px-4 py-3 text-sm">
                    {formatSalary(position)}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <Badge variant={getStatusBadgeVariant(position.status)}>
                      {POSITION_STATUS_LABELS[position.status]}
                    </Badge>
                    {position.status === 'RECRUITING' && position.open_positions > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {position.open_positions} offen
                      </p>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(position)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(position)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats */}
      {!loading && positions.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Gesamt Positionen</p>
            <p className="text-2xl font-semibold mt-1">{positions.length}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Aktiv</p>
            <p className="text-2xl font-semibold mt-1 text-green-600">
              {positions.filter(p => p.status === 'ACTIVE').length}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Recruiting</p>
            <p className="text-2xl font-semibold mt-1 text-blue-600">
              {positions.filter(p => p.status === 'RECRUITING').length}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Offene Stellen</p>
            <p className="text-2xl font-semibold mt-1 text-orange-600">
              {positions.reduce((sum, p) => sum + (p.open_positions || 0), 0)}
            </p>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CreateEditPositionDialog
        open={showCreateEditDialog}
        onClose={() => {
          setShowCreateEditDialog(false);
          setSelectedPosition(null);
        }}
        position={selectedPosition}
      />

      {employeesDialogPosition && (
        <PositionEmployeesDialog
          open={showEmployeesDialog}
          onClose={() => {
            setShowEmployeesDialog(false);
            setEmployeesDialogPosition(null);
          }}
          positionId={employeesDialogPosition.id}
          positionName={employeesDialogPosition.name}
        />
      )}
    </div>
  );
}