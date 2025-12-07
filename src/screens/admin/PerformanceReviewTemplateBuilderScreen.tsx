/**
 * PERFORMANCE REVIEW TEMPLATE BUILDER SCREEN
 * ===========================================
 * Drag & Drop Template Builder für Mitarbeitergespräche
 * 
 * Features:
 * - Question Toolbox (links)
 * - Canvas mit Drag & Drop (mitte)
 * - Question Settings Panel (rechts)
 * - Save/Publish Buttons
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Plus, 
  Trash2, 
  GripVertical,
  CheckSquare,
  Circle,
  FileText,
  Edit3,
  Calendar,
  PenTool,
  BarChart3,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { PerformanceReviewService, Question, Template } from '../../services/BrowoKo_performanceReviewService';
import { supabase } from '../../utils/supabase/client';
import { useAuthStore } from '../../stores/BrowoKo_authStore';
import LoadingState from '../../components/LoadingState';

// ========================================
// QUESTION TYPES
// ========================================
const QUESTION_TYPES = [
  {
    id: 'text-short',
    label: 'Kurze Textantwort',
    icon: Edit3,
    color: 'bg-blue-500',
    description: 'Einzeiliges Textfeld'
  },
  {
    id: 'text-long',
    label: 'Lange Textantwort',
    icon: FileText,
    color: 'bg-purple-500',
    description: 'Mehrzeiliges Textfeld'
  },
  {
    id: 'rating-scale',
    label: 'Bewertungsskala',
    icon: BarChart3,
    color: 'bg-green-500',
    description: 'z.B. 1-5 Sterne'
  },
  {
    id: 'yes-no',
    label: 'Ja/Nein',
    icon: CheckSquare,
    color: 'bg-yellow-500',
    description: 'Binäre Auswahl'
  },
  {
    id: 'checkboxes',
    label: 'Checkboxen',
    icon: CheckSquare,
    color: 'bg-orange-500',
    description: 'Mehrfachauswahl'
  },
  {
    id: 'date-input',
    label: 'Datumseingabe',
    icon: Calendar,
    color: 'bg-red-500',
    description: 'Datum auswählen'
  },
  {
    id: 'signature',
    label: 'Unterschrift',
    icon: PenTool,
    color: 'bg-pink-500',
    description: 'Digitale Unterschrift'
  }
] as const;

// ========================================
// MAIN COMPONENT
// ========================================
export default function PerformanceReviewTemplateBuilderScreen() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const service = useMemo(() => new PerformanceReviewService(supabase), []);

  const [template, setTemplate] = useState<Template | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ========================================
  // LOAD TEMPLATE
  // ========================================
  useEffect(() => {
    if (!templateId) return;
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      console.log('🔄 [loadTemplate] Loading template...', { templateId });
      
      if (templateId === 'new') {
        // Create new template
        setTemplate({
          id: 'new',
          organization_id: profile?.organization_id || '',
          title: 'Neues Template',
          description: '',
          questions: [],
          created_by: profile?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        setQuestions([]);
      } else {
        // Load existing template
        const templateData = await service.getTemplate(templateId!);
        setTemplate(templateData);
        setQuestions(templateData.questions || []);
      }
      
      console.log('✅ [loadTemplate] Success!');
    } catch (error: any) {
      console.error('❌ [loadTemplate] Error:', error);
      toast.error('Fehler beim Laden des Templates');
      navigate('/admin/performance-reviews');
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // ADD QUESTION
  // ========================================
  const addQuestion = (questionTypeId: string) => {
    const questionType = QUESTION_TYPES.find(qt => qt.id === questionTypeId);
    if (!questionType) return;

    const newQuestion: Question = {
      id: `question-${Date.now()}`,
      type: questionTypeId as any,
      question: '',
      description: '',
      required: false,
      order: questions.length,
      // Type-specific defaults
      ...(questionTypeId === 'rating-scale' && {
        minRating: 1,
        maxRating: 5,
        ratingLabels: { min: 'Sehr schlecht', max: 'Sehr gut' }
      }),
      ...(questionTypeId === 'checkboxes' && {
        options: [
          { id: '1', text: 'Option 1' },
          { id: '2', text: 'Option 2' },
          { id: '3', text: 'Option 3' }
        ]
      })
    };

    setQuestions([...questions, newQuestion]);
    setSelectedQuestionId(newQuestion.id);
    toast.success(`${questionType.label} hinzugefügt`);
  };

  // ========================================
  // UPDATE QUESTION
  // ========================================
  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, ...updates }
        : q
    ));
  };

  // ========================================
  // DELETE QUESTION
  // ========================================
  const deleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
    if (selectedQuestionId === questionId) {
      setSelectedQuestionId(null);
    }
    toast.success('Frage gelöscht');
  };

  // ========================================
  // MOVE QUESTION
  // ========================================
  const moveQuestion = (questionId: string, direction: 'up' | 'down') => {
    const index = questions.findIndex(q => q.id === questionId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    
    // Update order
    newQuestions.forEach((question, i) => {
      question.order = i;
    });

    setQuestions(newQuestions);
  };

  // ========================================
  // SAVE TEMPLATE
  // ========================================
  const saveTemplate = async () => {
    if (!template || !profile?.organization_id) return;

    try {
      setSaving(true);
      console.log('💾 [saveTemplate] Saving...', { questions: questions.length });

      if (templateId === 'new') {
        // Create new template
        await service.createTemplate({
          title: template.title,
          description: template.description,
          questions: questions
        });
        toast.success('Template erstellt!');
        navigate('/admin/performance-reviews');
      } else {
        // Update existing template
        await service.updateTemplate(template.id, {
          title: template.title,
          description: template.description,
          questions: questions
        });
        toast.success('Template gespeichert!');
      }
      
      console.log('✅ [saveTemplate] Success!');
    } catch (error: any) {
      console.error('❌ [saveTemplate] Error:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // UPDATE TEMPLATE INFO
  // ========================================
  const updateTemplateInfo = (updates: Partial<Template>) => {
    if (!template) return;
    setTemplate({ ...template, ...updates });
  };

  // ========================================
  // SELECTED QUESTION
  // ========================================
  const selectedQuestion = useMemo(() => {
    return questions.find(q => q.id === selectedQuestionId) || null;
  }, [questions, selectedQuestionId]);

  // ========================================
  // LOADING STATE
  // ========================================
  if (loading) {
    return <LoadingState message="Template wird geladen..." />;
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">Template nicht gefunden</p>
          <Button onClick={() => navigate('/admin/performance-reviews')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="flex h-screen bg-gray-50">
      {/* LEFT COLUMN - Buttons + Question Types */}
      <div className="w-80 flex flex-col bg-gray-100 border-r">
        {/* Action Buttons */}
        <div className="bg-white border-b p-4 space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/performance-reviews')}
            className="w-full justify-start"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <Button
            onClick={saveTemplate}
            disabled={saving || questions.length === 0}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Speichert...' : templateId === 'new' ? 'Erstellen' : 'Speichern'}
          </Button>
        </div>

        {/* Question Types */}
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="font-bold mb-4">Fragetypen</h2>
          <div className="space-y-3">
            {QUESTION_TYPES.map(questionType => {
              const Icon = questionType.icon;
              return (
                <button
                  key={questionType.id}
                  onClick={() => addQuestion(questionType.id)}
                  className="w-full flex items-start gap-3 p-4 rounded-lg bg-white border hover:border-blue-500 hover:shadow-md transition-all text-left"
                >
                  <div className={`${questionType.color} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{questionType.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{questionType.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MIDDLE COLUMN - Template Info + Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Template Info */}
        <div className="bg-white border-b p-6">
          <div className="max-w-2xl">
            <h2 className="font-semibold mb-4">Template Informationen</h2>
            <div className="space-y-4">
              <div>
                <Label>Titel</Label>
                <Input
                  value={template.title}
                  onChange={(e) => updateTemplateInfo({ title: e.target.value })}
                  placeholder="z.B. Halbjahresgespräch 2024"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Textarea
                  value={template.description || ''}
                  onChange={(e) => updateTemplateInfo({ description: e.target.value })}
                  placeholder="Beschreibung des Templates..."
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Canvas - Questions List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {questions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Noch keine Fragen vorhanden</p>
                <p className="text-sm mt-1">Wähle einen Fragetyp aus der linken Spalte</p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((question, index) => {
                  const questionType = QUESTION_TYPES.find(qt => qt.id === question.type);
                  const Icon = questionType?.icon || FileText;
                  const isSelected = selectedQuestionId === question.id;

                  return (
                    <Card
                      key={question.id}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedQuestionId(question.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className={`${questionType?.color || 'bg-gray-500'} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-500">
                                Frage {index + 1}
                              </span>
                              {question.required && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                  Pflicht
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium">
                              {question.question || <span className="text-gray-400 italic">Keine Frage eingegeben</span>}
                            </p>
                            {question.description && (
                              <p className="text-xs text-gray-500 mt-1">{question.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveQuestion(question.id, 'up');
                              }}
                              disabled={index === 0}
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveQuestion(question.id, 'down');
                              }}
                              disabled={index === questions.length - 1}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteQuestion(question.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Question Settings */}
      <div className="w-96 bg-white border-l flex flex-col">
        <div className="p-6 border-b">
          <h2 className="font-semibold">Frage Einstellungen</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedQuestion ? (
            <div className="text-center text-gray-500 py-12">
              <p>Wähle eine Frage aus</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Frage */}
              <div>
                <Label>Frage</Label>
                <Textarea
                  value={selectedQuestion.question}
                  onChange={(e) => updateQuestion(selectedQuestion.id, { question: e.target.value })}
                  placeholder="Frage eingeben..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Beschreibung */}
              <div>
                <Label>Beschreibung (optional)</Label>
                <Textarea
                  value={selectedQuestion.description || ''}
                  onChange={(e) => updateQuestion(selectedQuestion.id, { description: e.target.value })}
                  placeholder="Zusätzliche Informationen..."
                  rows={2}
                  className="mt-1"
                />
              </div>

              {/* Pflichtfeld */}
              <div className="flex items-center justify-between">
                <Label>Pflichtfeld</Label>
                <Switch
                  checked={selectedQuestion.required}
                  onCheckedChange={(checked) => updateQuestion(selectedQuestion.id, { required: checked })}
                />
              </div>

              {/* Type-specific settings */}
              {selectedQuestion.type === 'rating-scale' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Min. Bewertung</Label>
                      <Input
                        type="number"
                        value={selectedQuestion.minRating || 1}
                        onChange={(e) => updateQuestion(selectedQuestion.id, { minRating: parseInt(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Max. Bewertung</Label>
                      <Input
                        type="number"
                        value={selectedQuestion.maxRating || 5}
                        onChange={(e) => updateQuestion(selectedQuestion.id, { maxRating: parseInt(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Min. Label</Label>
                    <Input
                      value={selectedQuestion.ratingLabels?.min || ''}
                      onChange={(e) => updateQuestion(selectedQuestion.id, { 
                        ratingLabels: { ...selectedQuestion.ratingLabels, min: e.target.value } as any
                      })}
                      placeholder="z.B. Sehr schlecht"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Max. Label</Label>
                    <Input
                      value={selectedQuestion.ratingLabels?.max || ''}
                      onChange={(e) => updateQuestion(selectedQuestion.id, { 
                        ratingLabels: { ...selectedQuestion.ratingLabels, max: e.target.value } as any
                      })}
                      placeholder="z.B. Sehr gut"
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              {selectedQuestion.type === 'checkboxes' && (
                <div>
                  <Label>Optionen</Label>
                  <div className="space-y-2 mt-2">
                    {selectedQuestion.options?.map((option, index) => (
                      <div key={option.id} className="flex gap-2">
                        <Input
                          value={option.text}
                          onChange={(e) => {
                            const newOptions = [...(selectedQuestion.options || [])];
                            newOptions[index] = { ...option, text: e.target.value };
                            updateQuestion(selectedQuestion.id, { options: newOptions });
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newOptions = selectedQuestion.options?.filter((_, i) => i !== index);
                            updateQuestion(selectedQuestion.id, { options: newOptions });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newOptions = [
                          ...(selectedQuestion.options || []),
                          { id: `opt-${Date.now()}`, text: '' }
                        ];
                        updateQuestion(selectedQuestion.id, { options: newOptions });
                      }}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Option hinzufügen
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
