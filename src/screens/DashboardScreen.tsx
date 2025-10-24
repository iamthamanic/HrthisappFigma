/**
 * @file DashboardScreen.tsx
 * @domain HR - Dashboard
 * @description Main dashboard screen (refactored - Phase 2.2 Priority 4)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/HRTHIS_authStore';
import LoadingState from '../components/LoadingState';
import { DashboardWelcomeHeader } from '../components/HRTHIS_DashboardWelcomeHeader';
import { QuickStatsGrid } from '../components/HRTHIS_QuickStatsGrid';
import { DashboardOrganigramCard } from '../components/HRTHIS_DashboardOrganigramCard';
import HRTHIS_DashboardAnnouncementCard from '../components/HRTHIS_DashboardAnnouncementCard';
import { useDashboardStats } from '../hooks/HRTHIS_useDashboardStats';
import { useDashboardOrganigram } from '../hooks/HRTHIS_useDashboardOrganigram';
import { getServices } from '../services';
import { toast } from 'sonner@2.0.3';

export default function DashboardScreen() {
  const navigate = useNavigate();
  const { profile, user } = useAuthStore();

  // Load all dashboard stats
  const stats = useDashboardStats();

  // Load organigram data
  const organigram = useDashboardOrganigram();

  // Announcement state
  const [liveAnnouncement, setLiveAnnouncement] = useState<any>(null);
  const [announcementLoading, setAnnouncementLoading] = useState(true);

  // Fetch live announcement
  useEffect(() => {
    const fetchLiveAnnouncement = async () => {
      try {
        console.log('[DashboardAnnouncements] 📢 Fetching live announcement...');
        const services = getServices();
        const announcement = await services.announcement.getLiveAnnouncement();
        console.log('[DashboardAnnouncements] ✅ Announcement fetched:', announcement);
        setLiveAnnouncement(announcement);
      } catch (error: any) {
        console.error('[DashboardAnnouncements] ❌ Error loading announcements:', error?.message || error);
        
        // If it's a "Failed to fetch" error, it means Supabase is unreachable
        if (error?.message?.includes('Failed to fetch')) {
          console.error('[DashboardAnnouncements] ⚠️ Supabase connection failed - check if project is paused or keys are correct');
        }
        
        // Don't set announcement to null, just leave it empty
        setLiveAnnouncement(null);
      } finally {
        setAnnouncementLoading(false);
      }
    };

    fetchLiveAnnouncement();
  }, []);



  if (stats.loading) {
    return <LoadingState loading={true} type="skeleton" skeletonType="dashboard" />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <DashboardWelcomeHeader
        firstName={profile?.first_name}
        lastName={profile?.last_name}
        employeeNumber={profile?.employee_number}
        profilePictureUrl={profile?.profile_picture}
      />

      {/* Quick Stats Grid */}
      <QuickStatsGrid
        remainingVacationDays={stats.remainingVacationDays}
        totalVacationDays={stats.totalVacationDays}
        usedVacationDays={stats.usedVacationDays}
        coins={stats.coins || 0}
        xpProgress={stats.xpProgress}
        currentXP={stats.currentXP}
        nextLevelXP={stats.nextLevelXP}
      />

      {/* Organigram Card */}
      <DashboardOrganigramCard
        orgNodes={organigram.orgNodes}
        orgConnections={organigram.orgConnections}
        orgLoading={organigram.orgLoading}
        isOrgExpanded={organigram.isOrgExpanded}
        hasOrgData={organigram.hasOrgData}
        userRole={profile?.role}
        onToggleExpand={() => organigram.setIsOrgExpanded(!organigram.isOrgExpanded)}
      />

      {/* Dashboard Announcement */}
      {!announcementLoading && liveAnnouncement && (
        <HRTHIS_DashboardAnnouncementCard
          announcement={liveAnnouncement}
          onVideoClick={(videoId) => navigate(`/learning/video/${videoId}`)}
          onBenefitClick={() => navigate('/benefits')}
        />
      )}
    </div>
  );
}
