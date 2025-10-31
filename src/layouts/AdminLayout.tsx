import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  Sparkles, 
  Gift, 
  User,
  Clock,
  GraduationCap,
  FileText,
  UserCog,
  LogOut,
  RefreshCw,
  Building2,
  Network,
  MapPin,
  Megaphone,
  Package
} from '../components/icons/BrowoKoIcons';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import { useLearningStore } from '../stores/BrowoKo_learningStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { useNavRouting } from '../hooks/BrowoKo_useNavRouting';
import { useNotifications } from '../hooks/BrowoKo_useNotifications';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import AdminMobileMenu from '../components/AdminMobileMenu';
import MobileNav from '../components/MobileNav';
import Logo from '../components/Logo';
import BrowoKoChatFloatingWindow from '../components/BrowoKo_ChatFloatingWindow';
import { toast } from 'sonner@2.0.3';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout } = useAuthStore();
  const { loadQuizzes, loadVideos } = useLearningStore();
  const { loadAvatar, loadCoinBalance } = useGamificationStore();
  const { badgeCounts } = useNotifications();
  const [isReloading, setIsReloading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

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
  // Main Navigation Items - routes auto-generated from labels
  const navConfigs = [
    { label: 'Übersicht', icon: User, customRoute: '/dashboard' }, // Keep /dashboard for backward compatibility
    { label: 'Kalender', icon: Clock, customRoute: '/calendar' },
    { label: 'Lernen', icon: GraduationCap, customRoute: '/learning' },
    { label: 'Benefits', icon: Gift },
    { label: 'Dokumente', icon: FileText, customRoute: '/documents' },
  ];

  // Use dynamic navigation routing hook
  const { items: navItems } = useNavRouting(navConfigs);

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* ========================================
          DESKTOP HEADER (≥768px)
          ======================================== */}
      <header className="hidden md:block bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Logo size="sm" showText={true} />

          {/* Main Navigation - v4.10.17: Dynamic Routing */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.route}
                to={item.route}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Menu - WITH ADMIN HAMBURGER BUTTON */}
          <div className="flex items-center gap-2">
            {/* Admin Hamburger Menu on Desktop too */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <button 
                  className="p-2 rounded-lg transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100"
                  title="Admin Menü"
                >
                  <UserCog className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0" aria-describedby={undefined}>
                <AdminMobileMenu onClose={() => setIsMenuOpen(false)} />
              </SheetContent>
            </Sheet>

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

        {/* Admin Sub-Navigation - REMOVED (only Hamburger Menu now) */}
      </header>

      {/* ========================================
          MOBILE HEADER (<768px)
          ======================================== */}
      <header className="md:hidden bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 safe-area-top">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Logo size="sm" showText={true} />

          {/* Right Side Actions - Admin Sheet + Refresh + Logout */}
          <div className="flex items-center gap-2">
            {/* Admin Menu Sheet - Opens Hamburger Menu */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <button 
                  className="p-2 rounded-lg transition-colors active:scale-95 bg-blue-50 text-blue-600"
                  title="Admin Menü"
                >
                  <UserCog className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0" aria-describedby={undefined}>
                <AdminMobileMenu onClose={() => setIsMenuOpen(false)} />
              </SheetContent>
            </Sheet>

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

      {/* ========================================
          MAIN CONTENT
          ======================================== */}
      {/* Desktop: pt-24 (96px for header + spacing) */}
      {/* Mobile: pt-20 (80px) + pb-[80px] (header + bottom nav space) */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-8 pt-20 md:pt-24 pb-[80px] md:pb-8">
        <Outlet />
      </main>

      {/* ========================================
          MOBILE BOTTOM NAVIGATION (<768px)
          ======================================== */}
      <MobileNav />

      {/* Global Floating Chat Button */}
      <Button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[rgb(38,82,188)] hover:bg-purple-700 shadow-lg z-50 transition-all hover:scale-110 active:scale-95"
        size="icon"
        title={isChatOpen ? "Chat schließen" : "Chat öffnen"}
      >
        <MessageCircle className="w-6 h-6 text-white" />
        {/* Unread Badge - TODO: Replace with real unread count */}
        {badgeCounts.total > 0 && (
          <Badge className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0 border-2 border-white">
            {badgeCounts.total > 9 ? '9+' : badgeCounts.total}
          </Badge>
        )}
      </Button>

      {/* Chat Floating Window */}
      <BrowoKoChatFloatingWindow open={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
