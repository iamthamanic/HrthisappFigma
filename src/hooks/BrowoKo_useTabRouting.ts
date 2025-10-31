/**
 * @file BrowoKo_useTabRouting.ts
 * @domain BrowoKo - Tab Routing System
 * @description Automatic tab-to-route conversion hook
 * @version v4.10.16 - Dynamic tab routing system
 * 
 * Converts tab display names to URL-safe routes automatically.
 * Example: "Meine Personalakte" → "/meine-daten?tab=meinepersonalakte"
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

/**
 * Converts a tab name to a URL-safe slug
 * 
 * Examples:
 * "Meine Personalakte" → "meinepersonalakte"
 * "Meine Logs" → "meinelogs"
 * "Meine Berechtigungen" → "meineberechtigungen"
 */
export function tabNameToSlug(tabName: string): string {
  return tabName
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '') // Remove all non-alphanumeric characters
    .trim();
}

/**
 * Tab configuration interface
 */
export interface TabConfig {
  /** Internal value (used for Tabs component) */
  value: string;
  /** Display name (shown to user) */
  label: string;
  /** Icon component */
  icon?: React.ComponentType<any>;
  /** Short label for mobile */
  mobileLabel?: string;
}

/**
 * Hook for automatic tab routing
 * 
 * Usage:
 * ```tsx
 * const tabs = [
 *   { value: 'personal', label: 'Meine Personalakte', icon: User },
 *   { value: 'logs', label: 'Meine Logs', icon: Timer },
 * ];
 * 
 * const { activeTab, changeTab, getTabRoute } = useTabRouting(tabs, 'personal');
 * 
 * // In Tabs component
 * <Tabs value={activeTab} onValueChange={changeTab}>
 *   <TabsTrigger value="personal">Meine Personalakte</TabsTrigger>
 * </Tabs>
 * ```
 */
export function useTabRouting(tabs: TabConfig[], defaultTab: string) {
  const navigate = useNavigate();
  const location = useLocation();

  // Get current tab from URL query parameter
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');

  // Find active tab based on URL parameter or default
  const activeTab = useMemo(() => {
    if (tabParam) {
      // Try to find tab by slug match
      const foundTab = tabs.find(tab => tabNameToSlug(tab.label) === tabParam);
      if (foundTab) {
        return foundTab.value;
      }
      // Fallback: try to find by value match
      const foundByValue = tabs.find(tab => tab.value === tabParam);
      if (foundByValue) {
        return foundByValue.value;
      }
    }
    return defaultTab;
  }, [tabParam, tabs, defaultTab]);

  /**
   * Change the active tab and update URL
   */
  const changeTab = useCallback((newTabValue: string) => {
    const tab = tabs.find(t => t.value === newTabValue);
    if (!tab) {
      console.warn(`Tab with value "${newTabValue}" not found`);
      return;
    }

    // Generate slug from tab label
    const slug = tabNameToSlug(tab.label);

    // Update URL with new tab parameter
    const newSearchParams = new URLSearchParams(location.search);
    newSearchParams.set('tab', slug);

    navigate({
      pathname: location.pathname,
      search: `?${newSearchParams.toString()}`
    }, { replace: true }); // Use replace to avoid polluting history
  }, [tabs, navigate, location]);

  /**
   * Get the full route for a specific tab
   */
  const getTabRoute = useCallback((tabValue: string): string => {
    const tab = tabs.find(t => t.value === tabValue);
    if (!tab) {
      return location.pathname;
    }

    const slug = tabNameToSlug(tab.label);
    return `${location.pathname}?tab=${slug}`;
  }, [tabs, location.pathname]);

  /**
   * Get the slug for a specific tab
   */
  const getTabSlug = useCallback((tabValue: string): string => {
    const tab = tabs.find(t => t.value === tabValue);
    return tab ? tabNameToSlug(tab.label) : '';
  }, [tabs]);

  return {
    /** Currently active tab value */
    activeTab,
    /** Function to change tabs (automatically updates URL) */
    changeTab,
    /** Get full route for a tab */
    getTabRoute,
    /** Get slug for a tab */
    getTabSlug,
  };
}
