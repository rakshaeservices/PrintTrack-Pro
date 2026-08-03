import React, { useState } from 'react';
import { Plus, Printer, Building2, Edit2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function Counters() {
  const { counters, setCounters, hospitals, triggerServerAction, addAuditLog, saveToSheet } = useData();
  const { currentUser, hasPermission } = useAuth();
  const [selectedHospitalFilter, setSelectedHospitalFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingCounter, setEditingCounter] = useState(null);

  // BUG-14 fix: use HospitalID (live schema) with .id fallback
  const firstHospitalId = hospitals[0]?.HospitalID || hospitals[0]?.id || '';

  const [formData, setFormData] = useState({
    hospitalId: firstHospitalId,
    name: '',
    printerModel: 'Canon IR 2925',
    serialNo: '',
    status: 'Active'
  });

  // BUG-02 fix: match both HospitalID and hospitalId field names from live data
  const filteredCounters = selectedHospitalFilter === 'ALL'
    ? counters
    : counters.filter(c => (c.HospitalID || c.hospitalId) === selectedHospitalFilter);

  const openAddModal = () => {
    setEditingCounter(null);
    setFormData({
      hospitalId: hospitals[0]?.HospitalID || hospitals[0]?.id || '',
      name: '',
      printerModel: 'Canon IR 2925',
      serialNo: '',
      status: 'Active'
    });
    setShowModal(true);
  };

  const openEditModal = (counter) => {
    setEditingCounter(counter);
    // BUG-19 fix: use HospitalID || hospitalId for edit modal
    setFormData({
      hospitalId: counter.HospitalID || counter.hospitalId || '',
      name: counter.CounterName || counter.name || '',
      printerModel: counter.PrinterModel || counter.printerModel || '',
      serialNo: counter.SerialNo || counter.serialNo || '',
      status: counter.IsActive === 'TRUE' ? 'Active' : (counter.status || 'Active')
    });
    setShowModal(true);
  };

  const handleSaveCounter = async (e) => {
    e.preventDefault();
    await triggerServerAction(async () => {
      // BUG-02 fix: use HospitalID || id for lookup
      const selectedH = hospitals.find(h => (h.HospitalID || h.id) === formData.hospitalId);
      const hospitalName = selectedH ? (selectedH.HospitalName || selectedH.name || 'Hospital') : 'Hospital';
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

      if (editingCounter) {
        // Edit Existing Counter
        setCounters(counters.map(c => {
          const cId = c.CounterID || c.id;
          const eId = editingCounter.CounterID || editingCounter.id;
          if (cId === eId) {
            const updated = {
              ...c,
              HospitalID: formData.hospitalId,
              hospitalId: formData.hospitalId,
              hospitalName,
              CounterName: formData.name,
              name: formData.name,
              PrinterModel: formData.printerModel,
              printerModel: formData.printerModel,
              SerialNo: formData.serialNo,
              serialNo: formData.serialNo,
              IsActive: formData.status === 'Active' ? 'TRUE' : 'FALSE',
              status: formData.status
            };
            addAuditLog(
              currentUser.email,
              'Edit Counter Printer Details',
              `${c.CounterName || c.name} (${c.PrinterModel || c.printerModel})`,
              `${updated.name} (${updated.printerModel}) [Status: ${updated.status}]`
            );
            return updated;
          }
          return c;
        }));
      } else {
        // BUG-07 fix: Create New Counter + saveToSheet to Counters!A:J
        const counterId = 'CTR-' + Date.now();
        const newC = {
          id: counterId,
          CounterID: counterId,
          HospitalID: formData.hospitalId,
          hospitalId: formData.hospitalId,
          hospitalName,
          CounterName: formData.name,
          name: formData.name,
          PrinterModel: formData.printerModel,
          printerModel: formData.printerModel,
          SerialNo: formData.serialNo || `SN-${Date.now().toString().slice(-4)}`,
          serialNo: formData.serialNo || `SN-${Date.now().toString().slice(-4)}`,
          IsActive: 'TRUE',
          status: formData.status,
          CreatedOn: now,
          UpdatedOn: now
        };
        setCounters([newC, ...counters]);
        // Persist to Counters!A:J Google Sheet (10 columns)
        await saveToSheet('Counters', [
          counterId,           // CounterID
          formData.hospitalId, // HospitalID
          formData.name,       // CounterName
          formData.printerModel, // PrinterModel
          newC.SerialNo,       // SerialNo
          'A4',                // PaperSize
          'TRUE',              // IsActive
          now,                 // InstalledDate
          now,                 // CreatedOn
          now                  // UpdatedOn
        ]);
        addAuditLog(currentUser.email, 'Add Counter Printer', '-', `${hospitalName} - ${newC.name} (${newC.printerModel})`);
      }

      setShowModal(false);
      setEditingCounter(null);
    }, editingCounter ? 'Updating Printer Details & Audit Trail...' : 'Registering Printer Counter to Counters!A:J...');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Counter (Printer) Module</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Simple, clean counter printer mapping with full edit capabilities</p>
        </div>
        {hasPermission('all') && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={14} /> Add Counter Printer
          </button>
        )}
      </div>

      {/* Hospital Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.4rem 0.75rem', borderRadius: 'var(--clm-radius-sm)', border: '1px solid var(--border-color)' }}>
        <Building2 size={15} color="var(--accent)" />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Filter Hospital:</span>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={selectedHospitalFilter}
          onChange={(e) => setSelectedHospitalFilter(e.target.value)}
        >
          <option value="ALL">All Hospitals ({counters.length} Printers)</option>
          {hospitals.map(h => (
            <option key={h.HospitalID || h.id} value={h.HospitalID || h.id}>{h.HospitalName || h.name}</option>
          ))}
        </select>
      </div>

      <div className="table-responsive">
        <table className="table-compact">
          <thead>
            <tr>
              <th>Hospital</th>
              <th>Counter</th>
              <th>Printer Name / Model</th>
              <th>Serial Number</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCounters.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{c.hospitalName}</td>
                <td style={{ fontWeight: 600, color: '#fff' }}>{c.name}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Printer size={14} color="var(--text-muted)" />
                    {c.printerModel}
                  </div>
                </td>
                <td><code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.serialNo}</code></td>
                <td>
                  <span className={`badge ${c.status === 'Active' ? 'badge-success' : 'badge-secondary'}`}>
                    {c.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {hasPermission('all') && (
                    <button className="btn btn-outline btn-sm" onClick={() => openEditModal(c)}>
                      <Edit2 size={12} /> Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Create / Edit */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                {editingCounter ? 'Edit Counter Printer Details' : 'Register New Counter Printer'}
              </h3>
              <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveCounter}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Select Hospital</label>
                  <select
                    className="form-select"
                    value={formData.hospitalId}
                    onChange={e => setFormData({ ...formData, hospitalId: e.target.value })}
                  >
                    {hospitals.map(h => (
                      <option key={h.HospitalID || h.id} value={h.HospitalID || h.id}>{h.HospitalName || h.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Counter Name (e.g. Counter 3 / Reception)</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Counter 3"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Printer Model Name</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Canon IR 2925"
                    value={formData.printerModel}
                    onChange={e => setFormData({ ...formData, printerModel: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Serial Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. CN-2925-009"
                    value={formData.serialNo}
                    onChange={e => setFormData({ ...formData, serialNo: e.target.value })}
                  />
                </div>
                {editingCounter && (
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingCounter ? 'Update Counter' : 'Add Counter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

