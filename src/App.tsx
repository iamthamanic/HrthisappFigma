import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { Toaster } from 'sonner@2.0.3';
import { useAuthStore } from './stores/BrowoKo_authStore';
import { applySecurityHeaders } from './utils/security/BrowoKo_securityHeaders';
import './utils/supabase/diagnostics'; // Auto-run diagnostics in dev mode
import Login from './components/Login';
import Register from './components/Register';
import ResetPassword from './components/ResetPassword';
import ForgotPassword from './components/ForgotPassword';
import TestEdgeFunctionCORS from './components/TestEdgeFunctionCORS';
import SupabaseConnectionTest from './components/SupabaseConnectionTest';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import LoadingState from './components/LoadingState';
import ErrorBoundary from './components/ErrorBoundary';
import ConnectionError from './components/ConnectionError';
import DebugVersionChecker from './components/DebugVersionChecker';
import { BrowoKo_MigrationWarning } from './components/BrowoKo_MigrationWarning';

// Lazy load screens for better performance
const DashboardScreen = lazy(() => import('./screens/DashboardScreen'));
const CalendarScreen = lazy(() => import('./screens/CalendarScreen'));
const LearningScreen = lazy(() => import('./screens/LearningScreen'));
const VideoDetailScreen = lazy(() => import('./screens/VideoDetailScreen'));
const QuizDetailScreen = lazy(() => import('./screens/QuizDetailScreen'));
const LearningAdminScreen = lazy(() => import('./screens/LearningAdminScreen'));
const LearningShopScreen = lazy(() => import('./screens/LearningShopScreen'));
const AchievementsScreen = lazy(() => import('./screens/AchievementsScreen'));
const AvatarScreen = lazy(() => import('./screens/AvatarScreen'));
const BenefitsScreen = lazy(() => import('./screens/BenefitsScreen'));
const BenefitDetailScreen = lazy(() => import('./screens/BenefitDetailScreen'));
const DocumentsScreen = lazy(() => import('./screens/DocumentsScreen'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));
const OrganigramViewScreen = lazy(() => import('./screens/OrganigramViewScreen'));
const FieldScreen = lazy(() => import('./screens/FieldScreen'));
const ChatScreen = lazy(() => import('./screens/ChatScreen'));
const TasksScreen = lazy(() => import('./screens/TasksScreen'));

// Admin Screens
const TeamUndMitarbeiterverwaltung = lazy(() => import('./screens/admin/TeamUndMitarbeiterverwaltung'));
const AddEmployeeScreen = lazy(() => import('./screens/admin/AddEmployeeScreen'));
const AddEmployeeWizardScreen = lazy(() => import('./screens/admin/AddEmployeeWizardScreen'));
const TeamMemberDetailsScreen = lazy(() => import('./screens/admin/TeamMemberDetailsScreen'));
const OrganigramCanvasScreen = lazy(() => import('./screens/admin/OrganigramCanvasScreenV2'));
const OrganigramUnifiedScreen = lazy(() => import('./screens/admin/OrganigramUnifiedScreen'));
const CompanySettingsScreen = lazy(() => import('./screens/admin/CompanySettingsScreen'));
const FieldManagementScreen = lazy(() => import('./screens/admin/FieldManagementScreen'));
const VehicleDetailScreen = lazy(() => import('./screens/admin/VehicleDetailScreen'));
const EquipmentManagementScreen = lazy(() => import('./screens/admin/EquipmentManagementScreen'));
const ITEquipmentManagementScreen = lazy(() => import('./screens/admin/ITEquipmentManagementScreen'));
const AvatarSystemAdminScreen = lazy(() => import('./screens/admin/AvatarSystemAdminScreen'));
const BenefitsManagementScreen = lazy(() => import('./screens/admin/BenefitsManagementScreen'));
const DashboardAnnouncementsScreen = lazy(() => import('./screens/admin/DashboardAnnouncementsScreen'));
const LearningManagementScreen = lazy(() => import('./screens/admin/LearningManagementScreen'));
const TestBuilderScreen = lazy(() => import('./screens/admin/TestBuilderScreen'));
const AutomationManagementScreen = lazy(() => import('./screens/admin/AutomationManagementScreen'));
const SystemHealthScreen = lazy(() => import('./screens/admin/SystemHealthScreen'));
const WorkflowsScreen = lazy(() => import('./screens/admin/WorkflowsScreen'));
const WorkflowDetailScreen = lazy(() => import('./screens/admin/WorkflowDetailScreen'));
const EmailTemplatesScreen = lazy(() => import('./screens/admin/EmailTemplatesScreen'));

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized, connectionError } = useAuthStore();

  // Show connection error immediately if detected
  if (connectionError) {
    return <ConnectionError onRetry={() => window.location.reload()} />;
  }

  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Wird geladen...</p>
          <p className="text-xs text-gray-500 mt-2">Falls dies länger als 10 Sekunden dauert, lade die Seite neu</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Admin Route Component - Only HR, ADMIN, and SUPERADMIN have admin access
// TEAMLEAD is now only a team-specific role (team_members.role)
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile, initialized, connectionError } = useAuthStore();

  // Show connection error immediately if detected
  if (connectionError) {
    return <ConnectionError onRetry={() => window.location.reload()} />;
  }

  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Wird geladen...</p>
          <p className="text-xs text-gray-500 mt-2">Falls dies länger als 10 Sekunden dauert, lade die Seite neu</p>
        </div>
      </div>
    );
  }

  // Only ADMIN, HR, and SUPERADMIN have access to admin area
  const isAdmin = profile?.role === 'HR' || 
                  profile?.role === 'ADMIN' || 
                  profile?.role === 'SUPERADMIN';

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Version: 4.13.0 - WORKFLOW SYSTEM PHASE 2C - RESEND EMAIL + SCHEDULING! 📧⏰🚀
// Cache bust: 2025-01-28-WORKFLOW-PHASE2C
export default function App() {
  const { initialize } = useAuthStore();

  // Initialize auth and security on mount - ONLY ONCE
  useEffect(() => {
    console.log('🚀 Starting Browo Koordinator v4.13.0 - WORKFLOW SYSTEM PHASE 2C! 📧⏰🔥');
    console.log('🔥 Cache bust: 2025-01-28-WORKFLOW-PHASE2C');
    console.log('🔥 Current time:', new Date().toISOString());
    console.log('✅ v4.13.0: Workflow System Phase 2C - RESEND EMAIL + SCHEDULING!');
    console.log('📧 Resend Email Integration:');
    console.log('  • Echte Email-Versendung via Resend API');
    console.log('  • HTML + Plain Text Emails');
    console.log('  • Batch-Processing für "Alle Mitarbeiter"');
    console.log('  • Email-Tracking (Sent, Delivered, Opened, Clicked)');
    console.log('  • Webhook-Handler für Status-Updates');
    console.log('  • Fallback zu Logging (ohne API Key)');
    console.log('⏰ Scheduling System:');
    console.log('  • Delay-Node mit echtem Scheduling');
    console.log('  • Zeit-Einheiten: Minuten, Stunden, Tage, Wochen');
    console.log('  • Scheduled Executions in KV Store');
    console.log('  • Cron-Job für automatische Ausführung');
    console.log('✅ v4.12.0: Email Templates + Rich-Text Editor!');
    console.log('✅ v4.11.2: System Health Dashboard!');
    console.log('✅ v4.11.2: 14 Functions Health Check & Response Times!');
    console.log('✅ v4.11.2: Auto-Refresh alle 60 Sekunden!');
    console.log('📊 Health Dashboard Features:');
    console.log('  • Health Check für alle 14 Edge Functions');
    console.log('  • Response Time Monitoring (ms)');
    console.log('  • Error Rate Tracking');
    console.log('  • Last Check Timestamp');
    console.log('  • Auto-Refresh alle 60 Sekunden');
    console.log('  • Manual Check Button pro Function');
    console.log('  • Color-coded Status Cards');
    console.log('✅ v4.11.1: Automation Admin Panel - API Key Management!');
    console.log('✅ v4.11.1: n8n Integration mit API Keys!');
    console.log('✅ v4.11.1: RLS Policy Case-Insensitive Fix!');
    console.log('✅ v4.11.1: 14. Edge Function deployed: BrowoKoordinator-Automation!');
    console.log('🤖 Automation Features:');
    console.log('  • API Keys erstellen mit "browoko-" Prefix');
    console.log('  • API Key Stats & Nutzungsverfolgung');
    console.log('  • API Keys umbenennen & löschen');
    console.log('  • n8n Integration Guide');
    console.log('  • Secure RLS Policies (case-insensitive)');
    console.log('✅ v4.10.17: Dynamic Navigation Routing System!');
    console.log('✅ v4.10.17: useNavRouting Hook für Top Nav Bar!');
    console.log('✅ v4.10.17: Auto-Route-Generation aus Labels!');
    console.log('✅ v4.10.17: Backward-kompatibel mit Custom Routes!');
    console.log('🧭 Navigation Features:');
    console.log('  • Auto-Route-Generation: "Dashboard" → "/dashboard"');
    console.log('  • Umlaut-Behandlung: "Übersicht" → "/uebersicht"');
    console.log('  • Custom Routes für Backward Compatibility');
    console.log('  • Badge Support für Notification-Counts');
    console.log('  • Role-Based Filtering');
    console.log('  • Gleiche Logik wie Tab-Routing-System (v4.10.16)');
    console.log('📄 Implementiert in: MainLayout.tsx & AdminLayout.tsx');
    console.log('✅ NEU: Equipment Tab im VehicleDetailScreen!');
    console.log('✅ NEU: Equipment Verwaltung Screen im Admin Panel!');
    console.log('🛠️ Equipment Features:');
    console.log('  • Equipment hinzufügen Dialog (Name*, Beschreibung, Seriennummer)');
    console.log('  • Anschaffungsdatum + Nächste Wartung');
    console.log('  • Status: Aktiv/Wartung/Defekt');
    console.log('  • Bilder Upload');
    console.log('  • Equipment Cards im Vehicle Detail Tab');
    console.log('📊 Equipment Verwaltung Screen:');
    console.log('  • Übersicht ALLER Equipment-Items (alle Fahrzeuge)');
    console.log('  • Stats: Gesamt, Aktiv, Wartung, Defekt');
    console.log('  • Volltext-Suche (Name, Beschreibung, Seriennummer, Fahrzeug)');
    console.log('  • Status Filter (Alle/Aktiv/Wartung/Defekt)');
    console.log('  • Click auf Equipment → Zum Fahrzeug navigieren');
    console.log('✅ Admin Navigation: Equipment Verwaltung hinzugefügt!');
    console.log('💾 LocalStorage Storage für Prototyping!');
    console.log('✅ v4.10.16: PersonalSettings → MeineDaten umbenannt!');
    console.log('✅ v4.10.16: Dynamisches Tab-Routing System implementiert!');
    console.log('✅ v4.10.16: Tab-Namen werden automatisch zu Routen (z.B. "Meine Personalakte" → ?tab=meinepersonalakte)!');
    console.log('✅ FIXED: Alle Dokumente-Funktionen wiederhergestellt!');
    console.log('✅ FIXED: Kategorien (VERTRAG, ZERTIFIKAT, LOHN, SONSTIGES)!');
    console.log('✅ FIXED: DocumentsTabContent Component!');
    console.log('✅ FIXED: Tab Layout - keine Überlappungen!');
    console.log('✅ FIXED: Mobile 2x2 Grid, Desktop 1 Row!');
    console.log('📄 Layout perfekt! Alle Features zurück! 🎉');
    console.log('✅ v4.2.6: Field Tabs text labels!');
    console.log('✅ v4.2.5: Field Extern/Intern tabs!');
    console.log('✅ v4.2.4: Leave Requests mobile responsive!');
    console.log('⚠️ MIGRATION OPTIONAL: Run 053_notifications_system.sql for notifications');
    console.log('✅ Graceful Degradation: App works WITHOUT migration');
    console.log('🔔 Real-time Notifications (when migration run)');
    console.log('📍 Badge Counters auf jedem Navigation Item');
    console.log('✅ Fixed: "Failed to fetch" Error');
    console.log('✅ Fixed: Learning Avatar shows Profile Picture');
    console.log('👤 Avatar Widget: Profile Picture → Initialen (no gamification avatar)');
    console.log('🔒 Applying security headers...');
    applySecurityHeaders();
    console.log('🔄 Initializing auth...');
    initialize();
    
    // Register Service Worker for offline support and caching (production only)
    const isProduction = import.meta.env?.PROD ?? false;
    if ('serviceWorker' in navigator && isProduction) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);
          
          // Auto-update service worker when new version available
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 New Service Worker available - reload to update');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    } else if (!isProduction) {
      console.log('ℹ️ Service Worker disabled in development mode');
    }
  }, [initialize]);

  return (
    <ErrorBoundary>
      <Toaster position="top-right" richColors />
      <DebugVersionChecker />
      <BrowoKo_MigrationWarning />
      
      <BrowserRouter>
        <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/test-cors" element={<TestEdgeFunctionCORS />} />
        <Route path="/test-connection" element={<SupabaseConnectionTest />} />

        {/* Protected Routes with Main Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={
            <Suspense fallback={<LoadingState loading={true} type="skeleton" skeletonType="dashboard" />}>
              <DashboardScreen />
            </Suspense>
          } />
          <Route path="calendar" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <CalendarScreen />
            </Suspense>
          } />
          <Route path="learning" element={
            <Suspense fallback={<LoadingState loading={true} type="skeleton" skeletonType="card" />}>
              <LearningScreen />
            </Suspense>
          } />
          <Route path="learning/video/:videoId" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <VideoDetailScreen />
            </Suspense>
          } />
          <Route path="learning/quiz/:quizId" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <QuizDetailScreen />
            </Suspense>
          } />
          <Route path="learning/admin" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <LearningAdminScreen />
            </Suspense>
          } />
          <Route path="learning/shop" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <LearningShopScreen />
            </Suspense>
          } />
          <Route path="achievements" element={
            <Suspense fallback={<LoadingState loading={true} type="skeleton" skeletonType="card" />}>
              <AchievementsScreen />
            </Suspense>
          } />
          <Route path="tasks" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <TasksScreen />
            </Suspense>
          } />
          <Route path="avatar" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <AvatarScreen />
            </Suspense>
          } />
          <Route path="benefits" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <BenefitsScreen />
            </Suspense>
          } />
          <Route path="benefits/:benefitId" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <BenefitDetailScreen />
            </Suspense>
          } />
          {/* Redirect /documents to /settings (Tab: Dokumente) - v4.4.1 */}
          <Route path="documents" element={<Navigate to="/settings" replace />} />
          <Route path="settings" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <SettingsScreen />
            </Suspense>
          } />
          <Route path="organigram" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <OrganigramViewScreen />
            </Suspense>
          } />
          <Route path="arbeit" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <FieldScreen />
            </Suspense>
          } />
          <Route path="chat" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <ChatScreen />
            </Suspense>
          } />
        </Route>

        {/* Admin Routes with Admin Layout */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/team-und-mitarbeiterverwaltung" replace />} />
          
          {/* v4.10.18: Team und Mitarbeiterverwaltung - New Dynamic Route */}
          <Route path="team-und-mitarbeiterverwaltung" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <TeamUndMitarbeiterverwaltung />
            </Suspense>
          } />
          <Route path="team-und-mitarbeiterverwaltung/add-employee" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <AddEmployeeScreen />
            </Suspense>
          } />
          <Route path="team-und-mitarbeiterverwaltung/add-employee-wizard" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <AddEmployeeWizardScreen />
            </Suspense>
          } />
          <Route path="team-und-mitarbeiterverwaltung/user/:userId" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <TeamMemberDetailsScreen />
            </Suspense>
          } />
          
          {/* LEGACY REDIRECTS: Old routes redirect to new routes for backward compatibility */}
          <Route path="team-management" element={<Navigate to="/admin/team-und-mitarbeiterverwaltung" replace />} />
          <Route path="team-management/add-employee" element={<Navigate to="/admin/team-und-mitarbeiterverwaltung/add-employee" replace />} />
          <Route path="team-management/user/:userId" element={<Navigate to="/admin/team-und-mitarbeiterverwaltung/user/:userId" replace />} />
          {/* NEW v4.3.0: Unified Organigram Screen (Canvas + Settings) */}
          <Route path="organigram-unified" element={
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Lade Unified Organigram...</p>
                </div>
              </div>
            }>
              <OrganigramUnifiedScreen />
            </Suspense>
          } />
          {/* OLD: Canvas Organigram (kept as backup) */}
          <Route path="organigram-canvas" element={
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Lade Canvas Organigram...</p>
                </div>
              </div>
            }>
              <OrganigramCanvasScreen />
            </Suspense>
          } />
          {/* OLD: Company Settings (kept as backup) */}
          <Route path="company-settings" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <CompanySettingsScreen />
            </Suspense>
          } />
          {/* NEW v4.3.1: Field Management Screen */}
          <Route path="field-management" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <FieldManagementScreen />
            </Suspense>
          } />
          {/* NEW v4.5.3: Vehicle Detail Screen */}
          <Route path="vehicle/:vehicleId" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <VehicleDetailScreen />
            </Suspense>
          } />
          {/* NEW v4.5.9: Equipment Management Screen */}
          <Route path="equipment-management" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <EquipmentManagementScreen />
            </Suspense>
          } />
          {/* NEW: IT Equipment Management Screen */}
          <Route path="it-equipment-management" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <ITEquipmentManagementScreen />
            </Suspense>
          } />
          <Route path="avatar-management" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <AvatarSystemAdminScreen />
            </Suspense>
          } />
          <Route path="benefits-management" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <BenefitsManagementScreen />
            </Suspense>
          } />
          {/* Redirect old dashboard-info to new dashboard-announcements */}
          <Route path="dashboard-info" element={<Navigate to="/admin/dashboard-announcements" replace />} />
          <Route path="dashboard-announcements" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <DashboardAnnouncementsScreen />
            </Suspense>
          } />
          {/* NEW v4.4.0: Learning Management Screen */}
          <Route path="learning-management" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <LearningManagementScreen />
            </Suspense>
          } />
          {/* NEW v4.13.2: Test Builder Screen */}
          <Route path="lernen/test-builder/:testId" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <TestBuilderScreen />
            </Suspense>
          } />
          {/* NEW v4.11.0: Automationenverwaltung (n8n Integration) */}
          <Route path="automationenverwaltung" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <AutomationManagementScreen />
            </Suspense>
          } />
          {/* NEW v4.11.2: System Health Dashboard (Edge Functions Monitoring) */}
          <Route path="system-health" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <SystemHealthScreen />
            </Suspense>
          } />
          {/* NEW: Workflows System */}
          <Route path="workflows" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <WorkflowsScreen />
            </Suspense>
          } />
          <Route path="workflows/builder/:workflowId" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <WorkflowDetailScreen />
            </Suspense>
          } />
          {/* NEW: Email Templates System */}
          <Route path="email-templates" element={
            <Suspense fallback={<LoadingState loading={true} type="spinner" />}>
              <EmailTemplatesScreen />
            </Suspense>
          } />
        </Route>

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}