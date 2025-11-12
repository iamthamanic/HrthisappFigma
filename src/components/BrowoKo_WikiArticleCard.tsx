/**
 * BrowoKo Wiki Article Card
 * Version: 4.12.25
 * 
 * Displays wiki article with:
 * - Title, preview, metadata
 * - Assignments (departments, locations, specializations)
 * - Created by/at info
 * - RAG Access Badge
 * - Edit/Delete actions (admin only)
 */

import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Building2, 
  MapPin, 
  Award,
  Paperclip,
  Calendar,
  User,
  Database,
  Globe,
  Headphones,
  Type,
  HardDrive
} from 'lucide-react';
import { WikiArticle, RAGAccessType, formatStorageSize, formatCharacterCount } from '../services/BrowoKo_wikiService';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const RAG_CONFIG: Record<RAGAccessType, { icon: any; label: string; color: string }> = {
  INTERN_WIKI: { icon: Database, label: 'Intern', color: 'bg-blue-100 text-blue-700' },
  WEBSITE_RAG: { icon: Globe, label: 'Website AI', color: 'bg-green-100 text-green-700' },
  HOTLINE_RAG: { icon: Headphones, label: 'Hotline AI', color: 'bg-purple-100 text-purple-700' },
};

interface WikiArticleCardProps {
  article: WikiArticle;
  onView: (article: WikiArticle) => void;
  onEdit?: (article: WikiArticle) => void;
  onDelete?: (article: WikiArticle) => void;
  isAdmin?: boolean;
}

export function BrowoKo_WikiArticleCard({
  article,
  onView,
  onEdit,
  onDelete,
  isAdmin = false
}: WikiArticleCardProps) {
  // Get plain text preview (first 150 chars)
  const textPreview = article.content_text.substring(0, 150);
  const hasMore = article.content_text.length > 150;
  
  const ragTypes = article.rag_access_types || ['INTERN_WIKI'];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {/* Article ID Badge */}
            {article.article_id && (
              <Badge variant="outline" className="mb-2 text-xs font-mono">
                {article.article_id}
              </Badge>
            )}
            <div className="flex items-start gap-2 mb-2">
              <h3 className="font-semibold text-lg line-clamp-2 flex-1">
                {article.title}
              </h3>
              <div className="flex flex-wrap gap-1 shrink-0">
                {ragTypes.map(type => {
                  const config = RAG_CONFIG[type];
                  const Icon = config.icon;
                  return (
                    <Badge 
                      key={type}
                      className={`${config.color} border-0 flex items-center gap-1 px-2 py-0.5 text-xs`}
                    >
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{article.creator_name || 'Unbekannt'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(article.created_at), {
                    addSuffix: true,
                    locale: de
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{article.view_count || 0} Aufrufe</span>
              </div>
              {/* NEW: Character Count */}
              {article.character_count !== undefined && (
                <div className="flex items-center gap-1">
                  <Type className="h-3 w-3" />
                  <span>{formatCharacterCount(article.character_count)} Zeichen</span>
                </div>
              )}
              {/* NEW: Storage Size */}
              {article.storage_size !== undefined && (
                <div className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  <span>{formatStorageSize(article.storage_size)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        {/* Content Preview */}
        <p className="text-sm text-gray-600 line-clamp-3">
          {textPreview}
          {hasMore && '...'}
        </p>

        {/* Assignments */}
        <div className="space-y-2">
          {/* Departments */}
          {article.departments && article.departments.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Building2 className="h-3 w-3" />
                <span>Abteilungen:</span>
              </div>
              {article.departments.map((dept: any) => (
                <Badge key={dept.id} variant="outline" className="text-xs">
                  {dept.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Locations */}
          {article.locations && article.locations.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                <span>Standorte:</span>
              </div>
              {article.locations.map((loc: any) => (
                <Badge key={loc.id} variant="outline" className="text-xs">
                  {loc.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Specializations */}
          {article.specializations && article.specializations.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Award className="h-3 w-3" />
                <span>Spezialisierungen:</span>
              </div>
              {article.specializations.map((spec: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {spec}
                </Badge>
              ))}
            </div>
          )}

          {/* Attachments */}
          {article.attachments && article.attachments.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Paperclip className="h-3 w-3" />
              <span>{article.attachments.length} Anhang(e)</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(article)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Ansehen
        </Button>

        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit?.(article)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete?.(article)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
