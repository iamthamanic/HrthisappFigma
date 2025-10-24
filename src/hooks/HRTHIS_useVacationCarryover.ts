/**
 * @file HRTHIS_useVacationCarryover.ts
 * @domain HRTHIS - Vacation Carryover
 * @description Manages vacation carryover logic and expiry dates
 * @created Phase 3D - Hooks Migration
 */

import { useState, useEffect, useMemo } from 'react';

interface CarryoverSettings {
  enabled: boolean;
  cutoffMonth: number; // 1-12 (1 = January, 3 = March)
  cutoffDay: number;   // 1-31
}

interface VacationCarryoverData {
  currentYearDays: number;
  previousYearDays: number;
  totalAvailableDays: number;
  carryoverExpired: boolean;
  carryoverExpiryDate: Date;
  daysExpiringSoon: number;
  isBeforeCutoff: boolean;
}

const DEFAULT_SETTINGS: CarryoverSettings = {
  enabled: true,
  cutoffMonth: 3,  // March
  cutoffDay: 31,   // 31st
};

export function useVacationCarryover(
  currentYearVacationDays: number = 0,
  previousYearRemainingDays: number = 0,
  customSettings?: Partial<CarryoverSettings>
) {
  const [settings] = useState<CarryoverSettings>({
    ...DEFAULT_SETTINGS,
    ...customSettings,
  });

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  // Calculate cutoff date for current year
  const cutoffDate = useMemo(() => {
    return new Date(currentYear, settings.cutoffMonth - 1, settings.cutoffDay, 23, 59, 59);
  }, [currentYear, settings.cutoffMonth, settings.cutoffDay]);

  // Check if we're before the cutoff date
  const isBeforeCutoff = useMemo(() => {
    return settings.enabled && currentDate <= cutoffDate;
  }, [settings.enabled, currentDate, cutoffDate]);

  // Calculate carryover data
  const carryoverData: VacationCarryoverData = useMemo(() => {
    const carryoverExpired = !isBeforeCutoff;
    const availableCarryoverDays = carryoverExpired ? 0 : previousYearRemainingDays;
    const totalAvailable = currentYearVacationDays + availableCarryoverDays;

    // Calculate days expiring soon (within 30 days of cutoff)
    const daysUntilCutoff = Math.ceil((cutoffDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysExpiringSoon = isBeforeCutoff && daysUntilCutoff <= 30 ? previousYearRemainingDays : 0;

    return {
      currentYearDays: currentYearVacationDays,
      previousYearDays: availableCarryoverDays,
      totalAvailableDays: totalAvailable,
      carryoverExpired,
      carryoverExpiryDate: cutoffDate,
      daysExpiringSoon,
      isBeforeCutoff,
    };
  }, [currentYearVacationDays, previousYearRemainingDays, isBeforeCutoff, cutoffDate, currentDate]);

  // Helper to get formatted expiry date
  const getExpiryDateFormatted = (locale: string = 'de-DE'): string => {
    return cutoffDate.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Helper to get days until expiry
  const getDaysUntilExpiry = (): number | null => {
    if (!isBeforeCutoff) return null;
    return Math.ceil((cutoffDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Helper to check if specific days amount would use carryover days
  const wouldUseCarryoverDays = (requestedDays: number): boolean => {
    if (!isBeforeCutoff || previousYearRemainingDays === 0) return false;
    return requestedDays > currentYearVacationDays;
  };

  return {
    ...carryoverData,
    settings,
    getExpiryDateFormatted,
    getDaysUntilExpiry,
    wouldUseCarryoverDays,
  };
}

/**
 * Helper to update carryover settings
 * Can be used in admin settings to change cutoff date
 */
export function useCarryoverSettings() {
  const [settings, setSettings] = useState<CarryoverSettings>(DEFAULT_SETTINGS);

  const updateSettings = (newSettings: Partial<CarryoverSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSettings,
    resetToDefaults,
    defaults: DEFAULT_SETTINGS,
  };
}
