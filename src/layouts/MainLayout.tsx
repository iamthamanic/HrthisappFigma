import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { User, Clock, GraduationCap, Gift, FileText, LogOut, RefreshCw, Layers, UserCog } from '../components/icons/HRTHISIcons';
import { useState } from 'react';
import { useAuthStore } from '../stores/HRTHIS_authStore';
import { useLearningStore } from '../stores/HRTHIS_learningStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { useNotifications } from '../hooks/HRTHIS_useNotifications';
import { useNavRouting } from '../hooks/HRTHIS_useNavRouting';
import { NotificationBadge } from '../components/HRTHIS_NotificationBadge';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import AdminMobileMenu from '../components/AdminMobileMenu';
import Logo from '../components/Logo';
import MobileNav from '../components/MobileNav';
import { toast } from 'sonner@2.0.3';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout } = useAuthStore();
  const { loadQuizzes, loadVideos } = useLearningStore();
  const { loadAvatar, loadCoinBalance } = useGamificationStore();
  const { badgeCounts } = useNotifications(); // New notification system
  const [isReloading, setIsReloading] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  const isAdmin = profile?.role === 'HR' || profile?.role === 'ADMIN' || profile?.role === 'SUPERADMIN';
  const isExtern = profile?.role === 'EXTERN';

  const handleSmartReload = async () => {
    setIsReloading(true);
    toast.loading('Daten werden neu geladen...', { id: 'reload' });
    
    try {
      // Reload all data from Supabase
      const promises = [
        loadQuizzes(),
        loadVideos(),
      ];
      
      // Add user-specific data if logged in
      if (profile?.id) {
        promises.push(loadAvatar(profile.id));
        promises.push(loadCoinBalance(profile.id));
      }
      
      await Promise.all(promises);
      
      toast.success('✅ Daten erfolgreich aktualisiert!', { id: 'reload' });
    } catch (error) {
      console.error('Reload error:', error);
      toast.error('Fehler beim Laden der Daten', { id: 'reload' });
    } finally {
      setIsReloading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // v4.10.17: Dynamic Navigation Routing System
  // Navigation items with automatic route generation from labels
  // EXTERN role: only Dashboard, Arbeit
  // CORRECT ORDER: Dashboard, Kalender, Lernen, Benefits, Arbeit
  const allNavConfigs = [
    { label: 'Dashboard', icon: User, badge: badgeCounts.overview },
    { label: 'Kalender', icon: Clock, badge: badgeCounts.timeAndLeave, customRoute: '/calendar' }, // Keep /calendar for backward compatibility
    { label: 'Lernen', icon: GraduationCap, badge: badgeCounts.learning, customRoute: '/learning' }, // Keep /learning for backward compatibility
    { label: 'Benefits', icon: Gift, badge: badgeCounts.benefits },
    { label: 'Arbeit', icon: Layers, badge: 0 },
  ];

  // Use dynamic navigation routing hook
  const { items: processedNavItems, isActive } = useNavRouting(allNavConfigs);

  // Filter navigation based on role
  const navItems = isExtern
    ? processedNavItems.filter(item => 
        item.route === '/dashboard' || 
        item.route === '/arbeit'
      )
    : processedNavItems;

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Desktop Header - Hidden on mobile */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 hidden md:block">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Logo size="sm" showText={true} />

          {/* Navigation - v4.10.17: Dynamic Routing */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.route}
                to={item.route}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors relative ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
                <NotificationBadge count={item.badge} className="absolute -top-1 -right-1" />
              </NavLink>
            ))}
          </nav>

          {/* User Menu - Admin + Actions */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Sheet open={isAdminMenuOpen} onOpenChange={setIsAdminMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    className={`p-2 rounded-lg transition-colors ${
                      location.pathname.startsWith('/admin')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Admin Panel"
                  >
                    <UserCog className="w-5 h-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0" aria-describedby={undefined}>
                  <AdminMobileMenu onClose={() => setIsAdminMenuOpen(false)} />
                </SheetContent>
              </Sheet>
            )}
            <button
              onClick={handleSmartReload}
              disabled={isReloading}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-600 disabled:opacity-50"
              title="Daten neu laden"
            >
              <RefreshCw className={`w-5 h-5 ${isReloading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
              title="Abmelden"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Header - Only on mobile */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 md:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Logo size="sm" showText={true} />

          {/* Right Side Actions - Admin Sheet + Refresh + Logout */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Sheet open={isAdminMenuOpen} onOpenChange={setIsAdminMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    className={`p-2 rounded-lg transition-colors active:scale-95 ${
                      location.pathname.startsWith('/admin')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Admin Menü"
                  >
                    <UserCog className="w-5 h-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0" aria-describedby={undefined}>
                  <AdminMobileMenu onClose={() => setIsAdminMenuOpen(false)} />
                </SheetContent>
              </Sheet>
            )}
            <button
              onClick={handleSmartReload}
              disabled={isReloading}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-600 disabled:opacity-50 active:scale-95"
              title="Daten neu laden"
            >
              <RefreshCw className={`w-5 h-5 ${isReloading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors active:scale-95"
              title="Abmelden"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8 pt-[65px] md:pt-[73px] pb-20 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
