/**
 * useGermanHolidays Hook
 * 
 * Calculates German public holidays based on federal state (Bundesland)
 * Supports all 16 German federal states with their specific holidays
 * 
 * Federal States:
 * - BW: Baden-Württemberg
 * - BY: Bayern (Bavaria)
 * - BE: Berlin
 * - BB: Brandenburg
 * - HB: Bremen
 * - HH: Hamburg
 * - HE: Hessen (Hesse)
 * - MV: Mecklenburg-Vorpommern
 * - NI: Niedersachsen (Lower Saxony)
 * - NW: Nordrhein-Westfalen (North Rhine-Westphalia)
 * - RP: Rheinland-Pfalz (Rhineland-Palatinate)
 * - SL: Saarland
 * - SN: Sachsen (Saxony)
 * - ST: Sachsen-Anhalt (Saxony-Anhalt)
 * - SH: Schleswig-Holstein
 * - TH: Thüringen (Thuringia)
 */

import { useMemo } from 'react';

export type FederalState = 
  | 'BW' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH' | 'HE' | 'MV'
  | 'NI' | 'NW' | 'RP' | 'SL' | 'SN' | 'ST' | 'SH' | 'TH'
  | null;

export const FEDERAL_STATES = [
  { code: 'BW', name: 'Baden-Württemberg' },
  { code: 'BY', name: 'Bayern' },
  { code: 'BE', name: 'Berlin' },
  { code: 'BB', name: 'Brandenburg' },
  { code: 'HB', name: 'Bremen' },
  { code: 'HH', name: 'Hamburg' },
  { code: 'HE', name: 'Hessen' },
  { code: 'MV', name: 'Mecklenburg-Vorpommern' },
  { code: 'NI', name: 'Niedersachsen' },
  { code: 'NW', name: 'Nordrhein-Westfalen' },
  { code: 'RP', name: 'Rheinland-Pfalz' },
  { code: 'SL', name: 'Saarland' },
  { code: 'SN', name: 'Sachsen' },
  { code: 'ST', name: 'Sachsen-Anhalt' },
  { code: 'SH', name: 'Schleswig-Holstein' },
  { code: 'TH', name: 'Thüringen' },
] as const;

interface Holiday {
  date: Date;
  name: string;
  states: FederalState[];
}

/**
 * Calculate Easter Sunday using Meeus/Jones/Butcher algorithm
 */
function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}

/**
 * Get all German public holidays for a given year and federal state
 */
function getGermanHolidays(year: number, federalState?: FederalState): Holiday[] {
  const easter = calculateEaster(year);
  
  // Helper to add days to a date
  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const ALL_STATES: FederalState[] = ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'];

  const holidays: Holiday[] = [
    // Nationwide holidays
    { date: new Date(year, 0, 1), name: 'Neujahr', states: ALL_STATES },
    { date: addDays(easter, -2), name: 'Karfreitag', states: ALL_STATES },
    { date: addDays(easter, 1), name: 'Ostermontag', states: ALL_STATES },
    { date: new Date(year, 4, 1), name: 'Tag der Arbeit', states: ALL_STATES },
    { date: addDays(easter, 39), name: 'Christi Himmelfahrt', states: ALL_STATES },
    { date: addDays(easter, 50), name: 'Pfingstmontag', states: ALL_STATES },
    { date: new Date(year, 9, 3), name: 'Tag der Deutschen Einheit', states: ALL_STATES },
    { date: new Date(year, 11, 25), name: '1. Weihnachtstag', states: ALL_STATES },
    { date: new Date(year, 11, 26), name: '2. Weihnachtstag', states: ALL_STATES },

    // State-specific holidays
    { date: new Date(year, 0, 6), name: 'Heilige Drei Könige', states: ['BW', 'BY', 'ST'] },
    { date: new Date(year, 2, 8), name: 'Internationaler Frauentag', states: ['BE', 'MV'] },
    { date: addDays(easter, 60), name: 'Fronleichnam', states: ['BW', 'BY', 'HE', 'NW', 'RP', 'SL'] },
    { date: new Date(year, 7, 15), name: 'Mariä Himmelfahrt', states: ['BY', 'SL'] }, // Only in catholic regions of BY
    { date: new Date(year, 9, 31), name: 'Reformationstag', states: ['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'SH', 'TH'] },
    { date: new Date(year, 10, 1), name: 'Allerheiligen', states: ['BW', 'BY', 'NW', 'RP', 'SL'] },
    { date: new Date(year, 10, 20), name: 'Buß- und Bettag', states: ['SN'] }, // Wednesday before November 23
  ];

  // Filter by federal state if provided
  if (federalState) {
    return holidays.filter(h => h.states.includes(federalState));
  }

  return holidays;
}

export function useGermanHolidays(federalState?: FederalState) {
  const getHolidaysForYear = useMemo(() => {
    return (year: number) => getGermanHolidays(year, federalState || undefined);
  }, [federalState]);

  const isHoliday = useMemo(() => {
    return (date: Date | string): boolean => {
      const d = new Date(date);
      const year = d.getFullYear();
      const holidays = getGermanHolidays(year, federalState || undefined);
      
      return holidays.some(holiday => {
        const holidayDate = new Date(holiday.date);
        return (
          holidayDate.getFullYear() === d.getFullYear() &&
          holidayDate.getMonth() === d.getMonth() &&
          holidayDate.getDate() === d.getDate()
        );
      });
    };
  }, [federalState]);

  const getHolidayName = useMemo(() => {
    return (date: Date | string): string | null => {
      const d = new Date(date);
      const year = d.getFullYear();
      const holidays = getGermanHolidays(year, federalState || undefined);
      
      const holiday = holidays.find(h => {
        const holidayDate = new Date(h.date);
        return (
          holidayDate.getFullYear() === d.getFullYear() &&
          holidayDate.getMonth() === d.getMonth() &&
          holidayDate.getDate() === d.getDate()
        );
      });

      return holiday ? holiday.name : null;
    };
  }, [federalState]);

  return {
    getHolidaysForYear,
    isHoliday,
    getHolidayName,
    federalState,
  };
}
