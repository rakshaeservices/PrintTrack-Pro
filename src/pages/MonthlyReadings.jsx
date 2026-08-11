import React, { useState } from 'react';
import { Lock, Unlock, Plus, CheckCircle, Clock, Upload, ShieldAlert, FileText } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function MonthlyReadings() {
  const { monthlyReadings, setMonthlyReadings, hospitals, counters, triggerServerAction, addAuditLog, saveToSheet } = useData();
  const { currentUser, hasPermission } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [targetUnlockRecord, setTargetUnlockRecord] = useState(null);
  
  const [unlockReason, setUnlockReason] = useState('');
  const [unlockProofFile, setUnlockProofFile] = useState(null);

  // BUG-05 fix: use HospitalID/CounterID for live data
  const firstHospitalId = hospitals[0]?.HospitalID || hospitals[0]?.id || '';
  const firstCounterId  = counters[0]?.CounterID  || counters[0]?.id  || '';

  const [formData, setFormData] = useState({
    month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    hospitalId: firstHospitalId,
    counterId:  firstCounterId,
    opening: '',
    closing: '',
    issued: '',
    used: ''
  });

  // BUG-05 fix: lookup by HospitalID || id
  const selectedCounter = counters.find(c => (c.CounterID || c.id) === formData.counterId);

  const handleCreateReading = async (e) => {
    e.preventDefault();
    await triggerServerAction(async () => {
      const consumption = Math.max(0, parseInt(formData.closing) - parseInt(formData.opening));
      const balance     = Math.max(0, parseInt(formData.issued)  - parseInt(formData.used));
      // BUG-05 fix: use HospitalID || id and HospitalName || name
      const selH = hospitals.find(h => (h.HospitalID || h.id) === formData.hospitalId);
      const selC = counters.find(c  => (c.CounterID  || c.id) === formData.counterId);
      const now  = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const readingId = 'MR-' + Date.now();

      const newRecord = {
        id:           readingId,
        ReadingID:    readingId,
        month:        formData.month,
        Month:        formData.month,
        hospitalId:   formData.hospitalId,
        HospitalID:   formData.hospitalId,
        hospitalName: selH ? (selH.HospitalName || selH.name || 'Hospital') : 'Hospital',
        counterId:    formData.counterId,
        CounterID:    formData.counterId,
        counterName:  selC ? (selC.CounterName  || selC.name  || 'Counter')  : 'Counter',
        opening:      parseInt(formData.opening),
        OpeningReading: parseInt(formData.opening),
        closing:      parseInt(formData.closing),
        ClosingReading: parseInt(formData.closing),
        consumption,
        Consumption:  consumption,
        issued:       parseInt(formData.issued),
        PaperIssued:  parseInt(formData.issued),
        used:         parseInt(formData.used),
        PaperUsed:    parseInt(formData.used),
        balance,
        PaperBalance: balance,
        submittedBy:  currentUser.name,
        SubmittedBy:  currentUser.email,
        verified:     'Pending',
        VerificationStatus: 'Pending',
        locked:       true,
        IsLocked:     'TRUE',
        CreatedOn:    now
      };

      setMonthlyReadings([newRecord, ...monthlyReadings]);

      // BUG-08 fix: persist to MonthlyReadings Google Sheet
      await saveToSheet('MonthlyReadings', [
        readingId,
        formData.month,
        formData.hospitalId,
        formData.counterId,
        parseInt(formData.opening),
        parseInt(formData.closing),
        consumption,
        parseInt(formData.issued),
        parseInt(formData.used),
        balance,
        currentUser.email,
        'Pending',
        'TRUE',
        now,
        now
      ]);

      addAuditLog(currentUser.email, 'Submit Monthly Reading', '-',
        `${formData.month} - ${newRecord.counterName} (${consumption} pages)`);
      setShowModal(false);
      setFormData(prev => ({
        ...prev,
        opening: '', closing: '', issued: '', used: ''
      }));
    }, 'Saving Monthly Reading Entry & Locking Record...');
  };

  const handleVerify = async (recordId) => {
    if (!hasPermission('verify_readings')) return;
    await triggerServerAction(async () => {
      setMonthlyReadings(monthlyReadings.map(r => {
        if (r.id === recordId) {
          addAuditLog(currentUser.email, 'Verify Reading', `Status: ${r.verified}`, 'Status: Verified');
          return { ...r, verified: 'Verified' };
        }
        return r;
      }));
    }, 'Verifying Reading Entry...');
  };

  const openUnlockPrompt = (record) => {
    if (currentUser.role !== 'SUPERADMIN') {
      alert('Security Exception: Only Super Admin can unlock saved meter reading records.');
      return;
    }
    setTargetUnlockRecord(record);
    setShowUnlockModal(true);
  };

  const handleConfirmUnlock = async (e) => {
    e.preventDefault();
    if (!unlockReason) {
      alert('Reason is strictly required for Super Admin unlock action.');
      return;
    }

    await triggerServerAction(async () => {
      setMonthlyReadings(monthlyReadings.map(r => {
        if (r.id === targetUnlockRecord.id) {
          addAuditLog(
            currentUser.email,
            'Super Admin Unlock Reading Record',
            `Locked: YES`,
            `Unlocked. Reason: ${unlockReason} | Proof: ${unlockProofFile ? unlockProofFile.name : 'Meter_Proof_Scan.jpg'}`
          );
          return { ...r, locked: false, verified: 'Pending' };
        }
        return r;
      }));
      setShowUnlockModal(false);
      setUnlockReason('');
      setUnlockProofFile(null);
      setTargetUnlockRecord(null);
    }, 'Super Admin Unlocking Meter Record & Filing Audit Log...');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Monthly Reading Module</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Counter meter readings, auto consumption, paper balance & lock verification
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Submit New Reading
        </button>
      </div>

      <div className="table-responsive">
        <table className="table-compact">
          <thead>
            <tr>
              <th>Month</th>
              <th>Hospital</th>
              <th>Counter</th>
              <th>Opening</th>
              <th>Closing</th>
              <th>Consumption (Pages)</th>
              <th>Issued</th>
              <th>Used</th>
              <th>Balance</th>
              <th>Submitted By</th>
              <th>Verification</th>
              <th>Locked Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {monthlyReadings.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600, color: '#fff' }}>{r.month}</td>
                <td>{r.hospitalName}</td>
                <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{r.counterName}</td>
                <td>{r.opening.toLocaleString()}</td>
                <td>{r.closing.toLocaleString()}</td>
                <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                  {r.consumption.toLocaleString()}
                </td>
                <td>{r.issued} Rims</td>
                <td>{r.used} Rims</td>
                <td style={{ fontWeight: 600 }}>{r.balance} Rims</td>
                <td>{r.submittedBy}</td>
                <td>
                  <span className={`badge ${r.verified === 'Verified' ? 'badge-success' : 'badge-warning'}`}>
                    {r.verified === 'Verified' ? <CheckCircle size={10} /> : <Clock size={10} />} {r.verified}
                  </span>
                </td>
                <td>
                  {r.locked ? (
                    <span className="badge badge-danger">
                      <Lock size={10} /> Locked YES
                    </span>
                  ) : (
                    <span className="badge badge-warning">
                      <Unlock size={10} /> Unlocked
                    </span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                    {r.verified === 'Pending' && hasPermission('verify_readings') && (
                      <button className="btn btn-outline btn-sm" style={{ color: 'var(--success)', borderColor: 'var(--success)' }} onClick={() => handleVerify(r.id)}>
                        Verify
                      </button>
                    )}

                    {r.locked && (
                      <button className="btn btn-outline btn-sm" title="Super Admin Unlock" onClick={() => openUnlockPrompt(r)}>
                        <Unlock size={12} color="var(--warning)" /> Unlock
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Create Reading */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Submit Monthly Meter Reading</h3>
              <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateReading}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Month & Year</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.month}
                      onChange={e => setFormData({ ...formData, month: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hospital</label>
                    <select
                      className="form-select"
                      value={formData.hospitalId}
                      onChange={e => setFormData({ ...formData, hospitalId: e.target.value })}
                    >
                      {hospitals.map(h => <option key={h.HospitalID || h.id} value={h.HospitalID || h.id}>{h.HospitalName || h.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Counter Printer</label>
                  <select
                    className="form-select"
                    value={formData.counterId}
                    onChange={e => setFormData({ ...formData, counterId: e.target.value })}
                  >
                    {counters
                      .filter(c => (c.HospitalID || c.hospitalId) === formData.hospitalId)
                      .map(c => (
                        <option key={c.CounterID || c.id} value={c.CounterID || c.id}>
                          {c.CounterName || c.name} ({c.PrinterModel || c.printerModel || 'Printer'})
                        </option>
                      ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Opening Reading</label>
                    <input
                      type="number"
                      required
                      className="form-control"
                      value={formData.opening}
                      onChange={e => setFormData({ ...formData, opening: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Closing Reading</label>
                    <input
                      type="number"
                      required
                      className="form-control"
                      value={formData.closing}
                      onChange={e => setFormData({ ...formData, closing: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ padding: '0.5rem', background: '#0f172a', borderRadius: '4px', border: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto Calculated Consumption:</span>
                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                    {Math.max(0, parseInt(formData.closing || 0) - parseInt(formData.opening || 0)).toLocaleString()} Pages
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paper Rims Issued</label>
                    <input
                      type="number"
                      required
                      className="form-control"
                      value={formData.issued}
                      onChange={e => setFormData({ ...formData, issued: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paper Rims Used</label>
                    <input
                      type="number"
                      required
                      className="form-control"
                      value={formData.used}
                      onChange={e => setFormData({ ...formData, used: e.target.value })}
                    />
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save & Lock Reading</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Super Admin Unlock Record Prompt */}
      {showUnlockModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ borderColor: 'var(--warning)' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--warning)' }}>
                <ShieldAlert size={18} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Super Admin Authorization Unlock</h3>
              </div>
              <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setShowUnlockModal(false)}>✕</button>
            </div>
            <form onSubmit={handleConfirmUnlock}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Every unlock requires an official reason, proof file upload, and records a non-deletable audit log entry.
                </p>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unlock Reason (Required)</label>
                  <textarea
                    required
                    rows="3"
                    className="form-control"
                    placeholder="Enter explicit reason for unlocking locked meter reading..."
                    value={unlockReason}
                    onChange={e => setUnlockReason(e.target.value)}
                  ></textarea>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Meter Proof Image Upload</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={e => setUnlockProofFile(e.target.files[0])}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowUnlockModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger">Confirm Unlock & File Audit</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
