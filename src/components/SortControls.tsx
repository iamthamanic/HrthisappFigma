import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { ArrowUpDown, ArrowUp, ArrowDown } from './icons/HRTHISIcons';

export interface SortConfig {
  key: SortableColumn;
  direction: 'asc' | 'desc';
}

export type SortableColumn = 
  | 'first_name'
  | 'last_name'
  | 'employee_number'
  | 'department'
  | 'position'
  | 'location'
  | 'role'
  | 'start_date'
  | 'is_active'
  | 'employment_type'
  | 'weekly_hours'
  | 'vacation_days';

interface SortControlsProps {
  currentSort: SortConfig;
  onSortChange: (config: SortConfig) => void;
}

const SORT_OPTIONS: { value: SortableColumn; label: string }[] = [
  { value: 'first_name', label: 'Vorname' },
  { value: 'last_name', label: 'Nachname' },
  { value: 'employee_number', label: 'Personalnummer' },
  { value: 'department', label: 'Abteilung' },
  { value: 'position', label: 'Position' },
  { value: 'location', label: 'Standort' },
  { value: 'role', label: 'Rolle' },
  { value: 'employment_type', label: 'Beschäftigungsart' },
  { value: 'start_date', label: 'Eintrittsdatum' },
  { value: 'weekly_hours', label: 'Wochenstunden' },
  { value: 'vacation_days', label: 'Urlaubstage' },
  { value: 'is_active', label: 'Status' },
];

export default function SortControls({ currentSort, onSortChange }: SortControlsProps) {
  const handleToggleDirection = () => {
    onSortChange({
      ...currentSort,
      direction: currentSort.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleKeyChange = (key: SortableColumn) => {
    onSortChange({
      ...currentSort,
      key
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Label className="text-sm text-gray-600 whitespace-nowrap flex items-center gap-1">
        <ArrowUpDown className="w-4 h-4" />
        Sortieren:
      </Label>
      
      <Select value={currentSort.key} onValueChange={handleKeyChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={`sort-${option.value}`} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={handleToggleDirection}
        title={currentSort.direction === 'asc' ? 'Aufsteigend' : 'Absteigend'}
      >
        {currentSort.direction === 'asc' ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
