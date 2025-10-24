import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Coins, Clock, CheckCircle, HelpCircle, Play } from '../components/icons/HRTHISIcons';
import { useAuthStore } from '../stores/HRTHIS_authStore';
import { useLearningStore } from '../stores/HRTHIS_learningStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import QuizPlayer, { QuizQuestion } from '../components/QuizPlayer';

export default function QuizDetailScreen() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { quizzes, quizProgress, completeQuiz } = useLearningStore();
  const { addCoins } = useGamificationStore();

  const [hasStarted, setHasStarted] = useState(false);
  const [hasRewarded, setHasRewarded] = useState(false);

  // Find quiz
  const quiz = quizzes.find(q => q.id === quizId);
  const progress = quizProgress[quizId || ''];
  const isCompleted = progress?.completed;
  const bestScore = progress?.best_score || 0;

  useEffect(() => {
    if (!quiz) {
      navigate('/learning');
    }
  }, [quiz, navigate]);

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Quiz nicht gefunden</p>
      </div>
    );
  }

  // Handle quiz completion
  const handleComplete = async (score: number, passed: boolean) => {
    if (!user?.id || !quizId || hasRewarded) return;

    try {
      // Save quiz result
      await completeQuiz(user.id, quizId, score, passed);

      // Award XP and Coins if passed and first time
      if (passed && !isCompleted) {
        if (quiz.coin_reward && quiz.coin_reward > 0) {
          await addCoins(user.id, quiz.coin_reward, `Quiz bestanden: ${quiz.title}`);
        }

        // Check for achievements
        const { checkAndUnlockAchievements } = useGamificationStore.getState();
        await checkAndUnlockAchievements(user.id);

        setHasRewarded(true);

        // Show success message
        setTimeout(() => {
          alert(`🎉 Glückwunsch! Du hast ${quiz.coin_reward} Coins verdient!`);
        }, 500);
      }
    } catch (error) {
      console.error('Error completing quiz:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'MANDATORY': return 'bg-red-100 text-red-700';
      case 'COMPLIANCE': return 'bg-yellow-100 text-yellow-700';
      case 'SKILLS': return 'bg-blue-100 text-blue-700';
      case 'ONBOARDING': return 'bg-green-100 text-green-700';
      case 'BONUS': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Parse questions from JSON
  const questions: QuizQuestion[] = quiz.questions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/learning')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zur Übersicht
        </Button>
        {isCompleted && (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="w-4 h-4 mr-1" />
            Abgeschlossen - {bestScore}%
          </Badge>
        )}
      </div>

      {!hasStarted ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quiz Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="mb-2">{quiz.title}</CardTitle>
                  <Badge className={getCategoryColor(quiz.category)}>
                    {quiz.category}
                  </Badge>
                </div>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">{quiz.description}</p>

              {/* Stats */}
              <div className="flex items-center gap-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{questions.length} Fragen</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{quiz.duration} Minuten</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-600">{quiz.xp_reward} XP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-600">{quiz.coin_reward} Coins</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-3">Anweisungen</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    Beantworte alle {questions.length} Fragen
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    Du brauchst mindestens {quiz.passing_score}% richtige Antworten
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    Du kannst das Quiz beliebig oft wiederholen
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    Sofortiges Feedback nach jeder Antwort
                  </li>
                </ul>
              </div>

              {/* Best Score */}
              {isCompleted && (
                <div className="pt-4 border-t">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-900">Deine beste Punktzahl</p>
                        <p className="text-xs text-green-700 mt-1">Versuche dein Ergebnis zu verbessern!</p>
                      </div>
                      <div className="text-2xl font-semibold text-green-600">
                        {bestScore}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Start Button */}
              <Button
                onClick={() => setHasStarted(true)}
                className="w-full gap-2 mt-4"
                size="lg"
              >
                <Play className="w-5 h-5" />
                {isCompleted ? 'Quiz erneut starten' : 'Quiz starten'}
              </Button>
            </CardContent>
          </Card>

          {/* Rewards Card */}
          <Card>
            <CardHeader>
              <CardTitle>Belohnungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isCompleted ? (
                <>
                  <p className="text-sm text-gray-600">
                    Bestehe dieses Quiz, um Belohnungen zu erhalten:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">XP</span>
                      </div>
                      <span className="text-lg font-semibold text-purple-600">
                        +{quiz.xp_reward}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-gray-900">Coins</span>
                      </div>
                      <span className="text-lg font-semibold text-yellow-600">
                        +{quiz.coin_reward}
                      </span>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      💡 Erreiche {quiz.passing_score}% um die Belohnungen zu erhalten
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="font-medium text-gray-900 mb-1">Quiz abgeschlossen!</p>
                  <p className="text-sm text-gray-600">Du hast alle Belohnungen erhalten</p>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500">
                      Du kannst das Quiz erneut spielen, um deine Punktzahl zu verbessern
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <QuizPlayer
          questions={questions}
          title={quiz.title}
          passingScore={quiz.passing_score || 80}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
