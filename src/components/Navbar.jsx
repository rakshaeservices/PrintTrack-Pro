import React from 'react';
import { Printer, Shield, User, RefreshCw, Key, Database, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { currentUser, switchRole, mockUsers, authMode, setAuthMode } = useAuth();

  return (
    <header className="glass-header">
      <div className="container-fluid" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px' }}>
        
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
            padding: '0.4rem',
            borderRadius: 'var(--clm-radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)'
          }}>
            <Printer size={18} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
              PrintTrack <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.85rem' }}>PRO</span>
            </h1>
            <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', display: 'block', marginTop: '-2px' }}>
              Enterprise Consumables Platform
            </span>
          </div>
        </div>

        {/* Top Control Toolbar & Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          
          {/* API Engine Selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-card)', padding: '0.2rem 0.5rem', borderRadius: 'var(--clm-radius-sm)', border: '1px solid var(--border-color)' }}>
            <Database size={13} color="var(--accent)" />
            <select
              className="form-select"
              style={{ padding: '0.15rem 0.35rem', fontSize: '0.725rem', border: 'none', background: 'transparent' }}
              value={authMode}
              onChange={(e) => setAuthMode(e.target.value)}
            >
              <option value="GOOGLE_OAUTH">Google Apps Script API</option>
              <option value="FIREBASE">Firebase API</option>
              <option value="SHEETS_API">Google Sheets API v4</option>
            </select>
          </div>

          {/* User Role Switcher for instant simulation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-card)', padding: '0.2rem 0.5rem', borderRadius: 'var(--clm-radius-sm)', border: '1px solid var(--border-color)' }}>
            <User size={13} color="var(--success)" />
            <select
              className="form-select"
              style={{ padding: '0.15rem 0.35rem', fontSize: '0.725rem', border: 'none', background: 'transparent', maxWidth: '160px' }}
              value={currentUser.id}
              onChange={(e) => switchRole(e.target.value)}
            >
              {mockUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <span className={`badge ${currentUser.role === 'SUPERADMIN' ? 'badge-danger' : 'badge-primary'}`}>
            <Shield size={10} /> {currentUser.role}
          </span>
        </div>

      </div>
    </header>
  );
}
