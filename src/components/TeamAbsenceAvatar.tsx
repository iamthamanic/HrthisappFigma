/**
 * TeamAbsenceAvatar Component
 * 
 * Displays user avatar with red ring for absences (team calendar)
 * Shows hover card with:
 * - User name & position
 * - Departments
 * - Coverage/backup information from organigram
 * 
 * PERFORMANCE: User is passed as prop (pre-loaded by parent) instead of loading here
 */

import { User, LeaveType } from '../types/database';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { Badge } from './ui/badge';
import { useOrganigramUserInfo } from '../hooks/HRTHIS_useOrganigramUserInfo';

interface TeamAbsenceAvatarProps {
  user: User;
  leaveType?: LeaveType;
  startDate?: string;
  endDate?: string;
  size?: 'sm' | 'md' | 'lg';
  showHover?: boolean;
}

export function TeamAbsenceAvatar({ 
  user,
  leaveType,
  startDate,
  endDate,
  size = 'md',
  showHover = true 
}: TeamAbsenceAvatarProps) {
  const { departments, coverageFor, position, primaryBackup, secondaryBackup } = useOrganigramUserInfo(user.id);

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  // Initials fallback
  const initials = `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase();

  const avatarElement = (
    <div className="relative">
      {/* Red ring for absence */}
      <div className={`${sizeClasses[size]} rounded-full ring-2 ring-red-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900`}>
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={user.profile_picture || undefined} alt={`${user.first_name} ${user.last_name}`} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );

  // If hover is disabled, just return the avatar
  if (!showHover) {
    return avatarElement;
  }

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        {avatarElement}
      </HoverCardTrigger>
      <HoverCardContent side="top" className="w-80 p-4">
        <div className="space-y-3">
          {/* Header: Large Avatar + Name */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full ring-2 ring-red-500 ring-offset-2">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user.profile_picture || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                {user.first_name} {user.last_name}
              </h4>
              {position && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {position}
                </p>
              )}
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                  Abwesend
                </span>
              </div>
            </div>
          </div>

          {/* Departments */}
          {departments.length > 0 && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Abteilungen
              </p>
              <div className="flex flex-wrap gap-1.5">
                {departments.map((dept, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {dept.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Coverage Information */}
          {(primaryBackup || secondaryBackup || coverageFor.length > 0) && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Vertretung
              </p>
              <div className="space-y-2">
                {/* Primary Backup */}
                {primaryBackup && (
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={primaryBackup.profile_picture || undefined} />
                      <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs">
                        {`${primaryBackup.first_name?.charAt(0) || ''}${primaryBackup.last_name?.charAt(0) || ''}`}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {primaryBackup.first_name} {primaryBackup.last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Hauptvertretung
                      </p>
                    </div>
                  </div>
                )}

                {/* Secondary Backup */}
                {secondaryBackup && (
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={secondaryBackup.profile_picture || undefined} />
                      <AvatarFallback className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 text-xs">
                        {`${secondaryBackup.first_name?.charAt(0) || ''}${secondaryBackup.last_name?.charAt(0) || ''}`}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {secondaryBackup.first_name} {secondaryBackup.last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Backup-Vertretung
                      </p>
                    </div>
                  </div>
                )}

                {/* If no backup info available */}
                {!primaryBackup && !secondaryBackup && coverageFor.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                    Keine Vertretung im Organigram hinterlegt
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
