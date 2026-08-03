import React from 'react';
import { LayoutDashboard, FileSpreadsheet, Send, BarChart3, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNavbar({ activeTab, setActiveTab }) {
  const { hasPermission } = useAuth();

  const bottomItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, perm: 'view_dashboard' },
    { id: 'hospitals', label: 'Hospitals', icon: Building2, perm: 'all' },
    { id: 'monthly_readings', label: 'Readings', icon: FileSpreadsheet, perm: 'view_readings' },
    { id: 'issue_paper', label: 'Issue', icon: Send, perm: 'issue_paper' },
    { id: 'reports', label: 'Reports', icon: BarChart3, perm: 'view_reports' }
  ];

  return (
    <nav className="bottom-navbar">
      {bottomItems.map(item => {
        const Icon = item.icon;
        const isAllowed = item.perm === 'all' ? true : hasPermission(item.perm);
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
