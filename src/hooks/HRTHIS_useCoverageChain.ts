/**
 * @file HRTHIS_useCoverageChain.ts
 * @domain HRTHIS - Coverage Chain
 * @description Calculates coverage chain for users from organigram
 * @created Phase 3D - Hooks Migration
 */

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { User } from '../types/database';

interface CoverageChain {
  primary: User | null;
  backup: User | null;
  departments: string[];
  loading: boolean;
}

export function useCoverageChain(userId: string): CoverageChain {
  const [primary, setPrimary] = useState<User | null>(null);
  const [backup, setBackup] = useState<User | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadCoverageChain = async () => {
      try {
        setLoading(true);

        // Get departments where user is primary_user_id
        const { data: userDepartments } = await supabase
          .from('departments')
          .select('id, name, backup_user_id')
          .eq('primary_user_id', userId)
          .eq('is_active', true)
          .order('sort_order');

        if (!userDepartments || userDepartments.length === 0) {
          setDepartments([]);
          setPrimary(null);
          setBackup(null);
          setLoading(false);
          return;
        }

        // Extract department names
        setDepartments(userDepartments.map(d => d.name));

        // Get backup user IDs
        const primaryBackupId = userDepartments[0]?.backup_user_id;
        const secondaryBackupId = userDepartments[1]?.backup_user_id;

        const backupIds = [primaryBackupId, secondaryBackupId].filter(Boolean);

        if (backupIds.length === 0) {
          setPrimary(null);
          setBackup(null);
          setLoading(false);
          return;
        }

        // Fetch backup users
        const { data: backupUsers } = await supabase
          .from('users')
          .select('*')
          .in('id', backupIds)
          .eq('is_active', true);

        if (backupUsers && backupUsers.length > 0) {
          // Find primary and backup
          const primaryUser = backupUsers.find(u => u.id === primaryBackupId);
          const backupUser = backupUsers.find(u => u.id === secondaryBackupId);

          setPrimary(primaryUser || null);
          setBackup(backupUser || null);
        }
      } catch (error) {
        console.error('Error loading coverage chain:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCoverageChain();
  }, [userId]);

  return {
    primary,
    backup,
    departments,
    loading
  };
}
