/**
 * @file HRTHIS_DashboardWelcomeHeader.tsx
 * @domain HR - Dashboard
 * @description Welcome header with profile picture and user info
 * @created Phase 2.2 - Priority 4 Refactoring
 */

import { useNavigate } from 'react-router-dom';
import { Settings } from './icons/HRTHISIcons';
import { Button } from './ui/button';

interface DashboardWelcomeHeaderProps {
  firstName?: string;
  lastName?: string;
  employeeNumber?: string;
  profilePictureUrl?: string;
}

export function DashboardWelcomeHeader({
  firstName,
  lastName,
  employeeNumber,
  profilePictureUrl,
}: DashboardWelcomeHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Profile Picture */}
        <div className="relative">
          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt={`${firstName} ${lastName}`}
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-200">
              <span className="text-white text-2xl font-semibold">
                {firstName?.[0]}{lastName?.[0]}
              </span>
            </div>
          )}
        </div>

        {/* Welcome Text */}
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Hallo, {firstName}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Personalnummer: {employeeNumber || 'N/A'}
          </p>
        </div>
      </div>

      {/* Meine Daten Button */}
      <Button
        onClick={() => navigate('/settings')}
        variant="outline"
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      >
        <Settings className="w-4 h-4" />
        Meine Daten
      </Button>
    </div>
  );
}
