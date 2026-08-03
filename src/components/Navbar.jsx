import React from 'react';
import { Printer, Shield, User, Database, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const { currentUser, switchRole, mockUsers, authMode, setAuthMode } = useAuth();

  return (
    <header className="glass-header">
      <div className="container-fluid" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
        
        {/* Left: Mobile Sidebar Toggler & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Sidebar"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.25rem'
            }}
          >
            {isMobileMenuOpen ? <X size={20} color="var(--accent)" /> : <Menu size={20} color="var(--accent)" />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
              padding: '0.35rem',
              borderRadius: 'var(--clm-radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Printer size={16} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.1 }}>
                PrintTrack <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.8rem' }}>PRO</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Right: Role Switcher & Role Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', padding: '0.15rem 0.35rem', borderRadius: 'var(--clm-radius-sm)', border: '1px solid var(--border-color)' }}>
            <User size={12} color="var(--success)" style={{ marginRight: '0.2rem' }} />
            <select
              className="form-select"
              style={{ padding: '0.1rem 0.2rem', fontSize: '0.7rem', border: 'none', background: 'transparent', maxWidth: '110px' }}
              value={currentUser.id}
              onChange={(e) => switchRole(e.target.value)}
            >
              {mockUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.role}
                </option>
              ))}
            </select>
          </div>

          <span className={`badge ${currentUser.role === 'SUPERADMIN' ? 'badge-danger' : 'badge-primary'}`} style={{ fontSize: '0.675rem', padding: '0.2rem 0.4rem' }}>
            <Shield size={9} /> {currentUser.role}
          </span>
        </div>

      </div>
    </header>
  );
}
