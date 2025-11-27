import { NavLink } from 'react-router-dom';
import { SheetTitle } from './ui/sheet';
import { 
  Users, 
  Network,
  Building2,
  MapPin,
  Gift,
  Megaphone,
  GraduationCap,
  Package,
  Activity
} from './icons/BrowoKoIcons';
import { Zap, Workflow } from 'lucide-react';
import { useAdminMenuRouting } from '../hooks/BrowoKo_useAdminMenuRouting';

interface AdminMobileMenuProps {
  onClose: () => void;
}

export default function AdminMobileMenu({ onClose }: AdminMobileMenuProps) {
  // Admin Menu Items Configuration (v4.10.18 - Dynamic Routing)
  const adminMenuConfig = [
    { 
      label: 'Team und Mitarbeiterverwaltung', 
      icon: Users, 
      description: 'Mitarbeiter verwalten'
    },
    { 
      label: 'Organigram Unified (NEU!)', 
      icon: Network, 
      description: 'Canvas + Firmeneinstellungen',
      customRoute: '/admin/organigram-unified'
    },
    { 
      label: 'Organigram Canvas', 
      icon: Network, 
      description: 'Canvas Editor (alt)',
      customRoute: '/admin/organigram-canvas'
    },
    { 
      label: 'Firmeneinstellungen', 
      icon: Building2, 
      description: 'Firma konfigurieren (alt)',
      customRoute: '/admin/company-settings'
    },
    { 
      label: 'Fieldverwaltung', 
      icon: MapPin, 
      description: 'Field-Mitarbeiter (EXTERN)',
      customRoute: '/admin/field-management'
    },
    { 
      label: 'Equipment Verwaltung', 
      icon: Package, 
      description: 'Equipment-Items verwalten',
      customRoute: '/admin/equipment-management'
    },
    { 
      label: 'Benefitsverwaltung', 
      icon: Gift, 
      description: 'Benefits verwalten',
      customRoute: '/admin/benefits-management'
    },
    { 
      label: 'Dashboard-Mitteilungen', 
      icon: Megaphone, 
      description: 'Mitteilungen erstellen',
      customRoute: '/admin/dashboard-announcements'
    },
    { 
      label: 'Lernverwaltung', 
      icon: GraduationCap, 
      description: 'Videos, Tests & Lerneinheiten',
      customRoute: '/admin/learning-management'
    },
    { 
      label: 'Workflows', 
      icon: Workflow, 
      description: 'Onboarding & Prozesse',
      customRoute: '/admin/workflows'
    },
    { 
      label: 'Automationenverwaltung', 
      icon: Zap, 
      description: 'n8n API Keys & Monitoring',
      customRoute: '/admin/automationenverwaltung'
    },
    { 
      label: 'System Health (NEU!)', 
      icon: Activity, 
      description: '14 Edge Functions Monitoring',
      customRoute: '/admin/system-health'
    },
  ];

  // Use dynamic routing hook
  const { items: adminNavItems, isActive } = useAdminMenuRouting(adminMenuConfig);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <SheetTitle className="text-lg font-semibold text-gray-900">Admin Panel</SheetTitle>
        <p className="text-sm text-gray-500 mt-1">Verwaltung & Einstellungen</p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-3">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.route}
              to={item.route}
              onClick={onClose}
              className={
                `flex items-start gap-4 px-4 py-3 rounded-lg transition-colors touch-target ${
                  isActive(item.route)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
              </div>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Browo Koordinator Admin Panel v4.11.0
        </p>
      </div>
    </div>
  );
}
