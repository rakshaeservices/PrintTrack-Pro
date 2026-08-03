import React from 'react';
import { Boxes, Lock, Layers } from 'lucide-react';

export default function FutureConsumables() {
  const categories = [
    { name: 'Paper', status: 'Phase 1 Active', count: '5 Types', icon: '📄', active: true },
    { name: 'Toner Cartridges', status: 'Phase 2 Ready (Database Prepared)', count: 'Schema Ready', icon: '🖨️', active: false },
    { name: 'Drum Units', status: 'Phase 2 Ready (Database Prepared)', count: 'Schema Ready', icon: '🌀', active: false },
    { name: 'Maintenance Kits', status: 'Phase 2 Ready (Database Prepared)', count: 'Schema Ready', icon: '🛠️', active: false },
    { name: 'Fuser Units', status: 'Phase 2 Ready (Database Prepared)', count: 'Schema Ready', icon: '🔥', active: false },
    { name: 'Developer Units', status: 'Phase 2 Ready (Database Prepared)', count: 'Schema Ready', icon: '⚙️', active: false },
    { name: 'Pickup Rollers', status: 'Phase 2 Ready (Database Prepared)', count: 'Schema Ready', icon: '🔄', active: false }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Future Consumables Master Architecture</h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Keep database ready. Only Paper is active in Phase 1; schema supports instant plug-and-play expansion.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
        {categories.map((c, idx) => (
          <div key={idx} style={{
            background: 'var(--bg-card)',
            border: `1px solid ${c.active ? 'var(--primary)' : 'var(--border-color)'}`,
            borderRadius: 'var(--clm-radius-md)',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{ fontSize: '1.5rem', background: '#0f172a', padding: '0.4rem', borderRadius: 'var(--clm-radius-sm)' }}>
              {c.icon}
            </div>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: c.active ? '#fff' : 'var(--text-muted)' }}>
                {c.name}
              </h3>
              <span className={`badge ${c.active ? 'badge-success' : 'badge-secondary'}`} style={{ marginTop: '0.2rem' }}>
                {c.active ? <Layers size={10} /> : <Lock size={10} />} {c.status}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
