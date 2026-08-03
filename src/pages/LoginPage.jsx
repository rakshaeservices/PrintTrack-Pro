import React, { useState } from 'react';
import { Printer, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { loginWithFirebaseGoogle, loginWithEmailDirect, authError } = useAuth();
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Primary Action: Actual Firebase Google Sign-In OAuth Popup
  const handleFirebasePopup = async () => {
    setIsSigningIn(true);
    setErrorMsg('');
    try {
      await loginWithFirebaseGoogle();
    } catch (err) {
      console.log("Firebase popup fallback:", err);
      if (err.message && err.message.includes('api-key-not-valid')) {
        setErrorMsg('Firebase Web API key is not configured in .env. Please fill your email below to log in directly.');
      } else {
        setErrorMsg(err.message || 'Firebase OAuth popup closed or blocked.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // 2. Secondary Action: Direct Email Login Fallback
  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!customEmail) return;
    setIsSigningIn(true);
    loginWithEmailDirect(customEmail, customName);
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
        maxWidth: '400px',
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '2rem 1.75rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>
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

        {(errorMsg || authError) && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            padding: '0.6rem 0.75rem',
            color: '#f87171',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg || authError}</span>
          </div>
        )}

        {/* 1. Actual Firebase Google OAuth Popup Button */}
        <button
          onClick={handleFirebasePopup}
          disabled={isSigningIn}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            boxShadow: '0 4px 12px rgba(255,255,255,0.25)',
            transition: 'all 0.15s ease'
          }}
        >
          {/* Google G Logo */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{isSigningIn ? 'Opening Firebase Google Popup...' : 'Sign in with Google (Firebase Auth)'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }} />
          <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>or sign in with email</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }} />
        </div>

        {/* 2. Direct Authorized Email Sign-In Form */}
        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label style={{ fontSize: '0.725rem', color: '#94a3b8', marginBottom: '0.35rem', display: 'block', fontWeight: 500 }}>
              Authorized Google Email
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
              placeholder="Enter your name"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              style={{ padding: '0.55rem 0.75rem' }}
            />
          </div>

          <button
            type="submit"
            disabled={isSigningIn}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.55rem', marginTop: '0.25rem' }}
          >
            Continue with Email
          </button>
        </form>

      </div>

    </div>
  );
}
