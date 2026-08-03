import React, { useState } from 'react';
import { Send, Package, Building2, Printer, CheckCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function IssuePaper() {
  const { stockLedger, setStockLedger, issueRegister, setIssueRegister, hospitals, counters, paperTypes, triggerServerAction, addAuditLog, calculateHospitalStock, saveToSheet } = useData();
  const { currentUser } = useAuth();
  
  // BUG-04 fix: use HospitalID || id for live data
  const firstHospitalId = hospitals[0]?.HospitalID || hospitals[0]?.id || '';
  const firstCounterId  = counters[0]?.CounterID  || counters[0]?.id  || '';

  const [formData, setFormData] = useState({
    issueDate: new Date().toISOString().split('T')[0],
    hospitalId: firstHospitalId,
    counterId: firstCounterId,
    paperType: 'A4 500',
    qty: 8,
    remarks: 'Monthly Counter Requisition'
  });

  const [lastIssuedSuccess, setLastIssuedSuccess] = useState(false);

  // BUG-04 fix: filter counters using HospitalID || hospitalId
  const selectedHospitalCounters = counters.filter(c => (c.HospitalID || c.hospitalId) === formData.hospitalId);
  const { totalStock } = calculateHospitalStock(formData.hospitalId);

  const handleIssuePaperSubmit = async (e) => {
    e.preventDefault();
    if (parseInt(formData.qty) > totalStock) {
      alert(`Insufficient Stock! Hospital store balance is ${totalStock} rims.`);
      return;
    }

    await triggerServerAction(async () => {
      // BUG-04 fix: lookup by HospitalID || id
      const selH = hospitals.find(h => (h.HospitalID || h.id) === formData.hospitalId);
      const selC = counters.find(c => (c.CounterID || c.id) === formData.counterId);
      const now  = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const issueId  = 'ISS-' + Date.now();
      const ledgerId = 'SL-' + Date.now();

      const hospitalName = selH ? (selH.HospitalName || selH.name || 'Hospital') : 'Hospital';
      const counterName  = selC ? (selC.CounterName  || selC.name  || 'Counter')  : 'Counter';

      const issueLedgerEntry = {
        id: ledgerId,
        LedgerID: ledgerId,
        date: formData.issueDate,
        HospitalID: formData.hospitalId,
        hospitalId: formData.hospitalId,
        hospitalName,
        TransactionType: 'Issued',
        type: 'Issued',
        PaperType: formData.paperType,
        paperType: formData.paperType,
        QuantityIn: 0,
        QuantityOut: parseInt(formData.qty),
        qty: parseInt(formData.qty),
        CounterID: formData.counterId,
        counterName,
        Remarks: formData.remarks,
        remarks: formData.remarks,
        CreatedOn: now
      };

      setStockLedger([issueLedgerEntry, ...stockLedger]);

      // BUG-09 fix: persist to StockLedger!A:L AND IssueRegister!A:M
      await saveToSheet('StockLedger', [
        ledgerId, formData.hospitalId, formData.issueDate,
        'Issued', formData.paperType, 0, parseInt(formData.qty),
        formData.counterId, formData.remarks, currentUser.email, now, now
      ]);
      await saveToSheet('IssueRegister', [
        issueId, formData.issueDate, formData.hospitalId,
        formData.counterId, formData.paperType, parseInt(formData.qty),
        totalStock - parseInt(formData.qty),
        'Approved', currentUser.email, formData.remarks, now, now, now
      ]);

      addAuditLog(
        currentUser.email,
        'Issue Paper to Counter',
        `Stock: ${totalStock} Rims`,
        `Issued ${formData.qty} Rims of ${formData.paperType} to ${hospitalName} - ${counterName}`
      );

      setLastIssuedSuccess(true);
      setTimeout(() => setLastIssuedSuccess(false), 4000);
      setFormData({
        issueDate: new Date().toISOString().split('T')[0],
        hospitalId: firstHospitalId,
        counterId: firstCounterId,
        paperType: 'A4 500',
        qty: 8,
        remarks: 'Monthly Counter Requisition'
      });
    }, 'Store Keeper Issuing Paper & Updating Stock Ledger Immediately...');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '720px' }}>
      
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Issue Paper (Store Keeper Module)</h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Issue paper rims to specific printer counters. System updates stock immediately.
        </p>
      </div>

      {lastIssuedSuccess && (
        <div style={{ padding: '0.75rem 1rem', background: 'var(--success-light)', border: '1px solid var(--success)', borderRadius: 'var(--clm-radius-md)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Paper Issued Successfully! Hospital store stock ledger updated automatically.</span>
        </div>
      )}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--clm-radius-md)', padding: '1.25rem' }}>
        <form onSubmit={handleIssuePaperSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Issue Date</label>
              <input
                type="date"
                required
                className="form-control"
                value={formData.issueDate}
                onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Hospital Store</label>
              <select
                className="form-select"
                value={formData.hospitalId}
                onChange={e => setFormData({ ...formData, hospitalId: e.target.value })}
              >
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ padding: '0.5rem 0.75rem', background: '#0f172a', borderRadius: 'var(--clm-radius-sm)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Hospital Store Stock:</span>
            <span className={`badge ${totalStock < 50 ? 'badge-warning' : 'badge-success'}`}>
              {totalStock} Rims Available
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Target Counter (Printer)</label>
              <select
                className="form-select"
                value={formData.counterId}
                onChange={e => setFormData({ ...formData, counterId: e.target.value })}
              >
                {selectedHospitalCounters.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.printerModel})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Paper Type</label>
              <select
                className="form-select"
                value={formData.paperType}
                onChange={e => setFormData({ ...formData, paperType: e.target.value })}
              >
                {paperTypes.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Quantity (Rims)</label>
              <input
                type="number"
                required
                min="1"
                className="form-control"
                value={formData.qty}
                onChange={e => setFormData({ ...formData, qty: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>Remarks</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Counter Requisition"
                value={formData.remarks}
                onChange={e => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.6rem' }}>
              <Send size={16} /> Issue Paper & Update Stock Instantly
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
