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
  Boxes
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { hasPermission } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'view_dashboard' },
    { id: 'hospitals', label: 'Hospitals', icon: Building2, perm: 'all' },
    { id: 'counters', label: 'Counters (Printers)', icon: Printer, perm: 'all' },
    { id: 'monthly_readings', label: 'Monthly Readings', icon: FileSpreadsheet, perm: 'view_readings' },
    { id: 'stock', label: 'Stock Ledger', icon: Package, perm: 'view_stock' },
    { id: 'issue_paper', label: 'Issue Paper', icon: Send, perm: 'issue_paper' },
    { id: 'paper_types', label: 'Paper Types', icon: Layers, perm: 'all' },
    { id: 'consumables', label: 'Future Consumables', icon: Boxes, perm: 'all' },
    { id: 'reports', label: 'Reports', icon: BarChart3, perm: 'view_reports' },
    { id: 'audit_log', label: 'Audit Trail', icon: History, perm: 'all' },
    { id: 'settings', label: 'Settings & API Config', icon: Settings, perm: 'all' }
  ];

  return (
    <aside style={{
      width: '220px',
      backgroundColor: 'var(--bg-card)',
      borderRight: '1px solid var(--border-color)',
      minHeight: 'calc(100vh - 52px)',
      padding: '0.5rem'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isAllowed = item.perm === 'all' ? true : hasPermission(item.perm);
          
          if (!isAllowed) return null;

          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 0.75rem',
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
  );
}
