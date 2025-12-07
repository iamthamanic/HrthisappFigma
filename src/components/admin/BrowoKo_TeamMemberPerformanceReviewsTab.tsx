/**
 * TEAM MEMBER PERFORMANCE REVIEWS TAB
 * ====================================
 * Zeigt alle Mitarbeitergespräche eines Mitarbeiters
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { MessageSquare, Calendar, Clock, CheckCircle2, FileText, Eye, Plus } from 'lucide-react';
import { PerformanceReviewService, PerformanceReview } from '../../services/BrowoKo_performanceReviewService';
import { supabase } from '../../utils/supabase/client';
import LoadingState from '../LoadingState';
import { toast } from 'sonner@2.0.3';
import { useNavigate } from 'react-router-dom';

interface TeamMemberPerformanceReviewsTabProps {
  userId: string;
  userName: string;
}

const STATUS_CONFIG = {
  DRAFT: { label: 'Entwurf', color: 'bg-gray-100 text-gray-700' },
  SENT: { label: 'Versendet', color: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'In Bearbeitung', color: 'bg-yellow-100 text-yellow-700' },
  SUBMITTED: { label: 'Eingereicht', color: 'bg-purple-100 text-purple-700' },
  COMPLETED: { label: 'Abgeschlossen', color: 'bg-green-100 text-green-700' }
};

export function TeamMemberPerformanceReviewsTab({ userId, userName }: TeamMemberPerformanceReviewsTabProps) {
  const navigate = useNavigate();
  const service = useMemo(() => new PerformanceReviewService(supabase), []);
  
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [userId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await service.getTeamReviews(userId);
      setReviews(data);
    } catch (error: any) {
      console.error('❌ Error loading reviews:', error);
      
      // Check if it's a connection/fetch error (Edge Function not deployed)
      if (error.message === 'Failed to fetch' || error.message.includes('fetch')) {
        toast.error('❌ Edge Function nicht erreichbar! Siehe PERFORMANCE_REVIEWS_DEPLOYMENT.md');
        console.error('🔥 DEPLOYMENT REQUIRED: Bitte PERFORMANCE_REVIEWS_DEPLOYMENT.md lesen!');
      } else if (error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('Unknown error')) {
        toast.error('❌ Datenbank-Tabellen fehlen! Bitte SQL in Supabase ausführen (siehe PERFORMANCE_REVIEWS_DEPLOYMENT.md)');
        console.error('🔥 DATABASE SETUP REQUIRED: SQL aus /supabase/migrations/performance_reviews_schema.sql im Supabase SQL Editor ausführen!');
      } else {
        toast.error(`Fehler beim Laden: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const viewReview = (reviewId: string) => {
    navigate(`/employee-performance-review/${reviewId}`);
  };

  if (loading) {
    return <LoadingState message="Gespräche werden geladen..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Mitarbeitergespräche
            </CardTitle>
            <Button
              onClick={() => navigate('/admin/performance-reviews')}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Neues Gespräch
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Übersicht aller Mitarbeitergespräche von {userName}
          </p>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500">Noch keine Gespräche vorhanden</p>
            <p className="text-sm text-gray-400 mt-1">
              Erstelle ein neues Gespräch im Admin-Bereich
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const statusConfig = STATUS_CONFIG[review.status];
            
            return (
              <Card key={review.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left Side - Info */}
                    <div className="flex-1 space-y-3">
                      {/* Template Title */}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {(review.template_snapshot as any)?.title || 'Mitarbeitergespräch'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {(review.template_snapshot as any)?.description || ''}
                        </p>
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {/* Status */}
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>

                        {/* Due Date */}
                        {review.due_date && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Fällig: {formatDate(review.due_date)}</span>
                          </div>
                        )}

                        {/* Conversation Date */}
                        {review.conversation_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Gespräch: {formatDate(review.conversation_date)}</span>
                          </div>
                        )}

                        {/* Questions Count */}
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>{Array.isArray(review.template_snapshot) ? review.template_snapshot.length : 0} Fragen</span>
                        </div>
                      </div>

                      {/* Created Info */}
                      <div className="text-xs text-gray-500">
                        Erstellt am {formatDate(review.created_at)}
                        {review.created_by_user && (
                          <span> von {review.created_by_user.first_name} {review.created_by_user.last_name}</span>
                        )}
                      </div>
                    </div>

                    {/* Right Side - Action */}
                    <div className="flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewReview(review.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ansehen
                      </Button>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  {review.status === 'IN_PROGRESS' && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mitarbeiter arbeitet gerade daran...</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}