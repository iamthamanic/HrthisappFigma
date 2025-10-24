/**
 * @file HRTHIS_useOrganigramUserInfo.ts
 * @domain HRTHIS - Organigram User Info
 * @description Fetches user information from organigram/departments
 * @created Phase 3D - Hooks Migration
 */

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { Department, User } from '../types/database';

interface OrganigramUserInfo {
  departments: Department[];
  coverageFor: Department[];
  position: string | null;
  primaryBackup: User | null;
  secondaryBackup: User | null;
  loading: boolean;
}

export function useOrganigramUserInfo(userId: string): OrganigramUserInfo {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [coverageFor, setCoverageFor] = useState<Department[]>([]);
  const [position, setPosition] = useState<string | null>(null);
  const [primaryBackup, setPrimaryBackup] = useState<User | null>(null);
  const [secondaryBackup, setSecondaryBackup] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadUserInfo = async () => {
      try {
        setLoading(true);

        // 1. Get user position
        const { data: user } = await supabase
          .from('users')
          .select('position')
          .eq('id', userId)
          .single();

        if (user) {
          setPosition(user.position);
        }

        // 2. Get departments where user is primary or backup
        const { data: userDepartments } = await supabase
          .from('departments')
          .select('*')
          .or(`primary_user_id.eq.${userId},backup_user_id.eq.${userId}`)
          .eq('is_active', true)
          .order('sort_order');

        setDepartments(userDepartments || []);

        // 3. Get departments where this user provides coverage
        // (departments where user is listed as primary_user_id or backup_user_id)
        setCoverageFor(userDepartments || []);

        // 4. Get backup users from first department
        if (userDepartments && userDepartments.length > 0) {
          const firstDept = userDepartments[0];
          const backupIds = [
            firstDept.backup_user_id,
            userDepartments[1]?.backup_user_id // Secondary backup from 2nd department
          ].filter(Boolean);

          if (backupIds.length > 0) {
            const { data: backupUsers } = await supabase
              .from('users')
              .select('*')
              .in('id', backupIds)
              .eq('is_active', true);

            if (backupUsers && backupUsers.length > 0) {
              setPrimaryBackup(backupUsers[0] || null);
              setSecondaryBackup(backupUsers[1] || null);
            }
          }
        }
      } catch (error) {
        console.error('Error loading organigram user info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserInfo();
  }, [userId]);

  return {
    departments,
    coverageFor,
    position,
    primaryBackup,
    secondaryBackup,
    loading
  };
}
