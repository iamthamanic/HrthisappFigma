/**
 * BrowoKo Wiki Article View
 * Version: 4.12.25
 * 
 * Read-only view of wiki article with:
 * - Full content display
 * - Metadata
 * - RAG Access Info + Last Accessed
 * - Attachments download
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { 
  Download,
  Building2,
  MapPin,
  Award,
  Calendar,
  User,
  Eye,
  Database,
  Globe,
  Headphones,
  Activity,
  ChevronDown
} from 'lucide-react';
import { WikiArticle, RAGAccessType } from '../services/BrowoKo_wikiService';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const RAG_CONFIG: Record<RAGAccessType, { icon: any; label: string; description: string; color: string }> = {
  INTERN_WIKI: { 
    icon: Database, 
    label: 'Intern Wiki RAG', 
    description: 'Interner Browo Koordinator Zugriff',
    color: 'bg-blue-100 text-blue-700 border-blue-200' 
  },
  WEBSITE_RAG: { 
    icon: Globe, 
    label: 'Website RAG', 
    description: 'Für Website AI-Agenten verfügbar',
    color: 'bg-green-100 text-green-700 border-green-200' 
  },
  HOTLINE_RAG: { 
    icon: Headphones, 
    label: 'Hotline RAG', 
    description: 'Für Hotline AI-Agenten verfügbar',
    color: 'bg-purple-100 text-purple-700 border-purple-200' 
  },
};

interface WikiArticleViewProps {
  article: WikiArticle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BrowoKo_WikiArticleView({
  article,
  open,
  onOpenChange
}: WikiArticleViewProps) {
  if (!article) return null;

  const handleDownload = (attachment: any) => {
    window.open(attachment.file_url, '_blank');
  };

  const ragTypes = article.rag_access_types || ['INTERN_WIKI'];
  const isExternalRAG = ragTypes.some(t => t === 'WEBSITE_RAG' || t === 'HOTLINE_RAG');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {/* Article ID Badge */}
          {article.article_id && (
            <Badge variant="outline" className="w-fit mb-2 text-xs font-mono">
              {article.article_id}
            </Badge>
          )}
          <DialogTitle className="text-2xl">{article.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 border-b pb-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{article.creator_name || 'Unbekannt'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                Erstellt {formatDistanceToNow(new Date(article.created_at), {
                  addSuffix: true,
                  locale: de
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{article.view_count || 0} Aufrufe</span>
            </div>
          </div>

          {/* RAG Access Control Info - Multi-Select (Collapsible) */}
          <Collapsible defaultOpen={false}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4 h-auto border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <h4 className="font-medium">RAG Zugriff</h4>
                  {ragTypes.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {ragTypes.length} {ragTypes.length === 1 ? 'System' : 'Systeme'}
                    </Badge>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200" />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="border rounded-lg p-4 bg-gray-50 mt-2">
                <div className="space-y-2">
                  {ragTypes.map(type => {
                    const config = RAG_CONFIG[type];
                    const Icon = config.icon;
                    return (
                      <div key={type} className={`p-3 rounded-lg border ${config.color}`}>
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium">{config.label}</p>
                            <p className="text-sm opacity-80 mt-1">{config.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* External RAG: Last Accessed Info */}
                {isExternalRAG && (
                  <div className="mt-4 pt-4 border-t">
                    <h5 className="font-medium text-sm mb-2">AI-Agent Nutzung</h5>
                    {article.last_accessed_at ? (
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          <span>
                            Zuletzt verwendet: {formatDistanceToNow(new Date(article.last_accessed_at), {
                              addSuffix: true,
                              locale: de
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 ml-6">
                          <span>Zugriffe gesamt: {article.rag_access_count || 0}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Activity className="h-4 w-4" />
                        <span>Noch nicht von AI-Agenten verwendet</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Assignments */}
          {(article.departments?.length || article.locations?.length || article.specializations?.length) && (
            <div className="space-y-3 border-b pb-4">
              {/* Departments */}
              {article.departments && article.departments.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Abteilungen:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {article.departments.map((dept: any) => (
                      <Badge key={dept.id} variant="outline">
                        {dept.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Locations */}
              {article.locations && article.locations.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Standorte:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {article.locations.map((loc: any) => (
                      <Badge key={loc.id} variant="outline">
                        {loc.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Specializations */}
              {article.specializations && article.specializations.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Spezialisierungen:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {article.specializations.map((spec: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content_html }}
          />

          {/* Attachments */}
          {article.attachments && article.attachments.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Anhänge</h3>
              <div className="space-y-2">
                {article.attachments.map((attachment: any) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm">
                        <p className="font-medium">{attachment.file_name}</p>
                        <p className="text-gray-500 text-xs">
                          {attachment.file_type.toUpperCase()} • 
                          {attachment.file_size 
                            ? ` ${(attachment.file_size / 1024).toFixed(1)} KB`
                            : ' Größe unbekannt'}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(attachment)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
