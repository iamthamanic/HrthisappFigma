/**
 * @file HRTHIS_QuizCard.tsx
 * @domain HR - Learning & Gamification
 * @description Quiz card component for learning screen
 * @namespace HRTHIS_
 * @performance Optimized with React.memo() and useMemo() hooks
 */

import { memo, useMemo, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { BookOpen, Clock, Award } from './icons/HRTHISIcons';
import { useNavigate } from 'react-router-dom';

interface Quiz {
  id: string;
  title: string;
  description: string;
  category: 'MANDATORY' | 'SKILLS' | 'COMPLIANCE';
  duration: number;
  xp_reward: number;
}

interface QuizCardProps {
  quiz: Quiz;
  variant?: 'mandatory' | 'skills' | 'default';
}

export const QuizCard = memo(function QuizCard({ quiz, variant = 'default' }: QuizCardProps) {
  const navigate = useNavigate();

  // Memoize badge props calculation
  const badgeProps = useMemo(() => {
    if (variant === 'mandatory' || quiz.category === 'MANDATORY') {
      return { variant: 'destructive' as const, label: 'Pflicht' };
    }
    if (variant === 'skills' || quiz.category === 'SKILLS') {
      return { variant: 'secondary' as const, label: 'Optional' };
    }
    return { variant: 'default' as const, label: quiz.category };
  }, [variant, quiz.category]);

  // Memoize icon color calculation
  const iconColor = useMemo(() => {
    if (variant === 'mandatory' || quiz.category === 'MANDATORY') {
      return 'text-gray-400';
    }
    if (variant === 'skills' || quiz.category === 'SKILLS') {
      return 'text-purple-500';
    }
    return 'text-gray-400';
  }, [variant, quiz.category]);

  // Memoize click handler
  const handleClick = useCallback(() => {
    navigate(`/learning/quiz/${quiz.id}`);
  }, [navigate, quiz.id]);

  return (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer"
      onClick={handleClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <Badge variant={badgeProps.variant}>{badgeProps.label}</Badge>
          <BookOpen className={`w-5 h-5 ${iconColor}`} />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">{quiz.title}</h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {quiz.description}
        </p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {quiz.duration} Min
          </div>
          <div className="flex items-center gap-1 text-amber-600">
            <Award className="w-4 h-4" />
            {quiz.xp_reward} XP
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
