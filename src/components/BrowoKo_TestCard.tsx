/**
 * TEST CARD COMPONENT (v4.13.1)
 * ==============================
 * Displays a test in a card format with actions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Edit2, Trash2, Copy, FileText, Clock, Award, Target } from './icons/BrowoKoIcons';
import type { Test } from '../types/schemas/BrowoKo_learningSchemas';

interface BrowoKo_TestCardProps {
  test: Test & { test_blocks?: { count: number }[] };
  onEdit?: (test: Test) => void;
  onDelete?: (test: Test) => void;
  onDuplicate?: (test: Test) => void;
}

export function BrowoKo_TestCard({ test, onEdit, onDelete, onDuplicate }: BrowoKo_TestCardProps) {
  // Get block count
  const blockCount = test.test_blocks?.[0]?.count || 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{test.title}</CardTitle>
            {test.description && (
              <CardDescription className="line-clamp-2 mt-1">
                {test.description}
              </CardDescription>
            )}
          </div>
          
          {test.is_template && (
            <Badge variant="outline" className="shrink-0">
              Template
            </Badge>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-gray-600">
            <FileText className="w-3.5 h-3.5" />
            <span>{blockCount} {blockCount === 1 ? 'Frage' : 'Fragen'}</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-gray-600">
            <Target className="w-3.5 h-3.5" />
            <span>{test.pass_percentage}% zum Bestehen</span>
          </div>
          
          {test.reward_coins > 0 && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <Award className="w-3.5 h-3.5" />
              <span>{test.reward_coins} Coins</span>
            </div>
          )}
          
          {test.time_limit_minutes && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <Clock className="w-3.5 h-3.5" />
              <span>{test.time_limit_minutes} Min.</span>
            </div>
          )}
        </div>

        {test.template_category && (
          <div className="text-xs text-gray-500">
            Kategorie: <span className="font-medium">{test.template_category}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex gap-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(test)}
              className="flex-1"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1.5" />
              Bearbeiten
            </Button>
          )}
          
          {onDuplicate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDuplicate(test)}
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
          )}
          
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(test)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
