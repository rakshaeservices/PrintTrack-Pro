import React from 'react';
import { Printer, ShieldCheck } from 'lucide-react';

export default function InitialLoadingScreen() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#0f172a',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.25rem',
      color: '#ffffff'
    }}>
      
      {/* Brand Icon Glow */}
      <div style={{
        background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
        padding: '1.2rem',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(37, 99, 235, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'pulse 1.5s infinite ease-in-out'
      }}>
        <Printer size={42} color="#ffffff" />
      </div>

      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
          PrintTrack <span style={{ color: '#38bdf8' }}>PRO</span>
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
          Enterprise Hospital Asset & Consumables Platform
        </p>
      </div>

      {/* Loading Spinner & Status */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(255, 255, 255, 0.1)',
          borderLeftColor: '#38bdf8',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 500 }}>
          Initializing Security & RBAC Environment...
        </span>
      </div>

      <div style={{ position: 'absolute', bottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.7rem' }}>
        <ShieldCheck size={14} color="#10b981" />
        <span>100% Secure Google Identity & Sheets Infrastructure</span>
      </div>

    </div>
  );
}
