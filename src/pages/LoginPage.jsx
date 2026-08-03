import React, { useState } from 'react';
import { Printer, Shield, CheckCircle2, ArrowRight, Lock, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { loginWithGoogle, mockUsers } = useAuth();
  const [customEmail, setCustomEmail] = useState('softtech.lovejeet@gmail.com');
  const [customName, setCustomName] = useState('Lovejeet (Super Admin)');
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSubmit = (e) => {
    e.preventDefault();
    if (!customEmail) return;
    setIsSigningIn(true);
    loginWithGoogle(customEmail, customName);
  };

  const handleQuickDemoLogin = (user) => {
    setIsSigningIn(true);
    loginWithGoogle(user.email, user.name);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative'
    }}>
      
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '1.75rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        
        {/* Brand Header */}
        <div style={{ textAlignment: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
            padding: '0.75rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
          }}>
            <Printer size={28} color="#ffffff" />
          </div>
          
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginTop: '0.25rem' }}>
            PrintTrack <span style={{ color: '#38bdf8' }}>PRO</span>
          </h1>
          <p style={{ fontSize: '0.775rem', color: '#94a3b8', textAlign: 'center' }}>
            Enterprise Asset & Consumables Management System
          </p>
        </div>

        {/* Google Identity Sign-In Form */}
        <form onSubmit={handleGoogleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label style={{ fontSize: '0.725rem', color: '#94a3b8', marginBottom: '0.35rem', display: 'block', fontWeight: 500 }}>
              Google Account Email Address
            </label>
            <input
              type="email"
              required
              className="form-control"
              placeholder="e.g. softtech.lovejeet@gmail.com"
              value={customEmail}
              onChange={e => setCustomEmail(e.target.value)}
              style={{ padding: '0.55rem 0.75rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.725rem', color: '#94a3b8', marginBottom: '0.35rem', display: 'block', fontWeight: 500 }}>
              Full Name (Optional)
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Lovejeet Singh"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              style={{ padding: '0.55rem 0.75rem' }}
            />
          </div>

          <button
            type="submit"
            disabled={isSigningIn}
            style={{
              width: '100%',
              padding: '0.65rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '0.35rem',
              boxShadow: '0 2px 6px rgba(255,255,255,0.2)',
              transition: 'all 0.15s ease'
            }}
          >
            {/* Google G Logo */}
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{isSigningIn ? 'Signing in with Google Identity...' : 'Sign in with Google'}</span>
          </button>
        </form>

        {/* Quick RBAC Role Simulator Launcher */}
        <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem' }}>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, display: 'block', marginBottom: '0.6rem' }}>
            Instant RBAC Demo Accounts
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {mockUsers.map(user => (
              <button
                key={user.id}
                onClick={() => handleQuickDemoLogin(user)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0.6rem',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  textAlign: 'left'
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, display: 'block' }}>{user.name}</span>
                  <span style={{ fontSize: '0.675rem', color: '#94a3b8' }}>{user.email}</span>
                </div>
                <span className={`badge ${user.role === 'SUPERADMIN' ? 'badge-danger' : 'badge-primary'}`}>
                  {user.role}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
