import React from 'react';
import { LayoutDashboard, FileSpreadsheet, Send, BarChart3, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNavbar({ activeTab, setActiveTab }) {
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  const bottomItems = [
    { id: 'dashboard',        label: 'Home',      icon: LayoutDashboard,  roles: ['SUPERADMIN', 'DIRECTOR', 'MANAGER', 'LOCATION_ADMIN', 'STORE_OPERATOR'] },
    { id: 'hospitals',        label: 'Hospitals', icon: Building2,        roles: ['SUPERADMIN'] },
    { id: 'monthly_readings', label: 'Readings',  icon: FileSpreadsheet,  roles: ['SUPERADMIN', 'MANAGER', 'LOCATION_ADMIN', 'STORE_OPERATOR'] },
    { id: 'issue_paper',      label: 'Issue',     icon: Send,             roles: ['SUPERADMIN', 'MANAGER', 'STORE_OPERATOR'] },
    { id: 'reports',          label: 'Reports',   icon: BarChart3,        roles: ['SUPERADMIN', 'DIRECTOR', 'MANAGER', 'LOCATION_ADMIN'] }
  ];

  return (
    <nav className="bottom-navbar">
      {bottomItems.map(item => {
        const Icon = item.icon;
        const isAllowed = item.roles.includes(role);
        if (!isAllowed) return null;

        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} color={isActive ? 'var(--accent)' : 'var(--text-muted)'} />
            <span style={{ fontSize: '0.675rem', marginTop: '2px', color: isActive ? '#fff' : 'var(--text-muted)' }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
