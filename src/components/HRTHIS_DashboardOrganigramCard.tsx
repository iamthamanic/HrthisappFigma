/**
 * @file HRTHIS_DashboardOrganigramCard.tsx
 * @domain HR - Dashboard
 * @description Collapsible organigram card for dashboard
 * @created Phase 2.2 - Priority 4 Refactoring
 */

import { Network, ChevronDown, ChevronUp } from './icons/HRTHISIcons';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import CanvasOrgChart, { type Connection } from './canvas/HRTHIS_CanvasOrgChart';
import type { OrgNodeData } from './OrgNode';

interface DashboardOrganigramCardProps {
  orgNodes: OrgNodeData[];
  orgConnections: Connection[];
  orgLoading: boolean;
  isOrgExpanded: boolean;
  hasOrgData: boolean;
  userRole?: string;
  onToggleExpand: () => void;
}

export function DashboardOrganigramCard({
  orgNodes,
  orgConnections,
  orgLoading,
  isOrgExpanded,
  hasOrgData,
  userRole,
  onToggleExpand,
}: DashboardOrganigramCardProps) {
  const isAdmin = userRole === 'HR' || userRole === 'ADMIN' || userRole === 'SUPERADMIN';

  // Show collapsed card with data
  if (!orgLoading && hasOrgData) {
    return (
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={onToggleExpand}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              Organigram
            </CardTitle>
            <Button variant="ghost" size="sm">
              {isOrgExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Einklappen
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Anzeigen
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {isOrgExpanded && (
          <CardContent className="p-0">
            {/* Read-only Canvas - No editing allowed */}
            <div className="relative h-[600px] border-t">
              <CanvasOrgChart
                nodes={orgNodes}
                connections={orgConnections}
                onNodesChange={() => {}} // Read-only - no changes allowed
                onConnectionsChange={() => {}} // Read-only - no changes allowed
                readOnly={true}
              />
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  // Show empty state if no data
  if (!hasOrgData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            Organigram
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p>Noch kein Organigram veröffentlicht.</p>
                {isAdmin ? (
                  <p className="text-sm text-blue-600">
                    💡 <strong>Admin-Hinweis:</strong> Gehe zu "Admin → Organigram Canvas", klicke auf "Edit Organigram", erstelle Abteilungen und klicke auf "Push Live" um sie zu veröffentlichen.
                  </p>
                ) : (
                  <p className="text-sm">Dein Admin wird bald eines erstellen.</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return null;
}
