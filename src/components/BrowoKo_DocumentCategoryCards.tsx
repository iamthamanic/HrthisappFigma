import { Card, CardContent } from './ui/card';
import { FileText, Calendar, File, Award, Heart, UserCircle, Briefcase } from './icons/BrowoKoIcons';

interface CategoryCount {
  VERTRAG: number;
  ZERTIFIKAT: number;
  LOHN: number;
  AU: number;
  PERSONALDOKUMENTE: number;
  BEWERBUNGSUNTERLAGEN: number;
  SONSTIGES: number;
}

interface DocumentCategoryCardsProps {
  categoryCounts: CategoryCount;
  selectedCategory?: string | null;
  onCategoryClick?: (category: string) => void;
}

const categoryConfig = {
  VERTRAG: {
    label: 'Verträge',
    icon: FileText,
    color: 'bg-blue-100 text-blue-600',
  },
  ZERTIFIKAT: {
    label: 'Zertifikate',
    icon: Award,
    color: 'bg-purple-100 text-purple-600',
  },
  LOHN: {
    label: 'Gehaltsabrechnungen',
    icon: Calendar,
    color: 'bg-green-100 text-green-600',
  },
  AU: {
    label: 'AU',
    icon: Heart,
    color: 'bg-red-100 text-red-600',
  },
  PERSONALDOKUMENTE: {
    label: 'Personaldokumente',
    icon: UserCircle,
    color: 'bg-indigo-100 text-indigo-600',
  },
  BEWERBUNGSUNTERLAGEN: {
    label: 'Bewerbungsunterlagen',
    icon: Briefcase,
    color: 'bg-orange-100 text-orange-600',
  },
  SONSTIGES: {
    label: 'Sonstiges',
    icon: File,
    color: 'bg-gray-100 text-gray-600',
  },
};

export function DocumentCategoryCards({ 
  categoryCounts, 
  selectedCategory,
  onCategoryClick 
}: DocumentCategoryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(categoryConfig).map(([key, config]) => {
        const Icon = config.icon;
        const count = categoryCounts[key as keyof CategoryCount] || 0;
        const isSelected = selectedCategory === key;
        
        return (
          <Card 
            key={key} 
            className={`transition-all cursor-pointer ${
              isSelected 
                ? 'ring-2 ring-blue-500 shadow-lg' 
                : 'hover:shadow-md hover:scale-[1.02]'
            }`}
            onClick={() => onCategoryClick?.(key)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color} ${
                  isSelected ? 'ring-2 ring-blue-400' : ''
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-sm ${isSelected ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                    {config.label}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">{count}</p>
                </div>
              </div>
              {isSelected && (
                <div className="mt-2 text-xs text-blue-600 font-medium">
                  ✓ Filter aktiv
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
