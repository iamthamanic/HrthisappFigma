/**
 * @file BrowoKo_DashboardWelcomeHeader.tsx
 * @domain HR - Dashboard
 * @description Welcome header with profile picture and user info
 * @created Phase 2.2 - Priority 4 Refactoring
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from './icons/BrowoKoIcons';
import { Button } from './ui/button';
import { supabase } from '../utils/supabase/client';

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

  // Get the proper profile picture URL
  const processedProfilePictureUrl = useMemo(() => {
    if (!profilePictureUrl) return undefined;

    // If it's already a full URL (starts with http:// or https://), use it as-is
    if (profilePictureUrl.startsWith('http://') || profilePictureUrl.startsWith('https://')) {
      return profilePictureUrl;
    }

    // If it's a Base64 string (starts with data:), use it as-is
    if (profilePictureUrl.startsWith('data:')) {
      return profilePictureUrl;
    }

    // Otherwise, it's a storage path - convert to public URL
    try {
      const { data } = supabase.storage
        .from('make-f659121d-profile-pictures')
        .getPublicUrl(profilePictureUrl);
      
      return data.publicUrl;
    } catch (error) {
      console.warn('Failed to get public URL for profile picture:', error);
      return undefined;
    }
  }, [profilePictureUrl]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Profile Picture */}
        <div className="relative">
          {processedProfilePictureUrl ? (
            <img
              src={processedProfilePictureUrl}
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
