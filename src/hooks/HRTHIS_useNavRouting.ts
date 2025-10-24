/**
 * @file HRTHIS_useNavRouting.ts
 * @domain HRTHIS - Navigation Routing System
 * @description Automatic navigation-label-to-route conversion hook
 * @version v4.10.17 - Dynamic top navigation routing system
 * 
 * Converts navigation display names to URL-safe routes automatically.
 * Example: "Dashboard" → "/dashboard", "Kalender" → "/kalender"
 */

import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

/**
 * Converts a navigation label to a URL-safe route
 * 
 * Examples:
 * "Dashboard" → "/dashboard"
 * "Kalender" → "/kalender"
 * "Meine Daten" → "/meinedaten"
 * "Team Management" → "/teammanagement"
 */
export function navLabelToRoute(label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '') // Remove all non-alphanumeric characters
    .trim();
  
  return `/${slug}`;
}

/**
 * Navigation item configuration interface
 */
export interface NavItemConfig {
  /** Display label (shown to user) */
  label: string;
  /** Icon component */
  icon: React.ComponentType<any>;
  /** Badge count (optional) */
  badge?: number;
  /** Custom route override (optional - if you want to use a different route than auto-generated) */
  customRoute?: string;
  /** Short label for mobile (optional) */
  mobileLabel?: string;
  /** Hide on mobile (optional) */
  hideOnMobile?: boolean;
  /** Role restrictions (optional) */
  roles?: string[];
}

/**
 * Hook for automatic navigation routing
 * 
 * Usage:
 * ```tsx
 * const navItems = [
 *   { label: 'Dashboard', icon: User, badge: 5 },
 *   { label: 'Kalender', icon: Clock, badge: 2 },
 *   { label: 'Lernen', icon: GraduationCap },
 * ];
 * 
 * const { items, isActive } = useNavRouting(navItems);
 * 
 * // In navigation
 * {items.map((item) => (
 *   <NavLink to={item.route} className={isActive(item.route) ? 'active' : ''}>
 *     {item.label}
 *   </NavLink>
 * ))}
 * ```
 */
export function useNavRouting(navItems: NavItemConfig[]) {
  const location = useLocation();

  /**
   * Process navigation items and generate routes
   */
  const items = useMemo(() => {
    return navItems.map(item => ({
      ...item,
      route: item.customRoute || navLabelToRoute(item.label),
    }));
  }, [navItems]);

  /**
   * Check if a route is active
   */
  const isActive = (route: string): boolean => {
    return location.pathname === route || location.pathname.startsWith(route + '/');
  };

  /**
   * Get the currently active item
   */
  const activeItem = useMemo(() => {
    return items.find(item => isActive(item.route));
  }, [items, location.pathname]);

  /**
   * Filter items by role
   */
  const filterByRole = (userRole?: string) => {
    if (!userRole) return items;
    
    return items.filter(item => {
      if (!item.roles || item.roles.length === 0) return true;
      return item.roles.includes(userRole);
    });
  };

  return {
    /** Processed navigation items with routes */
    items,
    /** Check if a route is currently active */
    isActive,
    /** Currently active navigation item */
    activeItem,
    /** Filter items by user role */
    filterByRole,
  };
}

/**
 * Helper: Generate route from label (standalone utility)
 */
export const getRouteFromLabel = navLabelToRoute;
