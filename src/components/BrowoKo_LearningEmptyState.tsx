import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { BookOpen, PlayCircle, TrendingUp } from './icons/BrowoKoIcons';
import { useNavigate } from 'react-router-dom';

type EmptyStateType = 'all' | 'videos' | 'mandatory' | 'skills';

interface LearningEmptyStateProps {
  type: EmptyStateType;
  isAdmin: boolean;
}

export function LearningEmptyState({ type, isAdmin }: LearningEmptyStateProps) {
  const navigate = useNavigate();

  const getConfig = () => {
    switch (type) {
      case 'all':
        return {
          icon: BookOpen,
          title: 'Noch keine Lerninhalte verfügbar',
          description: isAdmin 
            ? 'Erstelle deine ersten Videos und Quizzes im Lernverwaltungs-Bereich.'
            : 'Dein Administrator arbeitet gerade an den ersten Lerninhalten.',
          buttonText: 'Inhalte erstellen'
        };
      case 'videos':
        return {
          icon: PlayCircle,
          title: 'Noch keine Videos verfügbar',
          description: isAdmin 
            ? 'Erstelle dein erstes Schulungsvideo im Lernverwaltungs-Bereich.'
            : 'Es wurden noch keine Schulungsvideos erstellt.',
          buttonText: 'Video erstellen'
        };
      case 'mandatory':
        return {
          icon: BookOpen,
          title: 'Keine Pflicht-Schulungen verfügbar',
          description: isAdmin 
            ? 'Erstelle Pflicht-Schulungen im Lernverwaltungs-Bereich.'
            : 'Es wurden noch keine Pflicht-Schulungen erstellt.',
          buttonText: 'Quiz erstellen'
        };
      case 'skills':
        return {
          icon: TrendingUp,
          title: 'Keine Skills-Schulungen verfügbar',
          description: isAdmin 
            ? 'Erstelle Skills-Schulungen im Lernverwaltungs-Bereich.'
            : 'Es wurden noch keine Skills-Schulungen erstellt.',
          buttonText: 'Quiz erstellen'
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {config.title}
        </h3>
        <p className="text-gray-500 mb-6">
          {config.description}
        </p>
        {isAdmin && (
          <Button onClick={() => navigate('/learning/admin')}>
            {config.buttonText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
