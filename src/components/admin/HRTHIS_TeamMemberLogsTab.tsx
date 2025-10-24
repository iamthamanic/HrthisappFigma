/**
 * @file HRTHIS_TeamMemberLogsTab.tsx
 * @domain HRTHIS - Team Member Logs Tab (Admin View)
 * @description Complete audit log view for team members with collapsible categories
 * @version 2.0.0 - Integrated Universal Audit Log System
 */

import { AuditLogsView } from '../HRTHIS_AuditLogsView';

export interface TeamMemberLogsTabProps {
  userId: string;
  userName: string;
}

export function TeamMemberLogsTab({ userId, userName }: TeamMemberLogsTabProps) {
  return (
    <div className="space-y-6">
      <AuditLogsView userId={userId} userName={userName} />
    </div>
  );
}
