import { useState, useEffect, useMemo } from 'react';
import type { User, Location } from '../types/database';
import type { SortConfig } from '../components/SortControls';
import sanitize from '../utils/security/BrowoKo_sanitization';

/**
 * @file BrowoKo_useEmployeeFiltering.ts
 * @domain BrowoKo - Employee Filtering
 * @description Filtering, sorting, and searching of employees with saved searches
 * @created Phase 3D - Hooks Migration
 */

export function useEmployeeFiltering(
  users: User[],
  locations: Location[],
  userTeamMemberships: Record<string, { role: string; teamName: string }[]>
) {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [teamRoleFilter, setTeamRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('teamManagement_sortConfig');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { key: 'first_name', direction: 'asc' };
      }
    }
    return { key: 'first_name', direction: 'asc' };
  });

  // Save sort config to localStorage
  useEffect(() => {
    localStorage.setItem('teamManagement_sortConfig', JSON.stringify(sortConfig));
  }, [sortConfig]);

  /**
   * Sort utility function
   */
  const sortUsers = (usersToSort: User[], config: SortConfig): User[] => {
    const sorted = [...usersToSort].sort((a, b) => {
      let aValue: any = a[config.key];
      let bValue: any = b[config.key];

      // Handle location sorting (needs lookup)
      if (config.key === 'location') {
        aValue = locations.find(l => l.id === a.location_id)?.name || '';
        bValue = locations.find(l => l.id === b.location_id)?.name || '';
      }

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      // Handle boolean sorting
      if (typeof aValue === 'boolean') {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      }

      // String comparison (case insensitive)
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = typeof bValue === 'string' ? bValue.toLowerCase() : '';
      }

      if (aValue < bValue) {
        return config.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return config.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  };

  /**
   * Comprehensive full-text search over all fields
   */
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // ✅ SANITIZE SEARCH QUERY
      const query = sanitize.searchQuery(searchQuery).toLowerCase();
      
      // Status filter
      if (statusFilter === 'active' && !user.is_active) return false;
      if (statusFilter === 'inactive' && user.is_active) return false;
      
      // Role filter (global role)
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      
      // Team Role filter
      if (teamRoleFilter !== 'all') {
        const memberships = userTeamMemberships[user.id] || [];
        if (teamRoleFilter === 'TEAMLEAD') {
          // User must be TEAMLEAD in at least one team
          if (!memberships.some(m => m.role === 'TEAMLEAD')) return false;
        } else if (teamRoleFilter === 'MEMBER') {
          // User must be MEMBER in at least one team (can also be TEAMLEAD in another)
          if (!memberships.some(m => m.role === 'MEMBER')) return false;
        } else if (teamRoleFilter === 'NONE') {
          // User is not in any team
          if (memberships.length > 0) return false;
        }
      }
      
      // Department filter
      if (departmentFilter !== 'all' && user.department !== departmentFilter) return false;
      
      // Location filter
      if (locationFilter !== 'all' && user.location_id !== locationFilter) return false;
      
      // If no search query, return based on filters only
      if (!query) return true;
      
      // Find location name for search
      const locationName = user.location_id 
        ? locations.find(l => l.id === user.location_id)?.name?.toLowerCase() || ''
        : '';
      
      // Full-text search across all relevant fields
      const searchableText = [
        // Basic Info
        user.first_name?.toLowerCase() || '',
        user.last_name?.toLowerCase() || '',
        `${user.first_name} ${user.last_name}`.toLowerCase(),
        user.email?.toLowerCase() || '',
        user.private_email?.toLowerCase() || '',
        user.employee_number?.toLowerCase() || '',
        
        // Job Details
        user.position?.toLowerCase() || '',
        user.department?.toLowerCase() || '',
        user.role?.toLowerCase() || '',
        user.employment_type?.toLowerCase() || '',
        
        // Contact
        user.phone?.toLowerCase() || '',
        
        // Location
        locationName,
        
        // Address
        user.street_address?.toLowerCase() || '',
        user.city?.toLowerCase() || '',
        user.postal_code?.toLowerCase() || '',
        
        // Work Clothing Sizes
        user.shirt_size?.toLowerCase() || '',
        user.pants_size?.toLowerCase() || '',
        user.shoe_size?.toLowerCase() || '',
        user.jacket_size?.toLowerCase() || '',
        
        // Work Details (convert to string for search)
        user.weekly_hours?.toString() || '',
        user.vacation_days?.toString() || '',
        
        // Status
        user.is_active ? 'aktiv' : 'inaktiv',
      ].join(' ');
      
      return searchableText.includes(query);
    });
  }, [users, searchQuery, statusFilter, roleFilter, teamRoleFilter, departmentFilter, locationFilter, userTeamMemberships, locations]);

  /**
   * Sort filtered users
   */
  const sortedUsers = useMemo(() => {
    return sortUsers(filteredUsers, sortConfig);
  }, [filteredUsers, sortConfig, locations]);

  /**
   * Reset all filters
   */
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setRoleFilter('all');
    setTeamRoleFilter('all');
    setDepartmentFilter('all');
    setLocationFilter('all');
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = useMemo(() => {
    return (
      statusFilter !== 'all' ||
      roleFilter !== 'all' ||
      teamRoleFilter !== 'all' ||
      departmentFilter !== 'all' ||
      locationFilter !== 'all' ||
      searchQuery.trim() !== ''
    );
  }, [searchQuery, statusFilter, roleFilter, teamRoleFilter, departmentFilter, locationFilter]);

  /**
   * Apply saved search config
   */
  const applySearchConfig = (config: any) => {
    setSearchQuery(config.searchQuery || '');
    setStatusFilter(config.statusFilter || 'all');
    setRoleFilter(config.roleFilter || 'all');
    setTeamRoleFilter(config.teamRoleFilter || 'all');
    setDepartmentFilter(config.departmentFilter || 'all');
    setLocationFilter(config.locationFilter || 'all');
    if (config.sortConfig) {
      setSortConfig(config.sortConfig);
    }
  };

  /**
   * Get current search config for saving
   */
  const getCurrentSearchConfig = () => ({
    searchQuery,
    statusFilter,
    roleFilter,
    teamRoleFilter,
    departmentFilter,
    locationFilter,
    sortConfig,
  });

  return {
    // Filter states
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    roleFilter,
    setRoleFilter,
    teamRoleFilter,
    setTeamRoleFilter,
    departmentFilter,
    setDepartmentFilter,
    locationFilter,
    setLocationFilter,
    
    // Sort state
    sortConfig,
    setSortConfig,
    
    // Derived data
    filteredUsers,
    sortedUsers,
    hasActiveFilters,
    
    // Actions
    resetFilters,
    applySearchConfig,
    getCurrentSearchConfig,
  };
}
