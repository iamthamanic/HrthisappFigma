import { useState, useEffect } from 'react';
import { Check, X, ChevronRight, RotateCcw, Award, Trophy } from './icons/BrowoKoIcons';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number; // index of correct option
  explanation?: string;
}

interface QuizPlayerProps {
  questions: QuizQuestion[];
  title: string;
  passingScore?: number; // percentage (e.g., 80 = 80%)
  onComplete?: (score: number, passed: boolean) => void;
}

export default function QuizPlayer({
  questions,
  title,
  passingScore = 80,
  onComplete
}: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const scorePercentage = questions.length > 0 ? (score / questions.length) * 100 : 0;
  const hasPassed = scorePercentage >= passingScore;

  // Handle answer selection
  const handleAnswerSelect = (optionIndex: number) => {
    if (isAnswerRevealed) return;
    setSelectedAnswer(optionIndex);
  };

  // Submit answer
  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    setIsAnswerRevealed(true);

    // Check if correct
    if (selectedAnswer === currentQuestion.correct_answer) {
      setScore(score + 1);
    }

    setAnsweredQuestions([...answeredQuestions, selectedAnswer]);
  };

  // Next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
    } else {
      // Quiz completed
      setIsCompleted(true);
      const finalScore = selectedAnswer === currentQuestion.correct_answer ? score + 1 : score;
      const finalScorePercentage = (finalScore / questions.length) * 100;
      const passed = finalScorePercentage >= passingScore;
      onComplete?.(finalScorePercentage, passed);
    }
  };

  // Restart quiz
  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnsweredQuestions([]);
    setIsAnswerRevealed(false);
    setScore(0);
    setIsCompleted(false);
  };

  // Get option style
  const getOptionStyle = (index: number) => {
    if (!isAnswerRevealed) {
      return selectedAnswer === index
        ? 'border-blue-600 bg-blue-50'
        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50';
    }

    // Answer revealed
    if (index === currentQuestion.correct_answer) {
      return 'border-green-600 bg-green-50';
    }

    if (index === selectedAnswer && selectedAnswer !== currentQuestion.correct_answer) {
      return 'border-red-600 bg-red-50';
    }

    return 'border-gray-200 opacity-50';
  };

  // Get option icon
  const getOptionIcon = (index: number) => {
    if (!isAnswerRevealed) return null;

    if (index === currentQuestion.correct_answer) {
      return <Check className="w-5 h-5 text-green-600" />;
    }

    if (index === selectedAnswer && selectedAnswer !== currentQuestion.correct_answer) {
      return <X className="w-5 h-5 text-red-600" />;
    }

    return null;
  };

  if (isCompleted) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            {/* Trophy/Icon */}
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
              hasPassed ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              {hasPassed ? (
                <Trophy className="w-12 h-12 text-green-600" />
              ) : (
                <RotateCcw className="w-12 h-12 text-orange-600" />
              )}
            </div>

            {/* Result */}
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {hasPassed ? 'Glückwunsch! 🎉' : 'Nicht bestanden'}
            </h2>
            <p className="text-gray-600 mb-6">
              {hasPassed 
                ? 'Du hast das Quiz erfolgreich abgeschlossen!'
                : 'Versuche es noch einmal, um zu bestehen.'}
            </p>

            {/* Score */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-semibold text-gray-900 mb-1">
                    {score}/{questions.length}
                  </p>
                  <p className="text-sm text-gray-500">Richtig</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-gray-900 mb-1">
                    {Math.round(scorePercentage)}%
                  </p>
                  <p className="text-sm text-gray-500">Punktzahl</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-gray-900 mb-1">
                    {passingScore}%
                  </p>
                  <p className="text-sm text-gray-500">Erforderlich</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleRestart}
                variant="outline"
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Nochmal versuchen
              </Button>
              {hasPassed && (
                <Button className="gap-2 bg-green-600 hover:bg-green-700">
                  <Award className="w-4 h-4" />
                  Belohnungen abholen
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Frage {currentQuestionIndex + 1} von {questions.length}
            </p>
          </div>
          <Badge variant="outline">
            {score} / {answeredQuestions.length} richtig
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">
            {currentQuestion.question}
          </h3>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={isAnswerRevealed}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center justify-between ${getOptionStyle(index)} ${
                isAnswerRevealed ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedAnswer === index && !isAnswerRevealed
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white'
                }`}>
                  <span className="text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                </div>
                <span className="text-gray-900">{option}</span>
              </div>
              {getOptionIcon(index)}
            </button>
          ))}
        </div>

        {/* Explanation */}
        {isAnswerRevealed && currentQuestion.explanation && (
          <div className={`p-4 rounded-lg border-2 ${
            selectedAnswer === currentQuestion.correct_answer
              ? 'bg-green-50 border-green-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <p className="text-sm font-medium text-gray-900 mb-1">Erklärung:</p>
            <p className="text-sm text-gray-700">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!isAnswerRevealed ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              className="w-full"
            >
              Antwort prüfen
            </Button>
          ) : (
            <Button
              onClick={handleNextQuestion}
              className="w-full gap-2"
            >
              {currentQuestionIndex < questions.length - 1 ? (
                <>
                  Nächste Frage
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Quiz abschließen
                  <Award className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>

        {/* Progress Info */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 text-center">
            💡 Du brauchst mindestens {passingScore}% richtige Antworten, um zu bestehen
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
