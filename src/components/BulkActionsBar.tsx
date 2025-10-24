import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  X, 
  Trash2, 
  Mail, 
  Upload, 
  Edit, 
  MapPin,
  Building2,
  Briefcase,
  UserCheck,
  UserX
} from './icons/HRTHISIcons';
import { User } from '../types/database';

export type BulkActionType = 
  | 'deactivate'
  | 'activate'
  | 'delete'
  | 'send-email'
  | 'upload-document'
  | 'change-location'
  | 'change-department'
  | 'change-position';

interface BulkActionsBarProps {
  selectedUsers: User[];
  onClearSelection: () => void;
  onBulkAction: (action: BulkActionType) => void;
}

export default function BulkActionsBar({
  selectedUsers,
  onClearSelection,
  onBulkAction,
}: BulkActionsBarProps) {
  if (selectedUsers.length === 0) return null;

  const activeCount = selectedUsers.filter(u => u.is_active).length;
  const inactiveCount = selectedUsers.filter(u => !u.is_active).length;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl p-4 min-w-[600px]">
        <div className="flex items-center justify-between gap-4">
          {/* Selection Info */}
          <div className="flex items-center gap-3">
            <Badge variant="default" className="px-3 py-1.5">
              {selectedUsers.length} ausgewählt
            </Badge>
            {activeCount > 0 && (
              <span className="text-sm text-gray-600">
                {activeCount} aktiv
              </span>
            )}
            {inactiveCount > 0 && (
              <span className="text-sm text-gray-600">
                {inactiveCount} inaktiv
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Activation/Deactivation */}
            {inactiveCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkAction('activate')}
                className="gap-2"
              >
                <UserCheck className="w-4 h-4" />
                Aktivieren
              </Button>
            )}
            {activeCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkAction('deactivate')}
                className="gap-2"
              >
                <UserX className="w-4 h-4" />
                Deaktivieren
              </Button>
            )}

            {/* Email */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction('send-email')}
              className="gap-2"
            >
              <Mail className="w-4 h-4" />
              E-Mail
            </Button>

            {/* Batch Edit */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction('change-location')}
              className="gap-2"
            >
              <MapPin className="w-4 h-4" />
              Standort ändern
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction('change-department')}
              className="gap-2"
            >
              <Building2 className="w-4 h-4" />
              Abteilung ändern
            </Button>

            {/* Upload Document */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction('upload-document')}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Dokument
            </Button>

            {/* Delete */}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onBulkAction('delete')}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Löschen
            </Button>

            {/* Clear Selection */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearSelection}
              className="ml-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
