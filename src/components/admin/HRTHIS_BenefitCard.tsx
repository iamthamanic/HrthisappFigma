import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Gift, TrendingUp, Users, Sparkles, Edit, Trash2 } from '../icons/HRTHISIcons';

interface Benefit {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  available: boolean;
}

interface BenefitCardProps {
  benefit: Benefit;
  onEdit: () => void;
  onDelete: () => void;
}

const getIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    Gift,
    TrendingUp,
    Users,
    Sparkles
  };
  return icons[iconName] || Gift;
};

export default function BenefitCard({ benefit, onEdit, onDelete }: BenefitCardProps) {
  const Icon = getIcon(benefit.icon);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className={`p-3 rounded-lg ${benefit.color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className="mb-2">{benefit.title}</CardTitle>
        <p className="text-sm text-gray-600">{benefit.description}</p>
      </CardContent>
    </Card>
  );
}
