/**
 * useBusinessDays Hook
 * 
 * Calculates business days (weekdays only) between two dates
 * Excludes weekends (Saturday & Sunday)
 * Optionally excludes German public holidays based on federal state
 */

import { useMemo } from 'react';
import { useGermanHolidays } from './useGermanHolidays';

interface UseBusinessDaysOptions {
  includeHolidays?: boolean; // If true, exclude German holidays
  federalState?: string | null; // German federal state (e.g., 'BY', 'NW', 'BE')
}

export function useBusinessDays(
  startDate: Date | string | null,
  endDate: Date | string | null,
  options: UseBusinessDaysOptions = {}
) {
  const { includeHolidays = true, federalState = null } = options;
  
  // Get German holidays for the year
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const year = start ? start.getFullYear() : new Date().getFullYear();
  
  const { getHolidaysForYear, isHoliday } = useGermanHolidays(federalState || undefined);
  const holidays = useMemo(() => 
    includeHolidays ? getHolidaysForYear(year) : [],
    [includeHolidays, year, getHolidaysForYear]
  );

  const businessDays = useMemo(() => {
    if (!start || !end) return 0;

    // Ensure start is before or equal to end
    const startTime = new Date(start);
    const endTime = new Date(end);
    
    if (startTime > endTime) return 0;

    let count = 0;
    const current = new Date(startTime);

    while (current <= endTime) {
      const dayOfWeek = current.getDay();
      
      // Check if it's a weekday (Monday = 1 to Friday = 5)
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      
      // Check if it's a holiday (if includeHolidays is true)
      const isPublicHoliday = includeHolidays && isHoliday(current);

      if (isWeekday && !isPublicHoliday) {
        count++;
      }

      // Move to next day
      current.setDate(current.getDate() + 1);
    }

    return count;
  }, [start, end, includeHolidays, holidays]);

  const calculateBusinessDays = (
    startDate: Date | string,
    endDate: Date | string,
    includeHols = includeHolidays
  ): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) return 0;

    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      const isPublicHoliday = includeHols && isHoliday(current);

      if (isWeekday && !isPublicHoliday) {
        count++;
      }

      current.setDate(current.getDate() + 1);
    }

    return count;
  };

  return {
    businessDays,
    calculateBusinessDays,
    isWeekend: (date: Date | string) => {
      const d = new Date(date);
      const day = d.getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    },
    isHoliday: includeHolidays ? isHoliday : () => false,
  };
}
