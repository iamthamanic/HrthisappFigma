/**
 * EMPLOYEE PERFORMANCE REVIEW SCREEN
 * ===================================
 * Mitarbeiter-Ansicht für Mitarbeitergespräche
 * 
 * Features:
 * - Offene Gespräche anzeigen
 * - Gespräche ausfüllen
 * - Abgeschlossene Gespräche ansehen
 * - Notizen hinzufügen
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  Calendar,
  Send,
  Eye,
  Plus,
  AlertCircle,
  Star
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import { PerformanceReviewService, PerformanceReview, Question, Answer } from '../services/BrowoKo_performanceReviewService';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import LoadingState from '../components/LoadingState';

export default function EmployeePerformanceReviewScreen() {
  const { profile } = useAuthStore();
  const service = useMemo(() => new PerformanceReviewService(supabase), []);

  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await service.getMyReviews();
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

  const openReview = async (review: PerformanceReview) => {
    try {
      const { review: fullReview, answers: reviewAnswers } = await service.getReview(review.id);
      setSelectedReview(fullReview);
      setAnswers(reviewAnswers);
      setIsDialogOpen(true);
    } catch (error: any) {
      console.error('❌ Error loading review details:', error);
      toast.error('Fehler beim Laden des Gesprächs');
    }
  };

  const handleAnswerChange = async (questionId: string, value: any) => {
    if (!selectedReview) return;

    try {
      await service.saveAnswer(selectedReview.id, questionId, value);
      
      // Update local state
      setAnswers(prev => prev.map(a => 
        a.question_id === questionId 
          ? { ...a, employee_answer: value, employee_answered_at: new Date().toISOString() }
          : a
      ));

      toast.success('Antwort gespeichert');
    } catch (error: any) {
      console.error('❌ Error saving answer:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  const handleSubmit = async () => {
    if (!selectedReview) return;

    // Check if all required questions are answered
    const unansweredRequired = selectedReview.template_snapshot.filter(q => 
      q.required && !answers.find(a => a.question_id === q.id)?.employee_answer
    );

    if (unansweredRequired.length > 0) {
      toast.error(`Bitte beantworte alle Pflichtfragen (${unansweredRequired.length} offen)`);
      return;
    }

    if (!confirm('Gespräch einreichen? Du kannst es danach nicht mehr bearbeiten.')) {
      return;
    }

    try {
      setSaving(true);
      await service.submitReview(selectedReview.id);
      toast.success('Gespräch eingereicht!');
      setIsDialogOpen(false);
      loadReviews();
    } catch (error: any) {
      console.error('❌ Error submitting review:', error);
      toast.error('Fehler beim Einreichen');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedReview || !newNote.trim()) return;

    try {
      await service.addNote(selectedReview.id, newNote);
      toast.success('Notiz hinzugefügt');
      setNewNote('');
      // Reload review to show new note
      const { review } = await service.getReview(selectedReview.id);
      setSelectedReview(review);
    } catch (error: any) {
      console.error('❌ Error adding note:', error);
      toast.error('Fehler beim Hinzufügen der Notiz');
    }
  };

  const openReviews = reviews.filter(r => r.status === 'SENT' || r.status === 'IN_PROGRESS');
  const completedReviews = reviews.filter(r => r.status === 'SUBMITTED' || r.status === 'COMPLETED');

  const getStatusBadge = (status: string) => {
    const config = {
      SENT: { label: 'Neu', color: 'bg-blue-100 text-blue-800', icon: Clock },
      IN_PROGRESS: { label: 'In Bearbeitung', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      SUBMITTED: { label: 'Eingereicht', color: 'bg-purple-100 text-purple-800', icon: CheckCircle2 },
      COMPLETED: { label: 'Abgeschlossen', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    };

    const { label, color, icon: Icon } = config[status as keyof typeof config] || config.SENT;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  const isOverdue = (review: PerformanceReview) => {
    if (!review.due_date || review.status !== 'SENT' && review.status !== 'IN_PROGRESS') return false;
    return new Date(review.due_date) < new Date();
  };

  if (loading) {
    return <LoadingState message="Lade Gespräche..." />;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Meine Mitarbeitergespräche</h1>
        <p className="text-gray-600 mt-2">
          Fülle deine Gespräche aus und sehe vergangene Gespräche ein
        </p>
      </div>

      <Tabs defaultValue="open" className="space-y-6">
        <TabsList>
          <TabsTrigger value="open" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Offene Gespräche ({openReviews.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Abgeschlossene ({completedReviews.length})
          </TabsTrigger>
        </TabsList>

        {/* Open Reviews */}
        <TabsContent value="open" className="space-y-4">
          {openReviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Keine offenen Gespräche</p>
              </CardContent>
            </Card>
          ) : (
            openReviews.map(review => {
              const overdue = isOverdue(review);
              return (
                <Card key={review.id} className={overdue ? 'border-red-300' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">Mitarbeitergespräch</CardTitle>
                          {getStatusBadge(review.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <Calendar className="w-3 h-3 inline mr-1" />
                            Erstellt am {new Date(review.created_at).toLocaleDateString('de-DE')}
                          </p>
                          {review.due_date && (
                            <p className={overdue ? 'text-red-600 font-medium' : ''}>
                              {overdue && <AlertCircle className="w-3 h-3 inline mr-1" />}
                              Frist: {new Date(review.due_date).toLocaleDateString('de-DE')}
                              {overdue && ' (Überfällig!)'}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button onClick={() => openReview(review)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Ausfüllen
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Completed Reviews */}
        <TabsContent value="completed" className="space-y-4">
          {completedReviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Noch keine abgeschlossenen Gespräche</p>
              </CardContent>
            </Card>
          ) : (
            completedReviews.map(review => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">Mitarbeitergespräch</CardTitle>
                        {getStatusBadge(review.status)}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Eingereicht am {new Date(review.updated_at).toLocaleDateString('de-DE')}
                        </p>
                        {review.conversation_date && (
                          <p>
                            Gespräch geführt am {new Date(review.conversation_date).toLocaleDateString('de-DE')}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => openReview(review)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Ansehen
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mitarbeitergespräch</DialogTitle>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-6">
              {/* Questions */}
              <div className="space-y-6">
                {selectedReview.template_snapshot.map((question: Question, index: number) => {
                  const answer = answers.find(a => a.question_id === question.id);
                  const isReadOnly = selectedReview.status === 'SUBMITTED' || selectedReview.status === 'COMPLETED';

                  return (
                    <div key={question.id} className="border rounded-lg p-4">
                      <Label className="text-base font-medium mb-2 block">
                        {index + 1}. {question.question}
                        {question.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {question.description && (
                        <p className="text-sm text-gray-600 mb-3">{question.description}</p>
                      )}

                      {/* Render based on question type */}
                      {question.type === 'text-short' && (
                        <Input
                          value={answer?.employee_answer || ''}
                          onChange={(e) => !isReadOnly && handleAnswerChange(question.id, e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Deine Antwort..."
                        />
                      )}

                      {question.type === 'text-long' && (
                        <Textarea
                          value={answer?.employee_answer || ''}
                          onChange={(e) => !isReadOnly && handleAnswerChange(question.id, e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Deine Antwort..."
                          rows={4}
                        />
                      )}

                      {question.type === 'rating-scale' && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {Array.from({ length: (question.maxRating || 5) - (question.minRating || 1) + 1 }, (_, i) => {
                              const value = (question.minRating || 1) + i;
                              const selected = answer?.employee_answer === value;
                              return (
                                <button
                                  key={value}
                                  onClick={() => !isReadOnly && handleAnswerChange(question.id, value)}
                                  disabled={isReadOnly}
                                  className={`w-10 h-10 rounded-lg border-2 transition-colors ${
                                    selected 
                                      ? 'border-blue-500 bg-blue-500 text-white' 
                                      : 'border-gray-300 hover:border-blue-300'
                                  }`}
                                >
                                  {value}
                                </button>
                              );
                            })}
                          </div>
                          {question.ratingLabels && (
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>{question.ratingLabels.min}</span>
                              <span>{question.ratingLabels.max}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {question.type === 'yes-no' && (
                        <div className="flex gap-4">
                          <button
                            onClick={() => !isReadOnly && handleAnswerChange(question.id, true)}
                            disabled={isReadOnly}
                            className={`px-6 py-2 rounded-lg border-2 transition-colors ${
                              answer?.employee_answer === true
                                ? 'border-green-500 bg-green-500 text-white'
                                : 'border-gray-300 hover:border-green-300'
                            }`}
                          >
                            Ja
                          </button>
                          <button
                            onClick={() => !isReadOnly && handleAnswerChange(question.id, false)}
                            disabled={isReadOnly}
                            className={`px-6 py-2 rounded-lg border-2 transition-colors ${
                              answer?.employee_answer === false
                                ? 'border-red-500 bg-red-500 text-white'
                                : 'border-gray-300 hover:border-red-300'
                            }`}
                          >
                            Nein
                          </button>
                        </div>
                      )}

                      {question.type === 'checkboxes' && question.options && (
                        <div className="space-y-2">
                          {question.options.map(option => {
                            const selectedOptions = answer?.employee_answer || [];
                            const isChecked = Array.isArray(selectedOptions) && selectedOptions.includes(option.id);
                            
                            return (
                              <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (isReadOnly) return;
                                    const newSelection = e.target.checked
                                      ? [...selectedOptions, option.id]
                                      : selectedOptions.filter((id: string) => id !== option.id);
                                    handleAnswerChange(question.id, newSelection);
                                  }}
                                  disabled={isReadOnly}
                                  className="w-4 h-4"
                                />
                                <span>{option.text}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {question.type === 'date-input' && (
                        <Input
                          type="date"
                          value={answer?.employee_answer || ''}
                          onChange={(e) => !isReadOnly && handleAnswerChange(question.id, e.target.value)}
                          disabled={isReadOnly}
                        />
                      )}

                      {/* Manager Comment (read-only for employee) */}
                      {answer?.manager_comment && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-medium text-blue-900 mb-1">Kommentar Vorgesetzter:</p>
                          <p className="text-sm text-blue-800">{answer.manager_comment}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Employee Notes (for completed reviews) */}
              {(selectedReview.status === 'SUBMITTED' || selectedReview.status === 'COMPLETED') && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-3">Meine Notizen</h3>
                  {selectedReview.employee_notes && selectedReview.employee_notes.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {selectedReview.employee_notes.map((note: any, i: number) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm">
                          <p className="text-gray-800">{note.note}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(note.created_at).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Neue Notiz hinzufügen..."
                    />
                    <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Hinzufügen
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Schließen
                </Button>
                {(selectedReview.status === 'SENT' || selectedReview.status === 'IN_PROGRESS') && (
                  <Button onClick={handleSubmit} disabled={saving}>
                    <Send className="w-4 h-4 mr-2" />
                    {saving ? 'Reiche ein...' : 'Einreichen'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}