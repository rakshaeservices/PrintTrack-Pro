import React from 'react';
import { 
  Building2, 
  Gauge, 
  Printer, 
  FileText, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  Lock,
  TrendingUp
} from 'lucide-react';
import { useData } from '../context/DataContext';

export default function Dashboard() {
  const { hospitals, counters, monthlyReadings, stockLedger, calculateHospitalStock } = useData();

  // BUG-06 fix: all stats computed purely from live data — no hardcoded fallbacks
  const totalHospitals = hospitals.length;
  const totalCounters  = counters.length;

  // Total pages printed this month (current calendar month)
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentMonthPrints = monthlyReadings
    .filter(r => (r.Month || r.month) === currentMonth)
    .reduce((sum, r) => sum + (r.Consumption || r.consumption || 0), 0);

  // Total paper issued from stock ledger
  const totalPaperIssuedRims = stockLedger
    .filter(l => (l.TransactionType || l.type) === 'Issued' || (l.TransactionType || l.type) === 'Issue')
    .reduce((sum, l) => sum + (Number(l.Quantity || l.qty) || 0), 0);

  // Total paper used from monthly readings
  const paperUsedRims = monthlyReadings
    .reduce((sum, r) => sum + (Number(r.PaperUsed || r.used) || 0), 0);

  // Total stock across all hospitals
  let totalStockRims = 0;
  hospitals.forEach(h => {
    const { totalStock } = calculateHospitalStock(h.HospitalID || h.id);
    totalStockRims += totalStock;
  });

  // Pending readings and low stock — pure live counts
  const pendingClosings = monthlyReadings.filter(r =>
    (r.VerificationStatus || r.verified) === 'Pending'
  ).length;

  const lowStockAlerts = hospitals.filter(h => {
    const { totalStock } = calculateHospitalStock(h.HospitalID || h.id);
    return totalStock < 50;
  }).length;

  // Monthly trend — last 3 months from real data
  const getMonthTotal = (offset) => {
    const d = new Date();
    d.setMonth(d.getMonth() - offset);
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    return {
      month: d.toLocaleString('default', { month: 'short' }),
      pages: monthlyReadings
        .filter(r => (r.Month || r.month) === label)
        .reduce((s, r) => s + (r.Consumption || r.consumption || 0), 0)
    };
  };
  const trendData = [getMonthTotal(2), getMonthTotal(1), getMonthTotal(0)];
  const maxTrend  = Math.max(...trendData.map(t => t.pages), 1);

  const statCards = [
    { title: 'Hospitals',           value: totalHospitals,                             icon: Building2,   color: '#38bdf8' },
    { title: 'Total Counters',      value: totalCounters,                               icon: Gauge,       color: '#818cf8' },
    { title: 'Total Printers',      value: totalCounters,                               icon: Printer,     color: '#a78bfa' },
    { title: 'Prints This Month',   value: currentMonthPrints.toLocaleString(),         icon: FileText,    color: '#34d399' },
    { title: 'Paper Issued',        value: `${totalPaperIssuedRims} Rims`,              icon: Package,     color: '#fbbf24' },
    { title: 'Paper Used',          value: `${paperUsedRims} Rims`,                     icon: CheckCircle2,color: '#60a5fa' },
    { title: 'Current Stock',       value: `${totalStockRims} Rims`,                    icon: Package,     color: '#10b981' },
    { title: 'Pending Verification',value: pendingClosings,                             icon: Lock,        color: '#f59e0b' },
    { title: 'Low Stock Alerts',    value: lowStockAlerts,                              icon: AlertTriangle,color:'#ef4444' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Executive Dashboard</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Real-time hospital network performance & consumable statistics
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="badge badge-success" style={{ padding: '0.35rem 0.65rem' }}>
            <TrendingUp size={12} /> System Status: Operational
          </span>
        </div>
      </div>

      {/* Grid of Stat Cards matching exact specification prompt */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '0.5rem'
      }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: `${card.color}20`, color: card.color }}>
                <Icon size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  {card.title}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: '0.1rem' }}>
                  {card.value}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts & Summaries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
        
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--clm-radius-md)', padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>Monthly Print Trend (Pages)</h3>
            <span style={{ fontSize: '0.725rem', color: 'var(--accent)' }}>
              {trendData[2].month} {new Date().getFullYear()}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '140px', paddingTop: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
            {trendData.map((bar, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600 }}>
                  {bar.pages > 0 ? bar.pages.toLocaleString() : '—'}
                </span>
                <div style={{
                  width: '100%',
                  height: bar.pages > 0 ? `${Math.round((bar.pages / maxTrend) * 90)}%` : '4px',
                  background: i === 2
                    ? 'linear-gradient(180deg, #38bdf8, #2563eb)'
                    : 'linear-gradient(180deg, #475569, #334155)',
                  borderRadius: '4px 4px 0 0',
                  minHeight: '4px'
                }}></div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hospital Breakdown */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--clm-radius-md)', padding: '0.75rem 1rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginBottom: '0.75rem' }}>Hospital Stock Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {hospitals.map((h) => {
              const { totalStock } = calculateHospitalStock(h.HospitalID || h.id);
              return (
                <div key={h.HospitalID || h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: '#0f172a', borderRadius: 'var(--clm-radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{h.HospitalName || h.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Code: {h.HospitalCode || h.code}</span>
                  </div>
                  <span className={`badge ${totalStock < 50 ? 'badge-warning' : 'badge-success'}`}>
                    {totalStock} Rims
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
