/**
 * @file BrowoKo_useTeamMemberDetails.ts
 * @domain BrowoKo - Team Member Details
 * @description Loading team member data (learning progress, logs, teams)
 * @created Phase 3D - Hooks Migration
 */

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';
import { LearningProgress, QuizAttempt, TimeRecord, LeaveRequest } from '../types/database';

export function useTeamMemberDetails(userId: string | undefined) {
  // Learning Progress State
  const [learningProgress, setLearningProgress] = useState<LearningProgress[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Logs State
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Teams State
  const [teams, setTeams] = useState<any[]>([]);
  const [userTeams, setUserTeams] = useState<string[]>([]); // Array of team IDs user belongs to
  const [isTeamLead, setIsTeamLead] = useState<string[]>([]); // Team IDs where user is lead
  const [teamRoles, setTeamRoles] = useState<Record<string, string>>({}); // team_id -> role mapping

  // Load teams function
  const loadTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  // Load user's team assignments
  const loadUserTeams = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('team_id, is_lead, role')
        .eq('user_id', userId);

      if (error) throw error;

      const teamIds = data?.map(tm => tm.team_id) || [];
      const leadTeamIds = data?.filter(tm => tm.is_lead || tm.role === 'TEAMLEAD').map(tm => tm.team_id) || [];

      // Create role mapping
      const rolesMap: Record<string, string> = {};
      data?.forEach(tm => {
        rolesMap[tm.team_id] = tm.role || (tm.is_lead ? 'TEAMLEAD' : 'MEMBER');
      });

      setUserTeams(teamIds);
      setIsTeamLead(leadTeamIds);
      setTeamRoles(rolesMap);
    } catch (error) {
      console.error('Error loading user teams:', error);
    }
  };

  const loadLearningProgress = async () => {
    if (!userId) return;

    setLoadingProgress(true);
    try {
      // ⚡ PERFORMANCE: Spezifische Felder statt SELECT *
      const { data: progressData, error: progressError } = await supabase
        .from('learning_progress')
        .select('id, user_id, video_id, completed, watched_seconds, completed_at, created_at, last_watched_at')
        .eq('user_id', userId);

      if (progressError) throw progressError;
      setLearningProgress(progressData || []);

      // ⚡ PERFORMANCE: Spezifische Felder statt SELECT *
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('id, user_id, quiz_id, score, passed, completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (attemptsError) throw attemptsError;
      setQuizAttempts(attemptsData || []);
    } catch (error) {
      console.error('Error loading learning progress:', error);
      toast.error('Fehler beim Laden des Lernfortschritts');
    } finally {
      setLoadingProgress(false);
    }
  };

  const loadLogs = async () => {
    if (!userId) return;

    setLoadingLogs(true);
    try {
      // Load time records (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // ⚡ PERFORMANCE: Spezifische Felder statt SELECT *
      const { data: timeData, error: timeError } = await supabase
        .from('work_sessions')
        .select('id, user_id, start_time, end_time, break_minutes, notes, created_at')
        .eq('user_id', userId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (timeError) throw timeError;
      setTimeRecords(timeData || []);

      // Load leave requests (last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // ⚡ PERFORMANCE: Spezifische Felder statt SELECT *
      const { data: leaveData, error: leaveError } = await supabase
        .from('leave_requests')
        .select('id, user_id, type, start_date, end_date, total_days, status, comment, created_at')
        .eq('user_id', userId)
        .gte('start_date', ninetyDaysAgo.toISOString().split('T')[0])
        .order('start_date', { ascending: false });

      if (leaveError) throw leaveError;
      setLeaveRequests(leaveData || []);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Fehler beim Laden der Logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadTeams();
  }, []);

  // Load user-specific data when userId changes
  useEffect(() => {
    if (userId) {
      loadLearningProgress();
      loadLogs();
      loadUserTeams();
    }
  }, [userId]);

  return {
    // Learning Progress
    learningProgress,
    quizAttempts,
    loadingProgress,

    // Logs
    timeRecords,
    leaveRequests,
    loadingLogs,

    // Teams
    teams,
    userTeams,
    isTeamLead,
    teamRoles,

    // Reload functions
    loadUserTeams,
    loadTeams,
  };
}