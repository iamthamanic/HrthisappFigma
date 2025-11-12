/**
 * BrowoKo Wiki Search Bar
 * Version: 4.12.17
 * 
 * Full-text search bar for wiki articles
 */

import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, X } from 'lucide-react';

interface WikiSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function BrowoKo_WikiSearchBar({
  onSearch,
  placeholder = 'Wiki durchsuchen...'
}: WikiSearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button onClick={handleSearch} disabled={!query.trim()}>
        Suchen
      </Button>
    </div>
  );
}
