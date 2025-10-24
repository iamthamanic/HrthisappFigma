/**
 * @file HRTHIS_VideoCategoryFilter.tsx
 * @domain HR - Learning Management
 * @description Category filter buttons for videos with counts
 * @namespace HRTHIS_
 */

import { Card, CardContent } from './ui/card';

interface Category {
  id: string;
  label: string;
  count: number;
}

interface VideoCategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export default function VideoCategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: VideoCategoryFilterProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
