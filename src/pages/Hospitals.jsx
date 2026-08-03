import React, { useState } from 'react';
import { Plus, Edit2, CheckCircle, XCircle, Store, Building2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function Hospitals() {
  const { hospitals, setHospitals, triggerServerAction, addAuditLog } = useData();
  const { currentUser, hasPermission } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', countersCount: 5, storeEnabled: true });

  const handleAddHospital = async (e) => {
    e.preventDefault();
    await triggerServerAction(async () => {
      const newH = {
        id: 'h' + (hospitals.length + 1),
        name: formData.name,
        code: formData.code.toUpperCase(),
        countersCount: parseInt(formData.countersCount) || 0,
        storeEnabled: formData.storeEnabled,
        status: 'Active'
      };
      setHospitals([...hospitals, newH]);
      addAuditLog(currentUser.email, 'Create Hospital', '-', `${newH.name} (${newH.code})`);
      setShowModal(false);
      setFormData({ name: '', code: '', countersCount: 5, storeEnabled: true });
    }, 'Saving New Hospital Registry...');
  };

  const toggleStatus = async (id) => {
    if (!hasPermission('all')) return;
    await triggerServerAction(async () => {
      setHospitals(hospitals.map(h => {
        if (h.id === id) {
          const nextStatus = h.status === 'Active' ? 'Inactive' : 'Active';
          addAuditLog(currentUser.email, 'Toggle Hospital Status', `${h.name}: ${h.status}`, `${h.name}: ${nextStatus}`);
          return { ...h, status: nextStatus };
        }
        return h;
      }));
    }, 'Updating Hospital Status...');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Hospital Registry</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Multi-tenant healthcare facility setup & store enablement</p>
        </div>
        {hasPermission('all') && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add Hospital
          </button>
        )}
      </div>

      <div className="table-responsive">
        <table className="table-compact">
          <thead>
            <tr>
              <th>Hospital Name</th>
              <th>Code</th>
              <th>Counters</th>
              <th>Store Status</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hospitals.map(h => (
              <tr key={h.id}>
                <td style={{ fontWeight: 600, color: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={16} color="var(--accent)" />
                    {h.name}
                  </div>
                </td>
                <td><span className="badge badge-secondary">{h.code}</span></td>
                <td>{h.countersCount} Counters</td>
                <td>
                  {h.storeEnabled ? (
                    <span className="badge badge-success"><Store size={10} /> Enabled</span>
                  ) : (
                    <span className="badge badge-secondary">Disabled</span>
                  )}
                </td>
                <td>
                  <span className={`badge ${h.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                    {h.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {hasPermission('all') && (
                    <button className="btn btn-outline btn-sm" onClick={() => toggleStatus(h.id)}>
                      {h.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Add New Hospital Facility</h3>
              <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddHospital}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hospital Name (e.g. UMMED)</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. UMMED Hospital"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Facility Code (e.g. UH)</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. UH"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Initial Printer Counters Count</label>
                  <input
                    type="number"
                    required
                    className="form-control"
                    value={formData.countersCount}
                    onChange={e => setFormData({ ...formData, countersCount: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Hospital</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
