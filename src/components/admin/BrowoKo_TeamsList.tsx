import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Users, Plus, Edit, Trash2 } from '../icons/BrowoKoIcons';
import LoadingState from '../LoadingState';
import type { Team } from '../../types/database';

/**
 * HR TEAMS LIST COMPONENT
 * ========================
 * Domain: BrowoKo
 * 
 * Displays all teams in a grid layout with member counts
 */

interface TeamsListProps {
  teams: Team[];
  teamMemberCounts: Record<string, number>;
  loading: boolean;
  onCreateTeam: () => void;
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
}

export default function TeamsList({
  teams,
  teamMemberCounts,
  loading,
  onCreateTeam,
  onEditTeam,
  onDeleteTeam,
}: TeamsListProps) {
  if (loading) {
    return <LoadingState loading={true} type="spinner" />;
  }

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Noch keine Teams
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Erstelle dein erstes Team, um Mitarbeiter zu organisieren
          </p>
          <Button onClick={onCreateTeam}>
            <Plus className="w-4 h-4 mr-2" />
            Team erstellen
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {teams.map((team) => (
        <Card key={team.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{team.name}</CardTitle>
                {team.description && (
                  <p className="text-sm text-gray-500 mt-1">{team.description}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditTeam(team)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteTeam(team.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {teamMemberCounts[team.id] || 0}{' '}
                {teamMemberCounts[team.id] === 1 ? 'Mitglied' : 'Mitglieder'}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
