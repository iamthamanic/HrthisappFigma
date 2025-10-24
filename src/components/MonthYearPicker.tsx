import { ChevronLeft, ChevronRight, ChevronDown, RefreshCw } from './icons/HRTHISIcons';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Input } from './ui/input';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useState, useEffect } from 'react';

interface MonthYearPickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  displayYear: number;
  currentMonth: number;
  isCurrentMonth: (monthIndex: number) => boolean;
  previousYear: () => void;
  nextYear: () => void;
  setYear: (year: number) => void;
  selectMonth: (monthIndex: number) => void;
  goToToday: () => void;
  onRefresh?: () => void;
}

const MONTH_NAMES = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember'
];

export default function MonthYearPicker({
  date,
  onDateChange,
  isOpen,
  onOpenChange,
  displayYear,
  currentMonth,
  isCurrentMonth,
  previousYear,
  nextYear,
  setYear,
  selectMonth,
  goToToday,
  onRefresh
}: MonthYearPickerProps) {
  const [yearInput, setYearInput] = useState(displayYear.toString());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync year input with display year
  useEffect(() => {
    setYearInput(displayYear.toString());
  }, [displayYear]);

  const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setYearInput(value);
    }
  };

  const handleYearInputBlur = () => {
    const year = parseInt(yearInput, 10);
    if (!isNaN(year) && year >= 1900 && year <= 2100) {
      setYear(year);
    } else {
      // Reset to current year if invalid
      setYearInput(displayYear.toString());
    }
  };

  const handleYearInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleYearInputBlur();
      e.currentTarget.blur();
    }
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        // Short delay for visual feedback
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="font-semibold text-gray-900 hover:bg-gray-50 transition-colors gap-2 px-4"
        >
          {format(date, 'MMMM yyyy', { locale: de })}
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          {/* Year Navigation */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={previousYear}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Input
              type="text"
              value={yearInput}
              onChange={handleYearInputChange}
              onBlur={handleYearInputBlur}
              onKeyDown={handleYearInputKeyDown}
              className="text-center h-8 w-20 font-semibold"
              maxLength={4}
            />
            
            <Button
              variant="outline"
              size="icon"
              onClick={nextYear}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month Grid (3x4) */}
          <div className="grid grid-cols-3 gap-2">
            {MONTH_NAMES.map((monthName, index) => {
              const isSelected = index === currentMonth;
              const isCurrent = isCurrentMonth(index);
              
              return (
                <Button
                  key={monthName}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => selectMonth(index)}
                  className={`
                    h-10 relative transition-all
                    ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                    ${!isSelected && isCurrent ? 'border-blue-600 border-2 text-blue-600 font-semibold' : ''}
                    ${!isSelected && !isCurrent ? 'hover:bg-gray-100' : ''}
                  `}
                >
                  {monthName}
                  {isCurrent && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></span>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              Heute
            </Button>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="relative"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Aktualisieren
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}