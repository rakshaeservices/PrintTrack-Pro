import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Printer, 
  FileSpreadsheet, 
  Package, 
  Send, 
  Layers, 
  BarChart3, 
  History, 
  Settings,
  Boxes,
  Users,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, isMobileMenuOpen, setIsMobileMenuOpen }) {
  const { currentUser, hasPermission } = useAuth();

  const role = currentUser?.role;

  const navItems = [
    { id: 'dashboard',        label: 'Dashboard',            icon: LayoutDashboard,  roles: ['SUPERADMIN', 'DIRECTOR', 'MANAGER', 'LOCATION_ADMIN', 'STORE_OPERATOR'], perm: 'view_dashboard' },
    { id: 'users',            label: 'User Management',      icon: Users,            roles: ['SUPERADMIN'] },
    { id: 'hospitals',        label: 'Hospital Registry',    icon: Building2,        roles: ['SUPERADMIN', 'DIRECTOR'], perm: 'view_hospital_data' },
    { id: 'counters',         label: 'Counters (Printers)',  icon: Printer,          roles: ['SUPERADMIN', 'MANAGER', 'LOCATION_ADMIN'] },
    { id: 'monthly_readings', label: 'Monthly Readings',     icon: FileSpreadsheet,  roles: ['SUPERADMIN', 'MANAGER', 'LOCATION_ADMIN', 'STORE_OPERATOR'], perm: 'view_readings' },
    { id: 'stock',            label: 'Stock Ledger',         icon: Package,          roles: ['SUPERADMIN', 'MANAGER', 'LOCATION_ADMIN', 'STORE_OPERATOR'], perm: 'view_stock' },
    { id: 'issue_paper',      label: 'Issue Paper',          icon: Send,             roles: ['SUPERADMIN', 'MANAGER', 'STORE_OPERATOR'], perm: 'issue_paper' },
    { id: 'paper_types',      label: 'Paper Types',          icon: Layers,           roles: ['SUPERADMIN', 'MANAGER'] },
    { id: 'consumables',      label: 'Future Consumables',   icon: Boxes,            roles: ['SUPERADMIN', 'DIRECTOR', 'MANAGER'] },
    { id: 'reports',          label: 'Reports',              icon: BarChart3,        roles: ['SUPERADMIN', 'DIRECTOR', 'MANAGER', 'LOCATION_ADMIN'], perm: 'view_reports' },
    { id: 'audit_log',        label: 'Audit Trail',          icon: History,          roles: ['SUPERADMIN', 'DIRECTOR'] },
    { id: 'permissions',      label: 'Permissions & Access',  icon: ShieldCheck,      roles: ['SUPERADMIN'] },
    { id: 'settings',         label: 'Settings & API Config', icon: Settings,         roles: ['SUPERADMIN'] }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="sidebar-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`sidebar-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            // Check both static role matrix and dynamic hasPermission if perm defined
            const isRoleAllowed = item.roles.includes(role);
            const isPermAllowed = item.perm ? hasPermission(item.perm) : true;
            if (!isRoleAllowed || !isPermAllowed) return null;

            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--clm-radius-sm)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} color={isActive ? '#ffffff' : 'var(--text-muted)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}
