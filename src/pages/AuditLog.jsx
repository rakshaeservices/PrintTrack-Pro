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
            {auditLogs.map(log => (
              <tr key={log.id}>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.datetime}</td>
                <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{log.user}</td>
                <td>
                  <span className={`badge ${log.action.includes('Unlock') ? 'badge-danger' : 'badge-secondary'}`}>
                    {log.action}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{log.oldValue}</td>
                <td style={{ fontWeight: 600, color: '#fff', fontSize: '0.75rem' }}>{log.newValue}</td>
                <td><code style={{ fontSize: '0.725rem' }}>{log.ip}</code></td>
                <td style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{log.browser}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
