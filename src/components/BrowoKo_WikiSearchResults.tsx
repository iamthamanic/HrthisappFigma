/**
 * BrowoKo Wiki Search Results
 * Version: 4.12.26
 * 
 * Displays search results with:
 * - Card-based layout (same as Learning Management)
 * - All article metadata and assignments
 * - Click to view full article
 */

import { WikiArticle } from '../services/BrowoKo_wikiService';
import { BrowoKo_WikiArticleCard } from './BrowoKo_WikiArticleCard';
import { FileText } from 'lucide-react';

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        {searchQuery ? (
          <>
            <p>Keine Artikel gefunden für "{searchQuery}"</p>
            <p className="text-sm mt-2">
              Versuche andere Suchbegriffe oder allgemeinere Wörter
            </p>
          </>
        ) : (
          <>
            <p>Noch keine Wiki-Artikel vorhanden</p>
            <p className="text-sm mt-2">
              Wiki-Artikel werden von Admins erstellt
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {searchQuery ? (
            <>{results.length} {results.length === 1 ? 'Artikel' : 'Artikel'} gefunden für "{searchQuery}"</>
          ) : (
            <>{results.length} {results.length === 1 ? 'Artikel' : 'Artikel'} verfügbar</>
          )}
        </span>
        {searchQuery && (
          <span className="text-xs text-gray-500">
            Sortiert nach Relevanz
          </span>
        )}
      </div>

      {/* Results Grid - Same as Learning Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((article) => (
          <BrowoKo_WikiArticleCard
            key={article.id}
            article={article}
            onView={onSelectArticle}
            isAdmin={false}
          />
        ))}
      </div>
    </div>
  );
}