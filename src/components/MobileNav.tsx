/**
 * ============================================
 * MOBILE NAVIGATION BAR
 * ============================================
 * Version: 4.1.0
 * Description: Bottom navigation for mobile devices
 * ============================================
 */

import { NavLink, useLocation } from 'react-router-dom';
import { User, Clock, GraduationCap, Gift, FileText, Layers } from './icons/BrowoKoIcons';
import { NotificationBadge } from './BrowoKo_NotificationBadge';
import { useNotifications } from '../hooks/BrowoKo_useNotifications';
import { useAuthStore } from '../stores/BrowoKo_authStore';

export default function MobileNav() {
  const location = useLocation();
  const { profile } = useAuthStore();
  const { badgeCounts } = useNotifications();

  const isExtern = profile?.role === 'EXTERN';

  // Navigation items for mobile - Admin is now in header as icon
  const allNavItems = [
    { path: '/dashboard', icon: User, label: 'Übersicht', badge: badgeCounts.overview },
    { path: '/calendar', icon: Clock, label: 'Kalender', badge: badgeCounts.timeAndLeave },
    { path: '/learning', icon: GraduationCap, label: 'Lernen', badge: badgeCounts.learning },
    { path: '/benefits', icon: Gift, label: 'Benefits', badge: badgeCounts.benefits },
    { path: '/arbeit', icon: Layers, label: 'Arbeit', badge: 0 },
  ];

  // Filter for EXTERN users - only 3 tabs
  const navItems = isExtern
    ? [
        { path: '/dashboard', icon: User, label: 'Übersicht', badge: badgeCounts.overview },
        { path: '/arbeit', icon: Layers, label: 'Arbeit', badge: 0 },
        { path: '/documents', icon: FileText, label: 'Docs', badge: badgeCounts.documents },
      ]
    : allNavItems;

  // Use navItems directly (no more admin logic here)
  const finalItems = navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16">
        {finalItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              <div className="relative">
                <item.icon className="w-6 h-6" />
                {item.badge > 0 && (
                  <NotificationBadge 
                    count={item.badge} 
                    className="absolute -top-2 -right-2" 
                  />
                )}
              </div>
              <span className="text-xs mt-1">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
