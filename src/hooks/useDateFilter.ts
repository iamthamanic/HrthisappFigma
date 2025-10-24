import { useState } from 'react';

/**
 * REUSABLE DATE FILTER HOOK
 * =========================
 * Provides date filtering functionality for lists and logs
 * 
 * Usage:
 * ```tsx
 * const { filterDate, setFilterDate, formatFilterDate, filterByDate } = useDateFilter();
 * 
 * // Filter data
 * const filteredData = filterByDate(data, 'created_at');
 * 
 * // Display
 * <Button>{formatFilterDate(filterDate)}</Button>
 * ```
 * 
 * Features:
 * - Single date selection
 * - Filters from 00:00:00 to 23:59:59 of selected day
 * - Formatted display in German locale
 * - Generic type support for any data array
 * 
 * @returns {Object} Filter state and helper functions
 */

export interface UseDateFilterReturn {
  /** Currently selected filter date */
  filterDate: Date | undefined;
  /** Set the filter date */
  setFilterDate: (date: Date | undefined) => void;
  /** Format date for display (German locale) */
  formatFilterDate: (date: Date | undefined) => string;
  /** Filter array by date field */
  filterByDate: <T>(data: T[], dateField: keyof T) => T[];
}

export function useDateFilter(): UseDateFilterReturn {
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  /**
   * Format date for display
   * Returns "Datumsfilter" if no date selected
   */
  const formatFilterDate = (date: Date | undefined): string => {
    if (!date) return 'Datumsfilter';
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  /**
   * Filter array by date field
   * Filters from 00:00:00 to 23:59:59 of selected day
   * 
   * @param data - Array to filter
   * @param dateField - Name of the date field (e.g., 'created_at', 'date')
   * @returns Filtered array
   */
  const filterByDate = <T,>(data: T[], dateField: keyof T): T[] => {
    if (!filterDate) return data;

    const filterDateStart = new Date(filterDate);
    filterDateStart.setHours(0, 0, 0, 0);
    
    const filterDateEnd = new Date(filterDate);
    filterDateEnd.setHours(23, 59, 59, 999);

    return data.filter((item) => {
      const itemDateValue = item[dateField];
      if (!itemDateValue) return false;
      
      const itemDate = new Date(itemDateValue as any);
      return itemDate >= filterDateStart && itemDate <= filterDateEnd;
    });
  };

  return {
    filterDate,
    setFilterDate,
    formatFilterDate,
    filterByDate,
  };
}
