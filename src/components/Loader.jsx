import React from 'react';
import { useData } from '../context/DataContext';

export default function Loader() {
  const { loading, loadingMessage } = useData();

  if (!loading) return null;

  return (
    <div className="global-loader-overlay">
      <div className="spinner"></div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{loadingMessage || 'Processing Server Action...'}</p>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Please wait, do not close or double click</span>
      </div>
    </div>
  );
}
