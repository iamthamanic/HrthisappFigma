/**
 * BrowoKo Create Wiki Article Dialog
 * Version: 4.12.34
 * 
 * Full-featured dialog for creating wiki articles with:
 * - Rich text editor
 * - Collapsible multi-select for departments, locations, specializations
 * - File upload (PDF, TXT)
 * - RAG Access Control (INTERN_WIKI, WEBSITE_RAG, HOTLINE_RAG)
 * - Preview mode
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { BrowoKo_RichTextEditor } from './BrowoKo_RichTextEditor';
import { Upload, X, FileText, File, Database, Globe, Headphones, ChevronDown, Building2, MapPin, Award } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';
import { createWikiArticle, getSpecializations, type RAGAccessType } from '../services/BrowoKo_wikiService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface CreateWikiArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Department {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

export function BrowoKo_CreateWikiArticleDialog({
  open,
  onOpenChange,
  onSuccess
}: CreateWikiArticleDialogProps) {
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [contentText, setContentText] = useState('');
  const [ragAccessTypes, setRagAccessTypes] = useState<RAGAccessType[]>(['INTERN_WIKI']);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [availableSpecializations, setAvailableSpecializations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load departments, locations and specializations
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptResult, locResult, specs] = await Promise.all([
        supabase.from('departments').select('id, name').order('name'),
        supabase.from('locations').select('id, name').order('name'),
        getSpecializations()
      ]);

      if (deptResult.error) {
        console.error('Departments load error:', deptResult.error);
      }
      if (locResult.error) {
        console.error('Locations load error:', locResult.error);
      }

      if (deptResult.data) setDepartments(deptResult.data);
      if (locResult.data) setLocations(locResult.data);
      setAvailableSpecializations(specs);
    } catch (error) {
      console.error('Error loading data:', error);
      // Don't show error toast - allow dialog to open with empty data
      console.warn('⚠️ Some data could not be loaded, continuing with empty arrays');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // Validate file types
      const validTypes = ['application/pdf', 'text/plain'];
      const invalidFiles = newFiles.filter(f => !validTypes.includes(f.type));
      
      if (invalidFiles.length > 0) {
        toast.error('Nur PDF und TXT Dateien sind erlaubt');
        return;
      }

      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      toast.error('Bitte Titel eingeben');
      return;
    }

    if (!contentText.trim()) {
      toast.error('Bitte Inhalt eingeben');
      return;
    }

    // Validate RAG types
    if (!ragAccessTypes || ragAccessTypes.length === 0) {
      toast.error('Bitte mindestens einen RAG-Zugriff auswählen');
      return;
    }

    setSubmitting(true);

    try {
      await createWikiArticle({
        title: title.trim(),
        content_html: contentHtml,
        rag_access_types: ragAccessTypes,
        content_text: contentText,
        department_ids: selectedDepartments.length > 0 ? selectedDepartments : undefined,
        location_ids: selectedLocations.length > 0 ? selectedLocations : undefined,
        specializations: selectedSpecializations.length > 0 ? selectedSpecializations : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      toast.success('Wiki-Artikel erfolgreich erstellt');
      handleClose();
      onSuccess();
    } catch (error) {
      console.error('Error creating wiki article:', error);
      toast.error('Fehler beim Erstellen des Artikels');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setContentHtml('');
    setContentText('');
    setRagAccessTypes(['INTERN_WIKI']);
    setSelectedDepartments([]);
    setSelectedLocations([]);
    setSelectedSpecializations([]);
    setAttachments([]);
    onOpenChange(false);
  };

  const toggleRagType = (type: RAGAccessType) => {
    setRagAccessTypes(prev => {
      if (prev.includes(type)) {
        // Don't allow removing last type
        if (prev.length === 1) {
          toast.error('Mindestens ein RAG-Zugriff muss ausgewählt sein');
          return prev;
        }
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const toggleDepartment = (deptId: string) => {
    setSelectedDepartments(prev =>
      prev.includes(deptId)
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const toggleLocation = (locId: string) => {
    setSelectedLocations(prev =>
      prev.includes(locId)
        ? prev.filter(id => id !== locId)
        : [...prev, locId]
    );
  };

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecializations(prev =>
      prev.includes(spec)
        ? prev.filter(s => s !== spec)
        : [...prev, spec]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wiki-Artikel erstellen</DialogTitle>
          <DialogDescription>
            Erstelle einen neuen Wiki-Artikel mit Rich-Text-Inhalt, Zuweisungen und Anhängen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Titel */}
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Wiki-Artikel Titel eingeben..."
              className="text-lg"
            />
          </div>

          {/* Rich Text Editor */}
          <div className="space-y-2">
            <Label>Inhalt *</Label>
            <BrowoKo_RichTextEditor
              value={contentHtml}
              onChange={(html, text) => {
                setContentHtml(html);
                setContentText(text);
              }}
              placeholder="Beginne mit dem Schreiben deines Wiki-Artikels..."
            />
          </div>

          {/* RAG Access Control - Multi-Select (Collapsible) */}
          <Collapsible defaultOpen={true}>
            <div className="space-y-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 h-auto border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    <Label className="cursor-pointer">RAG Zugriff *</Label>
                    {ragAccessTypes.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {ragAccessTypes.length} ausgewählt
                      </Badge>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="border rounded-lg p-4 space-y-3 mt-2">
                  <p className="text-sm text-gray-600 mb-3">
                    Wähle aus, welche AI-Systeme auf diesen Artikel zugreifen können (Mehrfachauswahl möglich):
                  </p>
              
              {/* INTERN_WIKI Checkbox */}
              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <Checkbox
                  id="rag-intern"
                  checked={ragAccessTypes.includes('INTERN_WIKI')}
                  onCheckedChange={() => toggleRagType('INTERN_WIKI')}
                  disabled={submitting}
                />
                <label htmlFor="rag-intern" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Intern Wiki RAG</span>
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      Standard
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    Interner Browo Koordinator Zugriff für alle Mitarbeiter
                  </p>
                </label>
              </div>

              {/* WEBSITE_RAG Checkbox */}
              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <Checkbox
                  id="rag-website"
                  checked={ragAccessTypes.includes('WEBSITE_RAG')}
                  onCheckedChange={() => toggleRagType('WEBSITE_RAG')}
                  disabled={submitting}
                />
                <label htmlFor="rag-website" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Website RAG</span>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      AI Agent
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    Artikel wird für Website AI-Agenten verfügbar gemacht (in Vorbereitung)
                  </p>
                </label>
              </div>

              {/* HOTLINE_RAG Checkbox */}
              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <Checkbox
                  id="rag-hotline"
                  checked={ragAccessTypes.includes('HOTLINE_RAG')}
                  onCheckedChange={() => toggleRagType('HOTLINE_RAG')}
                  disabled={submitting}
                />
                <label htmlFor="rag-hotline" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Headphones className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Hotline RAG</span>
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                      AI Agent
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    Artikel wird für Hotline AI-Agenten verfügbar gemacht (in Vorbereitung)
                  </p>
                </label>
              </div>
                  <p className="text-xs text-gray-500 mt-2">
                    ✅ {ragAccessTypes.length} RAG-System{ragAccessTypes.length !== 1 ? 'e' : ''} ausgewählt
                    {ragAccessTypes.includes('WEBSITE_RAG') && ' 🌐 Website AI-Agenten'}
                    {ragAccessTypes.includes('HOTLINE_RAG') && ' 📞 Hotline AI-Agenten'}
                  </p>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Departments - Collapsible */}
          <Collapsible defaultOpen={false}>
            <div className="space-y-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 h-auto border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-orange-600" />
                    <Label className="cursor-pointer">Abteilungen (optional)</Label>
                    {selectedDepartments.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedDepartments.length} ausgewählt
                      </Badge>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="border rounded-lg p-4 space-y-2 mt-2 max-h-64 overflow-y-auto">
                  {loading ? (
                    <p className="text-sm text-gray-500">Lädt...</p>
                  ) : departments.length === 0 ? (
                    <p className="text-sm text-gray-500">Keine Abteilungen verfügbar</p>
                  ) : (
                    departments.map(dept => (
                      <div key={dept.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <Checkbox
                          id={`dept-${dept.id}`}
                          checked={selectedDepartments.includes(dept.id)}
                          onCheckedChange={() => toggleDepartment(dept.id)}
                        />
                        <label
                          htmlFor={`dept-${dept.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {dept.name}
                        </label>
                      </div>
                    ))
                  )}
                  <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
                    ✅ {selectedDepartments.length} Abteilung{selectedDepartments.length !== 1 ? 'en' : ''} ausgewählt
                  </p>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Locations - Collapsible */}
          <Collapsible defaultOpen={false}>
            <div className="space-y-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 h-auto border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-600" />
                    <Label className="cursor-pointer">Standorte (optional)</Label>
                    {selectedLocations.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedLocations.length} ausgewählt
                      </Badge>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="border rounded-lg p-4 space-y-2 mt-2 max-h-64 overflow-y-auto">
                  {loading ? (
                    <p className="text-sm text-gray-500">Lädt...</p>
                  ) : locations.length === 0 ? (
                    <p className="text-sm text-gray-500">Keine Standorte verfügbar</p>
                  ) : (
                    locations.map(loc => (
                      <div key={loc.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <Checkbox
                          id={`loc-${loc.id}`}
                          checked={selectedLocations.includes(loc.id)}
                          onCheckedChange={() => toggleLocation(loc.id)}
                        />
                        <label
                          htmlFor={`loc-${loc.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {loc.name}
                        </label>
                      </div>
                    ))
                  )}
                  <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
                    ✅ {selectedLocations.length} Standort{selectedLocations.length !== 1 ? 'e' : ''} ausgewählt
                  </p>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Specializations - Collapsible */}
          <Collapsible defaultOpen={false}>
            <div className="space-y-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 h-auto border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-purple-600" />
                    <Label className="cursor-pointer">Spezialisierungen (optional)</Label>
                    {selectedSpecializations.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedSpecializations.length} ausgewählt
                      </Badge>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200" />
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="border rounded-lg p-4 space-y-2 mt-2 max-h-64 overflow-y-auto">
                  {loading ? (
                    <p className="text-sm text-gray-500">Lädt...</p>
                  ) : availableSpecializations.length === 0 ? (
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Keine Spezialisierungen verfügbar</p>
                      <p className="text-xs">
                        Spezialisierungen können in den Firmeneinstellungen erstellt werden
                      </p>
                    </div>
                  ) : (
                    availableSpecializations.map(spec => (
                      <div key={spec} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <Checkbox
                          id={`spec-${spec}`}
                          checked={selectedSpecializations.includes(spec)}
                          onCheckedChange={() => toggleSpecialization(spec)}
                        />
                        <label
                          htmlFor={`spec-${spec}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {spec}
                        </label>
                      </div>
                    ))
                  )}
                  <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
                    ✅ {selectedSpecializations.length} Spezialisierung{selectedSpecializations.length !== 1 ? 'en' : ''} ausgewählt
                  </p>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Datei-Upload */}
          <div className="space-y-2">
            <Label>Anhänge (PDF, TXT)</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                id="file-upload"
                multiple
                accept=".pdf,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Klicken zum Hochladen oder Drag & Drop
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PDF oder TXT Dateien
                </p>
              </label>
            </div>

            {/* Selected Files */}
            {attachments.length > 0 && (
              <div className="space-y-2 mt-3">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      {file.type === 'application/pdf' ? (
                        <FileText className="h-4 w-4 text-red-500" />
                      ) : (
                        <File className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-400">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !contentText.trim()}
          >
            {submitting ? 'Erstelle...' : 'Wiki-Artikel erstellen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
