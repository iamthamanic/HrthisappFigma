/**
 * @file BrowoKo_useAdminMenuRouting.ts
 * @domain BrowoKo - Admin Menu Dynamic Routing System
 * @description Automatic admin-menu-label-to-route conversion hook
 * @version v4.10.18 - Dynamic admin menu routing system
 * 
 * Converts admin menu display names to URL-safe routes automatically.
 * Example: "Team und Mitarbeiterverwaltung" → "/admin/team-und-mitarbeiterverwaltung"
 * 
 * WICHTIG: Dieser Hook sorgt dafür, dass neue Admin-Menu-Tabs automatisch
 * die passenden Routen generieren, ohne dass manuell Routen konfiguriert werden müssen.
 */

import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

/**
 * Converts an admin menu label to a URL-safe route
 * 
 * Examples:
 * "Team und Mitarbeiterverwaltung" → "/admin/team-und-mitarbeiterverwaltung"
 * "Organigram Unified (NEU!)" → "/admin/organigram-unified"
 * "Dashboard-Mitteilungen" → "/admin/dashboard-mitteilungen"
 * "Firmeneinstellungen" → "/admin/firmeneinstellungen"
 */
export function adminMenuLabelToRoute(label: string): string {
  // Remove special markers like "(NEU!)" or "(alt)"
  const cleanLabel = label
    .replace(/\s*\([^)]*\)\s*/g, '') // Remove anything in parentheses
    .trim();
  
  const slug = cleanLabel
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]+/g, '') // Remove all non-alphanumeric except hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .trim();
  
  return `/admin/${slug}`;
}

/**
 * Admin menu item configuration interface
 */
export interface AdminMenuItemConfig {
  /** Display label (shown to user) */
  label: string;
  /** Icon component */
  icon: React.ComponentType<any>;
  /** Description (optional) */
  description?: string;
  /** Custom route override (optional - if you want to use a different route than auto-generated) */
  customRoute?: string;
  /** Legacy route support (optional - for backward compatibility) */
  legacyRoute?: string;
  /** Hide item (optional) */
  hidden?: boolean;
  /** Role restrictions (optional) */
  roles?: string[];
}

/**
 * Hook for automatic admin menu routing
 * 
 * Usage:
 * ```tsx
 * const adminMenuItems = [
 *   { 
 *     label: 'Team und Mitarbeiterverwaltung', 
 *     icon: Users, 
 *     description: 'Mitarbeiter verwalten'
 *   },
 *   { 
 *     label: 'Organigram Unified (NEU!)', 
 *     icon: Network, 
 *     description: 'Canvas + Firmeneinstellungen' 
 *   },
 * ];
 * 
 * const { items, isActive } = useAdminMenuRouting(adminMenuItems);
 * 
 * // In navigation
 * {items.map((item) => (
 *   <NavLink to={item.route} className={isActive(item.route) ? 'active' : ''}>
 *     {item.label}
 *   </NavLink>
 * ))}
 * ```
 */
export function useAdminMenuRouting(menuItems: AdminMenuItemConfig[]) {
  const location = useLocation();

  /**
   * Process menu items and generate routes
   */
  const items = useMemo(() => {
    return menuItems
      .filter(item => !item.hidden)
      .map(item => ({
        ...item,
        route: item.customRoute || item.legacyRoute || adminMenuLabelToRoute(item.label),
      }));
  }, [menuItems]);

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
    /** Processed menu items with routes */
    items,
    /** Check if a route is currently active */
    isActive,
    /** Currently active menu item */
    activeItem,
    /** Filter items by user role */
    filterByRole,
  };
}

/**
 * Helper: Generate admin route from label (standalone utility)
 */
export const getAdminRouteFromLabel = adminMenuLabelToRoute;

/**
 * ROUTE MAPPING TABLE
 * ===================
 * This table shows the automatic route generation from labels:
 * 
 * Label                                    → Route
 * ---------------------------------------- → ------------------------------------------
 * "Team und Mitarbeiterverwaltung"        → "/admin/team-und-mitarbeiterverwaltung"
 * "Organigram Unified (NEU!)"              → "/admin/organigram-unified"
 * "Organigram Canvas"                      → "/admin/organigram-canvas"
 * "Firmeneinstellungen"                    → "/admin/firmeneinstellungen"
 * "Fieldverwaltung"                        → "/admin/fieldverwaltung"
 * "Equipment Verwaltung"                   → "/admin/equipment-verwaltung"
 * "Benefitsverwaltung"                     → "/admin/benefitsverwaltung"
 * "Dashboard-Mitteilungen"                 → "/admin/dashboard-mitteilungen"
 * "Lernverwaltung"                         → "/admin/lernverwaltung"
 */
