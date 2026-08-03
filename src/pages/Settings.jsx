import React, { useState } from 'react';
import { Database, Key, Check, Server, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { authMode, setAuthMode } = useAuth();
  const [googleSheetId, setGoogleSheetId] = useState('1YTo31A2Uyt6RpI1fV_mgDbwbTbR2jVW3YvJLZ-kGBcA');
  const [googleSheetsApiUrl, setGoogleSheetsApiUrl] = useState(() => {
    return localStorage.getItem('pt_sheets_url') || 'https://script.google.com/macros/s/AKfycbxYOUR_DEPLOYED_ID_HERE/exec';
  });

  const saveSettings = () => {
    localStorage.setItem('pt_sheets_url', googleSheetsApiUrl);
    alert('Settings & Google Sheet Configuration Saved Successfully!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px' }}>
      
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Google Sheet & API Integration Settings</h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Configured with Google Sheet ID & adopted Google Service Account credentials from SOLAR project.
        </p>
      </div>

      {/* Target Google Sheet ID Card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--primary)', borderRadius: 'var(--clm-radius-md)', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Database size={16} color="var(--accent)" /> Target Google Sheet Database ID
          </h3>
          <span className="badge badge-success">
            <ShieldCheck size={10} /> Solar Credential Active
          </span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div>
            <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Spreadsheet ID</label>
            <input
              type="text"
              className="form-control"
              style={{ fontWeight: 600, color: 'var(--accent)' }}
              value={googleSheetId}
              onChange={e => setGoogleSheetId(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.725rem', color: 'var(--text-muted)', background: '#0f172a', padding: '0.5rem', borderRadius: 'var(--clm-radius-sm)', border: '1px solid var(--border-color)' }}>
            <div><strong>Service Account:</strong> firebase-adminsdk-fbsvc@gen-lang-client-0070625213.iam.gserviceaccount.com</div>
            <div><strong>Backend API Path:</strong> <code>api/index.php</code> (GoogleSheetsService)</div>
          </div>
        </div>
      </div>

      {/* Active API Engine Selection Card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--clm-radius-md)', padding: '1rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Server size={16} color="var(--accent)" /> Active Connection Engine Mode
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
          {[
            { id: 'SHEETS_API', title: 'Solar Service Account API', desc: 'Direct PHP GoogleSheetsService backend using adopted Solar key' },
            { id: 'GOOGLE_OAUTH', title: 'Google Apps Script REST API', desc: 'Runs on 100% Free Google Infrastructure with Sheets & Drive' },
            { id: 'FIREBASE', title: 'Firebase Realtime / Firestore API', desc: 'High-performance cloud database & auth' }
          ].map(m => (
            <div
              key={m.id}
              onClick={() => setAuthMode(m.id)}
              style={{
                background: authMode === m.id ? 'var(--primary-light)' : '#0f172a',
                border: `1px solid ${authMode === m.id ? 'var(--primary)' : 'var(--border-color)'}`,
                borderRadius: 'var(--clm-radius-sm)',
                padding: '0.75rem',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: authMode === m.id ? '#fff' : 'var(--text-muted)' }}>
                {m.title}
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Google Apps Script Web App URL Input Card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: 'var(--clm-radius-md)', padding: '1rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Key size={16} color="var(--accent)" /> Google Apps Script Deployed Web App URL
        </h3>
        <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Paste your Google Apps Script Web App URL here (e.g. <code>https://script.google.com/macros/s/AKfycbx.../exec</code>) to connect Netlify directly to your Google Sheet.
        </p>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Paste your https://script.google.com/macros/s/.../exec URL here"
            value={googleSheetsApiUrl}
            onChange={e => setGoogleSheetsApiUrl(e.target.value)}
          />
          <button className="btn btn-primary" onClick={saveSettings} style={{ whiteSpace: 'nowrap' }}>
            <Check size={14} /> Save Web App URL
          </button>
        </div>
      </div>

    </div>
  );
}
