/**
 * Node Configuration Panel (n8n-style Sidebar)
 * Slides in from right when a node is selected
 */

import { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { X, AlertCircle, CheckCircle2 } from '../../components/icons/BrowoKoIcons';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface NodeConfigPanelProps {
  node: Node | null;
  onClose: () => void;
  onUpdateNode: (nodeId: string, config: any) => void;
}

interface Employee {
  id: string;
  email: string;
  full_name: string;
  position?: string;
}

interface Benefit {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

interface Document {
  id: string;
  name: string;
  category?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  category: string;
}

export default function NodeConfigPanel({ node, onClose, onUpdateNode }: NodeConfigPanelProps) {
  const [config, setConfig] = useState<any>(node?.data?.config || {});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load data when node changes
  useEffect(() => {
    if (!node) return;
    
    setConfig(node.data?.config || {});
    setHasChanges(false);
    
    // Load data based on node type
    const actionType = node.data?.actionType || node.data?.type;
    
    if (['SEND_EMAIL', 'CREATE_TASK', 'ASSIGN_BENEFITS', 'ASSIGN_DOCUMENT', 'DISTRIBUTE_COINS', 'ASSIGN_EQUIPMENT', 'ASSIGN_TRAINING', 'CREATE_NOTIFICATION', 'ADD_TO_TEAM'].includes(actionType)) {
      loadEmployees();
    }
    
    if (actionType === 'ASSIGN_BENEFITS') {
      loadBenefits();
    }
    
    if (actionType === 'ASSIGN_DOCUMENT') {
      loadDocuments();
    }
    
    if (actionType === 'SEND_EMAIL') {
      loadEmailTemplates();
    }
  }, [node?.id]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Personalakte/employees`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          }
        }
      );
      
      if (response.ok) {
        const { employees: data } = await response.json();
        setEmployees(data || []);
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBenefits = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Benefits/browse`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          }
        }
      );
      
      if (response.ok) {
        const { benefits: data } = await response.json();
        setBenefits(data || []);
      }
    } catch (error) {
      console.error('Failed to load benefits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Dokumente/documents`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          }
        }
      );
      
      if (response.ok) {
        const { documents: data } = await response.json();
        setDocuments(data || []);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-EmailTemplates/templates`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          }
        }
      );
      
      if (response.ok) {
        const { templates: data } = await response.json();
        setEmailTemplates(data || []);
      }
    } catch (error) {
      console.error('Failed to load email templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!node) return;
    onUpdateNode(node.id, config);
    setHasChanges(false);
  };

  if (!node) return null;

  const actionType = node.data?.actionType || node.data?.type;
  const isConfigured = node.data?.config && Object.keys(node.data.config).length > 0;

  return (
    <div className="fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl border-l z-50 flex flex-col">
      {/* Header */}
      <div className="h-16 border-b px-6 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-green-500' : 'bg-orange-500'}`}></div>
          <div>
            <h3 className="font-semibold text-gray-900">{node.data?.label}</h3>
            <p className="text-xs text-gray-500">{actionType}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Status Banner */}
        {!isConfigured && (
          <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900">Konfiguration erforderlich</p>
                <p className="text-xs text-orange-700 mt-1">
                  Diese Node ist noch nicht konfiguriert. Bitte fülle die erforderlichen Felder aus.
                </p>
              </div>
            </div>
          </Card>
        )}

        {isConfigured && (
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Konfiguration vollständig</p>
                <p className="text-xs text-green-700 mt-1">
                  Diese Node ist bereit zur Ausführung.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Configuration Forms based on actionType */}
        {actionType === 'SEND_EMAIL' && (
          <SendEmailConfig 
            config={config} 
            updateConfig={updateConfig} 
            employees={employees}
            emailTemplates={emailTemplates}
            loading={loading}
          />
        )}

        {actionType === 'ASSIGN_BENEFITS' && (
          <AssignBenefitsConfig 
            config={config} 
            updateConfig={updateConfig} 
            benefits={benefits}
            employees={employees}
            loading={loading}
          />
        )}

        {actionType === 'CREATE_TASK' && (
          <CreateTaskConfig 
            config={config} 
            updateConfig={updateConfig} 
            employees={employees}
            loading={loading}
          />
        )}

        {actionType === 'ASSIGN_DOCUMENT' && (
          <AssignDocumentConfig 
            config={config} 
            updateConfig={updateConfig} 
            documents={documents}
            employees={employees}
            loading={loading}
          />
        )}

        {actionType === 'DISTRIBUTE_COINS' && (
          <DistributeCoinsConfig 
            config={config} 
            updateConfig={updateConfig} 
            employees={employees}
            loading={loading}
          />
        )}

        {actionType === 'DELAY' && (
          <DelayConfig 
            config={config} 
            updateConfig={updateConfig} 
          />
        )}

        {actionType === 'ASSIGN_EQUIPMENT' && (
          <AssignEquipmentConfig 
            config={config} 
            updateConfig={updateConfig} 
            employees={employees}
            loading={loading}
          />
        )}

        {actionType === 'ASSIGN_TRAINING' && (
          <AssignTrainingConfig 
            config={config} 
            updateConfig={updateConfig} 
            employees={employees}
            loading={loading}
          />
        )}

        {actionType === 'CREATE_NOTIFICATION' && (
          <CreateNotificationConfig 
            config={config} 
            updateConfig={updateConfig} 
            employees={employees}
            loading={loading}
          />
        )}

        {actionType === 'ADD_TO_TEAM' && (
          <AddToTeamConfig 
            config={config} 
            updateConfig={updateConfig} 
            employees={employees}
            loading={loading}
          />
        )}

        {actionType === 'ASSIGN_TEST' && (
          <AssignTestConfig 
            config={config} 
            updateConfig={updateConfig} 
            employees={employees}
            loading={loading}
          />
        )}

        {actionType === 'ASSIGN_VIDEO' && (
          <AssignVideoConfig 
            config={config} 
            updateConfig={updateConfig} 
            employees={employees}
            loading={loading}
          />
        )}

        {actionType === 'APPROVE_REQUEST' && (
          <ApproveRequestConfig 
            config={config} 
            updateConfig={updateConfig} 
          />
        )}
      </div>

      {/* Footer */}
      <div className="h-20 border-t px-6 flex items-center justify-between bg-gray-50">
        <div className="text-xs text-gray-500">
          {hasChanges ? 'Ungespeicherte Änderungen' : 'Alle Änderungen gespeichert'}
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges}
          className="bg-blue-600"
        >
          Speichern
        </Button>
      </div>
    </div>
  );
}

// ==================== CONFIG COMPONENTS ====================

function SendEmailConfig({ config, updateConfig, employees, loading, emailTemplates }: any) {
  const [useTemplate, setUseTemplate] = useState(config.useTemplate !== false);
  
  const handleTemplateSelect = (templateId: string) => {
    const template = emailTemplates.find((t: EmailTemplate) => t.id === templateId);
    if (template) {
      updateConfig('templateId', templateId);
      updateConfig('subject', template.subject);
      updateConfig('body', template.body_html);
      updateConfig('bodyText', template.body_text);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="recipient">Empfänger *</Label>
        <Select value={config.recipientType || 'triggered_employee'} onValueChange={(v) => updateConfig('recipientType', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Wähle Empfänger..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="triggered_employee">Getriggerter Mitarbeiter</SelectItem>
            <SelectItem value="specific_user">Spezifischer Benutzer</SelectItem>
            <SelectItem value="all_employees">Alle Mitarbeiter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.recipientType === 'specific_user' && (
        <div>
          <Label htmlFor="userId">Benutzer *</Label>
          <Select value={config.userId || ''} onValueChange={(v) => updateConfig('userId', v)} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Wähle Benutzer..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp: Employee) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Template Toggle */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="useTemplate"
            checked={useTemplate}
            onChange={(e) => {
              setUseTemplate(e.target.checked);
              updateConfig('useTemplate', e.target.checked);
            }}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <Label htmlFor="useTemplate" className="cursor-pointer text-blue-900">
            📄 E-Mail-Template verwenden (empfohlen)
          </Label>
        </div>
      </Card>

      {useTemplate && (
        <div>
          <Label htmlFor="templateId">Template auswählen *</Label>
          <Select 
            value={config.templateId || ''} 
            onValueChange={handleTemplateSelect} 
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wähle Template..." />
            </SelectTrigger>
            <SelectContent>
              {emailTemplates.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  Keine Templates gefunden. Erstelle ein Template unter Admin → E-Mail Templates.
                </div>
              ) : (
                emailTemplates.map((tmpl: EmailTemplate) => (
                  <SelectItem key={tmpl.id} value={tmpl.id}>
                    <div className="flex items-center gap-2">
                      <span>{tmpl.name}</span>
                      <Badge className="text-xs">{tmpl.category}</Badge>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="subject">Betreff *</Label>
        <Input 
          id="subject"
          value={config.subject || ''} 
          onChange={(e) => updateConfig('subject', e.target.value)}
          placeholder="z.B. Willkommen im Team, {{ employeeName }}!"
          disabled={useTemplate && config.templateId}
        />
        <Card className="mt-2 p-2 bg-blue-50 border-blue-200">
          <p className="text-xs text-blue-900 font-medium mb-1">💡 Verfügbare Variablen:</p>
          <div className="flex flex-wrap gap-1">
            {['employeeName', 'employeeEmail', 'startDate', 'endDate', 'organizationId'].map((v) => (
              <code key={v} className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">{`{{ ${v} }}`}</code>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <Label htmlFor="body">Nachricht *</Label>
        <Textarea 
          id="body"
          value={config.body || ''} 
          onChange={(e) => updateConfig('body', e.target.value)}
          placeholder="Hallo {{ employeeName }},&#10;&#10;willkommen im Team!"
          rows={8}
          disabled={useTemplate && config.templateId}
        />
        <p className="text-xs text-gray-500 mt-1">💡 Tipp: Nutze Variablen wie {'{{'} employeeName {'}}'}  für dynamische Inhalte</p>
      </div>
    </div>
  );
}

function AssignBenefitsConfig({ config, updateConfig, benefits, employees, loading }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="benefitId">Benefit *</Label>
        <Select value={config.benefitId || ''} onValueChange={(v) => {
          const benefit = benefits.find((b: Benefit) => b.id === v);
          updateConfig('benefitId', v);
          updateConfig('benefitName', benefit?.name || '');
        }} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder="Wähle Benefit..." />
          </SelectTrigger>
          <SelectContent>
            {benefits.map((benefit: Benefit) => (
              <SelectItem key={benefit.id} value={benefit.id}>
                {benefit.name}
                {benefit.category && <Badge className="ml-2 text-xs">{benefit.category}</Badge>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="assignTo">Zuweisen zu *</Label>
        <Select value={config.assignTo || 'triggered_employee'} onValueChange={(v) => updateConfig('assignTo', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Wem zuweisen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="triggered_employee">Getriggerter Mitarbeiter</SelectItem>
            <SelectItem value="specific_user">Spezifischer Benutzer</SelectItem>
            <SelectItem value="all_employees">Alle Mitarbeiter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.assignTo === 'specific_user' && (
        <div>
          <Label htmlFor="userId">Benutzer *</Label>
          <Select value={config.userId || ''} onValueChange={(v) => updateConfig('userId', v)} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Wähle Benutzer..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp: Employee) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.position || 'Kein Titel'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="startDate">Start-Datum</Label>
        <Select value={config.startDate || 'immediate'} onValueChange={(v) => updateConfig('startDate', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Wann starten..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="immediate">Sofort</SelectItem>
            <SelectItem value="custom">Benutzerdefiniert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.startDate === 'custom' && (
        <div>
          <Label htmlFor="customDate">Datum *</Label>
          <Input 
            type="date"
            id="customDate"
            value={config.customDate || ''} 
            onChange={(e) => updateConfig('customDate', e.target.value)}
          />
        </div>
      )}

      <div>
        <Label htmlFor="notes">Notizen (Optional)</Label>
        <Textarea 
          id="notes"
          value={config.notes || ''} 
          onChange={(e) => updateConfig('notes', e.target.value)}
          placeholder="Zusätzliche Informationen..."
          rows={3}
        />
      </div>
    </div>
  );
}

function CreateTaskConfig({ config, updateConfig, employees, loading }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Aufgaben-Titel *</Label>
        <Input 
          id="title"
          value={config.title || ''} 
          onChange={(e) => updateConfig('title', e.target.value)}
          placeholder="z.B. Laptop für {{ employeeName }} vorbereiten"
        />
        <p className="text-xs text-gray-500 mt-1">💡 Variablen: {'{{'} employeeName {'}}'}, {'{{'} employeeEmail {'}}'}</p>
      </div>

      <div>
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea 
          id="description"
          value={config.description || ''} 
          onChange={(e) => updateConfig('description', e.target.value)}
          placeholder="Bitte Laptop für {{ employeeName }} vorbereiten"
          rows={4}
        />
        <p className="text-xs text-gray-500 mt-1">💡 Unterstützt Variablen</p>
      </div>

      <div>
        <Label htmlFor="assigneeType">Zuweisen zu *</Label>
        <Select value={config.assigneeType || 'triggered_employee'} onValueChange={(v) => updateConfig('assigneeType', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Wem zuweisen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="triggered_employee">Getriggerter Mitarbeiter</SelectItem>
            <SelectItem value="specific_user">Spezifischer Benutzer</SelectItem>
            <SelectItem value="hr_admin">HR/Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.assigneeType === 'specific_user' && (
        <div>
          <Label htmlFor="assigneeId">Benutzer *</Label>
          <Select value={config.assigneeId || ''} onValueChange={(v) => updateConfig('assigneeId', v)} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Wähle Benutzer..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp: Employee) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.position || 'Kein Titel'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="priority">Priorität</Label>
        <Select value={config.priority || 'MEDIUM'} onValueChange={(v) => updateConfig('priority', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Priorität wählen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">Niedrig</SelectItem>
            <SelectItem value="MEDIUM">Mittel</SelectItem>
            <SelectItem value="HIGH">Hoch</SelectItem>
            <SelectItem value="URGENT">Dringend</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="dueDate">Fälligkeitsdatum (Optional)</Label>
        <Input 
          type="date"
          id="dueDate"
          value={config.dueDate || ''} 
          onChange={(e) => updateConfig('dueDate', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="boardId">Kanban Board (Optional)</Label>
        <Input 
          id="boardId"
          value={config.boardId || ''} 
          onChange={(e) => updateConfig('boardId', e.target.value)}
          placeholder="Board ID"
        />
      </div>
    </div>
  );
}

function AssignDocumentConfig({ config, updateConfig, documents, employees, loading }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="documentId">Dokument *</Label>
        <Select value={config.documentId || ''} onValueChange={(v) => {
          const doc = documents.find((d: Document) => d.id === v);
          updateConfig('documentId', v);
          updateConfig('documentName', doc?.name || '');
        }} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder="Wähle Dokument..." />
          </SelectTrigger>
          <SelectContent>
            {documents.map((doc: Document) => (
              <SelectItem key={doc.id} value={doc.id}>
                {doc.name}
                {doc.category && <Badge className="ml-2 text-xs">{doc.category}</Badge>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="assignTo">Zuweisen zu *</Label>
        <Select value={config.assignTo || 'triggered_employee'} onValueChange={(v) => updateConfig('assignTo', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Wem zuweisen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="triggered_employee">Getriggerter Mitarbeiter</SelectItem>
            <SelectItem value="specific_user">Spezifischer Benutzer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.assignTo === 'specific_user' && (
        <div>
          <Label htmlFor="userId">Benutzer *</Label>
          <Select value={config.userId || ''} onValueChange={(v) => updateConfig('userId', v)} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Wähle Benutzer..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp: Employee) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="requireSignature">Unterschrift erforderlich?</Label>
        <Select value={config.requireSignature || 'false'} onValueChange={(v) => updateConfig('requireSignature', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="false">Nein</SelectItem>
            <SelectItem value="true">Ja</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function DistributeCoinsConfig({ config, updateConfig, employees, loading }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="amount">Anzahl Coins *</Label>
        <Input 
          type="number"
          id="amount"
          value={config.amount || ''} 
          onChange={(e) => updateConfig('amount', e.target.value)}
          placeholder="z.B. 100"
          min="1"
        />
      </div>

      <div>
        <Label htmlFor="reason">Grund *</Label>
        <Input 
          id="reason"
          value={config.reason || ''} 
          onChange={(e) => updateConfig('reason', e.target.value)}
          placeholder="z.B. Willkommensbonus für {{ employeeName }}"
        />
        <p className="text-xs text-gray-500 mt-1">💡 Unterstützt Variablen</p>
      </div>

      <div>
        <Label htmlFor="recipientType">Empfänger *</Label>
        <Select value={config.recipientType || 'triggered_employee'} onValueChange={(v) => updateConfig('recipientType', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Wem zuweisen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="triggered_employee">Getriggerter Mitarbeiter</SelectItem>
            <SelectItem value="specific_user">Spezifischer Benutzer</SelectItem>
            <SelectItem value="all_employees">Alle Mitarbeiter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.recipientType === 'specific_user' && (
        <div>
          <Label htmlFor="userId">Benutzer *</Label>
          <Select value={config.userId || ''} onValueChange={(v) => updateConfig('userId', v)} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Wähle Benutzer..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp: Employee) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function DelayConfig({ config, updateConfig }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="duration">Dauer *</Label>
        <Input 
          type="number"
          id="duration"
          value={config.duration || ''} 
          onChange={(e) => updateConfig('duration', e.target.value)}
          placeholder="z.B. 5"
          min="1"
        />
      </div>

      <div>
        <Label htmlFor="unit">Einheit *</Label>
        <Select value={config.unit || 'days'} onValueChange={(v) => updateConfig('unit', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Einheit wählen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="minutes">Minuten</SelectItem>
            <SelectItem value="hours">Stunden</SelectItem>
            <SelectItem value="days">Tage</SelectItem>
            <SelectItem value="weeks">Wochen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-900">
          Der Workflow wird für {config.duration || '...'} {config.unit === 'minutes' ? 'Minuten' : config.unit === 'hours' ? 'Stunden' : config.unit === 'weeks' ? 'Wochen' : 'Tage'} pausieren.
        </p>
      </Card>
    </div>
  );
}

function AssignEquipmentConfig({ config, updateConfig, employees, loading }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="equipmentName">Equipment Name *</Label>
        <Input 
          id="equipmentName"
          value={config.equipmentName || ''} 
          onChange={(e) => updateConfig('equipmentName', e.target.value)}
          placeholder="z.B. MacBook Pro 16"
        />
      </div>

      <div>
        <Label htmlFor="equipmentType">Typ</Label>
        <Select value={config.equipmentType || 'LAPTOP'} onValueChange={(v) => updateConfig('equipmentType', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LAPTOP">Laptop</SelectItem>
            <SelectItem value="MONITOR">Monitor</SelectItem>
            <SelectItem value="PHONE">Telefon</SelectItem>
            <SelectItem value="TABLET">Tablet</SelectItem>
            <SelectItem value="OTHER">Sonstiges</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea 
          id="description"
          value={config.description || ''} 
          onChange={(e) => updateConfig('description', e.target.value)}
          placeholder="Details zum Equipment..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="serialNumber">Seriennummer (Optional)</Label>
        <Input 
          id="serialNumber"
          value={config.serialNumber || ''} 
          onChange={(e) => updateConfig('serialNumber', e.target.value)}
          placeholder="z.B. SN123456"
        />
      </div>

      <div>
        <Label htmlFor="assignTo">Zuweisen zu *</Label>
        <Select value={config.assignTo || 'triggered_employee'} onValueChange={(v) => updateConfig('assignTo', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Wem zuweisen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="triggered_employee">Getriggerter Mitarbeiter</SelectItem>
            <SelectItem value="specific_user">Spezifischer Benutzer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.assignTo === 'specific_user' && (
        <div>
          <Label htmlFor="userId">Benutzer *</Label>
          <Select value={config.userId || ''} onValueChange={(v) => updateConfig('userId', v)} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Wähle Benutzer..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp: Employee) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function AssignTrainingConfig({ config, updateConfig, employees, loading }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="trainingName">Schulung *</Label>
        <Input 
          id="trainingName"
          value={config.trainingName || ''} 
          onChange={(e) => updateConfig('trainingName', e.target.value)}
          placeholder="z.B. Sicherheitsschulung"
        />
      </div>

      <div>
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea 
          id="description"
          value={config.description || ''} 
          onChange={(e) => updateConfig('description', e.target.value)}
          placeholder="Details zur Schulung..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="assignTo">Zuweisen zu *</Label>
        <Select value={config.assignTo || 'triggered_employee'} onValueChange={(v) => updateConfig('assignTo', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Wem zuweisen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="triggered_employee">Getriggerter Mitarbeiter</SelectItem>
            <SelectItem value="specific_user">Spezifischer Benutzer</SelectItem>
            <SelectItem value="all_employees">Alle Mitarbeiter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.assignTo === 'specific_user' && (
        <div>
          <Label htmlFor="userId">Benutzer *</Label>
          <Select value={config.userId || ''} onValueChange={(v) => updateConfig('userId', v)} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Wähle Benutzer..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp: Employee) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="dueDate">Fälligkeitsdatum (Optional)</Label>
        <Input 
          type="date"
          id="dueDate"
          value={config.dueDate || ''} 
          onChange={(e) => updateConfig('dueDate', e.target.value)}
        />
      </div>
    </div>
  );
}

function CreateNotificationConfig({ config, updateConfig, employees, loading }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Titel *</Label>
        <Input 
          id="title"
          value={config.title || ''} 
          onChange={(e) => updateConfig('title', e.target.value)}
          placeholder="z.B. Neue Nachricht"
        />
      </div>

      <div>
        <Label htmlFor="message">Nachricht *</Label>
        <Textarea 
          id="message"
          value={config.message || ''} 
          onChange={(e) => updateConfig('message', e.target.value)}
          placeholder="Benachrichtigungstext..."
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="recipientType">Empfänger *</Label>
        <Select value={config.recipientType || 'triggered_employee'} onValueChange={(v) => updateConfig('recipientType', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Wem senden..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="triggered_employee">Getriggerter Mitarbeiter</SelectItem>
            <SelectItem value="specific_user">Spezifischer Benutzer</SelectItem>
            <SelectItem value="all_employees">Alle Mitarbeiter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.recipientType === 'specific_user' && (
        <div>
          <Label htmlFor="userId">Benutzer *</Label>
          <Select value={config.userId || ''} onValueChange={(v) => updateConfig('userId', v)} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Wähle Benutzer..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp: Employee) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="priority">Priorität</Label>
        <Select value={config.priority || 'NORMAL'} onValueChange={(v) => updateConfig('priority', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">Niedrig</SelectItem>
            <SelectItem value="NORMAL">Normal</SelectItem>
            <SelectItem value="HIGH">Hoch</SelectItem>
            <SelectItem value="URGENT">Dringend</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function AddToTeamConfig({ config, updateConfig, employees, loading }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="teamName">Team Name *</Label>
        <Input 
          id="teamName"
          value={config.teamName || ''} 
          onChange={(e) => updateConfig('teamName', e.target.value)}
          placeholder="z.B. Engineering Team"
        />
      </div>

      <div>
        <Label htmlFor="role">Rolle im Team</Label>
        <Select value={config.role || 'MEMBER'} onValueChange={(v) => updateConfig('role', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MEMBER">Mitglied</SelectItem>
            <SelectItem value="LEAD">Team Lead</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="userType">Benutzer *</Label>
        <Select value={config.userType || 'triggered_employee'} onValueChange={(v) => updateConfig('userType', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Wem zuweisen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="triggered_employee">Getriggerter Mitarbeiter</SelectItem>
            <SelectItem value="specific_user">Spezifischer Benutzer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.userType === 'specific_user' && (
        <div>
          <Label htmlFor="userId">Benutzer *</Label>
          <Select value={config.userId || ''} onValueChange={(v) => updateConfig('userId', v)} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Wähle Benutzer..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp: Employee) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function AssignTestConfig({ config, updateConfig, employees, loading }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="testName">Test Name *</Label>
        <Input 
          id="testName"
          value={config.testName || ''} 
          onChange={(e) => updateConfig('testName', e.target.value)}
          placeholder="z.B. Sicherheitstest"
        />
      </div>

      <div>
        <Label htmlFor="assignTo">Zuweisen zu *</Label>
        <Select value={config.assignTo || 'triggered_employee'} onValueChange={(v) => updateConfig('assignTo', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Wem zuweisen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="triggered_employee">Getriggerter Mitarbeiter</SelectItem>
            <SelectItem value="specific_user">Spezifischer Benutzer</SelectItem>
            <SelectItem value="all_employees">Alle Mitarbeiter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.assignTo === 'specific_user' && (
        <div>
          <Label htmlFor="userId">Benutzer *</Label>
          <Select value={config.userId || ''} onValueChange={(v) => updateConfig('userId', v)} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Wähle Benutzer..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp: Employee) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="dueDate">Fälligkeitsdatum (Optional)</Label>
        <Input 
          type="date"
          id="dueDate"
          value={config.dueDate || ''} 
          onChange={(e) => updateConfig('dueDate', e.target.value)}
        />
      </div>
    </div>
  );
}

function AssignVideoConfig({ config, updateConfig, employees, loading }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="videoName">Video Name *</Label>
        <Input 
          id="videoName"
          value={config.videoName || ''} 
          onChange={(e) => updateConfig('videoName', e.target.value)}
          placeholder="z.B. Willkommensvideo"
        />
      </div>

      <div>
        <Label htmlFor="videoUrl">Video URL</Label>
        <Input 
          id="videoUrl"
          value={config.videoUrl || ''} 
          onChange={(e) => updateConfig('videoUrl', e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div>
        <Label htmlFor="assignTo">Zuweisen zu *</Label>
        <Select value={config.assignTo || 'triggered_employee'} onValueChange={(v) => updateConfig('assignTo', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Wem zuweisen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="triggered_employee">Getriggerter Mitarbeiter</SelectItem>
            <SelectItem value="specific_user">Spezifischer Benutzer</SelectItem>
            <SelectItem value="all_employees">Alle Mitarbeiter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.assignTo === 'specific_user' && (
        <div>
          <Label htmlFor="userId">Benutzer *</Label>
          <Select value={config.userId || ''} onValueChange={(v) => updateConfig('userId', v)} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Wähle Benutzer..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp: Employee) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function ApproveRequestConfig({ config, updateConfig }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="requestType">Antragstyp *</Label>
        <Select value={config.requestType || 'BENEFIT'} onValueChange={(v) => updateConfig('requestType', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BENEFIT">Benefit Antrag</SelectItem>
            <SelectItem value="LEAVE">Urlaubsantrag</SelectItem>
            <SelectItem value="EXPENSE">Spesenantrag</SelectItem>
            <SelectItem value="OTHER">Sonstiges</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="autoApprove">Automatisch genehmigen?</Label>
        <Select value={config.autoApprove || 'false'} onValueChange={(v) => updateConfig('autoApprove', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="false">Nein (manuelle Genehmigung)</SelectItem>
            <SelectItem value="true">Ja (automatisch)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notizen (Optional)</Label>
        <Textarea 
          id="notes"
          value={config.notes || ''} 
          onChange={(e) => updateConfig('notes', e.target.value)}
          placeholder="Zusätzliche Informationen..."
          rows={3}
        />
      </div>
    </div>
  );
}
