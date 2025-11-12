/**
 * BrowoKo Wiki Search Results
 * Version: 4.12.22
 * 
 * Displays search results with:
 * - Highlighted snippets (Google-like)
 * - Relevance ranking
 * - Click to view full article
 */

import { WikiArticle } from '../services/BrowoKo_wikiService';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { FileText, Clock, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface WikiSearchResultsProps {
  results: WikiArticle[];
  searchQuery: string;
  onSelectArticle: (article: WikiArticle) => void;
  loading?: boolean;
}

export function BrowoKo_WikiSearchResults({
  results,
  searchQuery,
  onSelectArticle,
  loading = false
}: WikiSearchResultsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!searchQuery.trim()) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p>Gib einen Suchbegriff ein, um Wiki-Artikel zu durchsuchen</p>
        <p className="text-sm mt-2">
          💡 Tipp: Du kannst auch Fragen stellen, z.B. "Wie erstelle ich eine Rechnung?"
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p>Keine Artikel gefunden für "{searchQuery}"</p>
        <p className="text-sm mt-2">
          Versuche andere Suchbegriffe oder allgemeinere Wörter
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {results.length} {results.length === 1 ? 'Artikel' : 'Artikel'} gefunden für "{searchQuery}"
        </span>
        <span className="text-xs text-gray-500">
          Sortiert nach Relevanz
        </span>
      </div>

      {/* Results */}
      {results.map((article) => (
        <Card
          key={article.id}
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500"
          onClick={() => onSelectArticle(article)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {/* Article ID Badge */}
                {article.article_id && (
                  <Badge variant="outline" className="mb-2 text-xs font-mono">
                    {article.article_id}
                  </Badge>
                )}
                {/* Title with Highlighting */}
                <CardTitle 
                  className="text-lg hover:text-blue-600 transition-colors"
                  dangerouslySetInnerHTML={{ 
                    __html: article.title_snippet || article.title 
                  }}
                />
                
                {/* Metadata */}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(new Date(article.created_at), { 
                        addSuffix: true,
                        locale: de 
                      })}
                    </span>
                  </div>
                  {article.view_count > 0 && (
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{article.view_count} Aufrufe</span>
                    </div>
                  )}
                  {article.rank && article.rank > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Relevanz: {(article.rank * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Content Snippet with Highlighting */}
            {article.content_snippet && (
              <div 
                className="text-sm text-gray-700 line-clamp-3 wiki-search-snippet"
                dangerouslySetInnerHTML={{ 
                  __html: article.content_snippet 
                }}
              />
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-3">
              {article.departments && article.departments.length > 0 && (
                article.departments.slice(0, 3).map((dept) => (
                  <Badge key={dept.id} variant="outline" className="text-xs">
                    🏢 {dept.name}
                  </Badge>
                ))
              )}
              {article.locations && article.locations.length > 0 && (
                article.locations.slice(0, 2).map((loc) => (
                  <Badge key={loc.id} variant="outline" className="text-xs">
                    📍 {loc.name}
                  </Badge>
                ))
              )}
              {article.specializations && article.specializations.length > 0 && (
                article.specializations.slice(0, 2).map((spec) => (
                  <Badge key={spec} variant="outline" className="text-xs">
                    ⚡ {spec}
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* CSS for highlighting */}
      <style>{`
        .wiki-search-snippet mark {
          background-color: #fef08a;
          font-weight: 600;
          padding: 2px 4px;
          border-radius: 2px;
        }
        
        .wiki-search-snippet {
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}
