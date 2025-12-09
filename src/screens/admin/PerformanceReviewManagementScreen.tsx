/**
 * PERFORMANCE REVIEW MANAGEMENT SCREEN
 * =====================================
 * Admin-Übersicht für Mitarbeitergespräche
 * 
 * Features:
 * - Template-Verwaltung (Erstellen, Bearbeiten, Löschen)
 * - Gespräche versenden
 * - Übersicht über alle Gespräche
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  Plus, 
  Search, 
  FileText, 
  Send, 
  Edit, 
  Trash2, 
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../../utils/supabase/client';
import { PerformanceReviewService, Template, PerformanceReview } from '../../services/BrowoKo_performanceReviewService';
import { useAuthStore } from '../../stores/BrowoKo_authStore';
import LoadingState from '../../components/LoadingState';

export default function PerformanceReviewManagementScreen() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const service = useMemo(() => new PerformanceReviewService(supabase), []);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Template Dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Send Review Dialog
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [sending, setSending] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, reviewsData] = await Promise.all([
        service.getTemplates(),
        service.getTeamReviews()
      ]);
      setTemplates(templatesData);
      setReviews(reviewsData);
    } catch (error: any) {
      console.error('❌ Error loading data:', error);
      
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

  // Load employees when send dialog opens
  useEffect(() => {
    if (isSendDialogOpen) {
      loadEmployees();
    }
  }, [isSendDialogOpen]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .eq('organization_id', profile?.organization_id)
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error('❌ Error loading employees:', error);
      toast.error('Fehler beim Laden der Mitarbeiter');
    }
  };

  // Create template
  const handleCreateTemplate = async () => {
    if (!newTemplateTitle.trim()) {
      toast.error('Titel ist erforderlich');
      return;
    }

    try {
      setCreating(true);
      const template = await service.createTemplate({
        title: newTemplateTitle,
        description: newTemplateDescription,
        questions: [] // Empty, will be filled in builder
      });

      toast.success('Template erstellt!');
      setIsCreateDialogOpen(false);
      setNewTemplateTitle('');
      setNewTemplateDescription('');
      
      // Navigate to builder
      navigate(`/admin/performance-reviews/template-builder/${template.id}`);
    } catch (error: any) {
      console.error('❌ Error creating template:', error);
      toast.error('Fehler beim Erstellen des Templates');
    } finally {
      setCreating(false);
    }
  };

  // Send review
  const handleSendReview = async () => {
    if (!selectedTemplateId || !selectedEmployeeId) {
      toast.error('Bitte Template und Mitarbeiter auswählen');
      return;
    }

    try {
      setSending(true);
      await service.sendReview({
        template_id: selectedTemplateId,
        employee_id: selectedEmployeeId,
        due_date: dueDate || undefined
      });

      toast.success('Gespräch versendet!');
      setIsSendDialogOpen(false);
      setSelectedTemplateId('');
      setSelectedEmployeeId('');
      setDueDate('');
      loadData(); // Reload to show new review
    } catch (error: any) {
      console.error('❌ Error sending review:', error);
      toast.error('Fehler beim Versenden des Gesprächs');
    } finally {
      setSending(false);
    }
  };

  // Delete template
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Template wirklich löschen?')) return;

    try {
      await service.deleteTemplate(templateId);
      toast.success('Template gelöscht');
      loadData();
    } catch (error: any) {
      console.error('❌ Error deleting template:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    totalTemplates: templates.length,
    totalReviews: reviews.length,
    openReviews: reviews.filter(r => r.status === 'SENT' || r.status === 'IN_PROGRESS').length,
    completedReviews: reviews.filter(r => r.status === 'COMPLETED').length,
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const config = {
      DRAFT: { label: 'Entwurf', color: 'bg-gray-100 text-gray-800' },
      SENT: { label: 'Versendet', color: 'bg-blue-100 text-blue-800' },
      IN_PROGRESS: { label: 'In Bearbeitung', color: 'bg-yellow-100 text-yellow-800' },
      SUBMITTED: { label: 'Eingereicht', color: 'bg-purple-100 text-purple-800' },
      COMPLETED: { label: 'Abgeschlossen', color: 'bg-green-100 text-green-800' },
    };

    const { label, color } = config[status as keyof typeof config] || config.DRAFT;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return <LoadingState message="Lade Mitarbeitergespräche..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mitarbeitergespräche</h1>
              <p className="text-gray-600 mt-1">
                Verwalte Templates und Gespräche
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setIsSendDialogOpen(true)} variant="outline">
                <Send className="w-4 h-4 mr-2" />
                Gespräch versenden
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Template erstellen
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Templates</p>
                    <p className="text-2xl font-bold">{stats.totalTemplates}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Gesamt</p>
                    <p className="text-2xl font-bold">{stats.totalReviews}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Offen</p>
                    <p className="text-2xl font-bold">{stats.openReviews}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Abgeschlossen</p>
                    <p className="text-2xl font-bold">{stats.completedReviews}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Templates durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Templates</h2>
          {filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Keine Templates gefunden</p>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Erstes Template erstellen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {filteredTemplates.map(template => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {template.description || 'Keine Beschreibung'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span>{template.questions.length} Fragen</span>
                      <span>
                        {new Date(template.created_at).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(`/admin/performance-reviews/template-builder/${template.id}`)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Bearbeiten
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTemplateId(template.id);
                          setIsSendDialogOpen(true);
                        }}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Versenden
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reviews */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Letzte Gespräche</h2>
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Noch keine Gespräche versendet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 10).map(review => (
                <Card key={review.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">
                            {review.employee?.first_name} {review.employee?.last_name}
                          </h3>
                          {getStatusBadge(review.status)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Erstellt am {new Date(review.created_at).toLocaleDateString('de-DE')}
                          {review.due_date && (
                            <span className="ml-4">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              Frist: {new Date(review.due_date).toLocaleDateString('de-DE')}
                            </span>
                          )}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/team-und-mitarbeiterverwaltung/user/${review.employee_id}?tab=mitarbeitergesprache`)}
                      >
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="form-card">
          <DialogHeader>
            <DialogTitle>Neues Template erstellen</DialogTitle>
          </DialogHeader>
          <div className="form-grid">
            <div className="form-field">
              <Label htmlFor="template-title" className="form-label">Titel *</Label>
              <Input
                id="template-title"
                className="form-input"
                value={newTemplateTitle}
                onChange={(e) => setNewTemplateTitle(e.target.value)}
                placeholder="z.B. Halbjahresgespräch 2024"
              />
            </div>
            <div className="form-field">
              <Label htmlFor="template-description" className="form-label">Beschreibung</Label>
              <Textarea
                id="template-description"
                className="form-input"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                placeholder="Optionale Beschreibung..."
                rows={3}
              />
            </div>
          </div>
          <div className="form-footer">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateTemplate} disabled={creating}>
              {creating ? 'Erstelle...' : 'Template erstellen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Review Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="form-card">
          <DialogHeader>
            <DialogTitle>Gespräch versenden</DialogTitle>
          </DialogHeader>
          <div className="form-grid">
            <div className="form-field">
              <Label htmlFor="select-template" className="form-label">Template *</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger id="select-template">
                  <SelectValue placeholder="Template auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="form-field">
              <Label htmlFor="select-employee" className="form-label">Mitarbeiter *</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger id="select-employee">
                  <SelectValue placeholder="Mitarbeiter auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="form-field">
              <Label htmlFor="due-date" className="form-label">Frist (optional)</Label>
              <Input
                id="due-date"
                className="form-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="form-footer">
            <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSendReview} disabled={sending}>
              {sending ? 'Versende...' : 'Gespräch versenden'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}