/**
 * @file components/positions/BrowoKo_PositionEmployeesDialog.tsx
 * @description Dialog showing all employees assigned to a position
 */

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { usePositionsStore } from '../../stores/BrowoKo_positionsStore';
import { User } from '../../types/user';
import { Loader2 } from 'lucide-react';

interface PositionEmployeesDialogProps {
  open: boolean;
  onClose: () => void;
  positionId: string | null;
  positionName: string;
}

export function PositionEmployeesDialog({ 
  open, 
  onClose, 
  positionId, 
  positionName 
}: PositionEmployeesDialogProps) {
  const { getPositionEmployees } = usePositionsStore();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && positionId) {
      loadEmployees();
    }
  }, [open, positionId]);

  const loadEmployees = async () => {
    if (!positionId) return;
    
    setLoading(true);
    try {
      const emps = await getPositionEmployees(positionId);
      setEmployees(emps);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Mitarbeiter: {positionName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Keine Mitarbeiter mit dieser Position
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={employee.profile_picture} alt={employee.first_name} />
                  <AvatarFallback>
                    {employee.first_name?.[0]}{employee.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <p className="font-medium">
                    {employee.first_name} {employee.last_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {employee.department || 'Keine Abteilung'}
                  </p>
                </div>
                
                <div className="text-sm text-gray-600">
                  {employee.email}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
