import React from 'react';
import { History, ShieldAlert } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function AuditLog() {
  const { auditLogs } = useData();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Security Audit Trail</h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Every action stored with timestamp, user email, action, old/new value, IP address, and browser context. Nothing can be edited silently.
        </p>
      </div>

      <div className="table-responsive">
        <table className="table-compact">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>User Email</th>
              <th>Action Executed</th>
              <th>Old Value</th>
              <th>New Value</th>
              <th>IP Address</th>
              <th>Browser / Device</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                  No audit trail records found.
                </td>
              </tr>
            ) : (
              auditLogs.map((log, idx) => {
                const actionText = String(log.Action || log.action || '-');
                return (
                  <tr key={log.AuditID || log.id || idx}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.DateTime || log.datetime || '-'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{log.UserID || log.user || '-'}</td>
                    <td>
                      <span className={`badge ${actionText.includes('Unlock') ? 'badge-danger' : 'badge-secondary'}`}>
                        {actionText}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{log.OldValue || log.oldValue || '-'}</td>
                    <td style={{ fontWeight: 600, color: '#fff', fontSize: '0.75rem' }}>{log.NewValue || log.newValue || '-'}</td>
                    <td><code style={{ fontSize: '0.725rem' }}>{log.IPAddress || log.ip || '127.0.0.1'}</code></td>
                    <td style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{log.Browser || log.browser || 'PWA Web App'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
