import React, { useState } from 'react';
import { Plus, Edit2, CheckCircle, XCircle, Store, Building2, MapPin, User, Phone } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function Hospitals() {
  const { hospitals, setHospitals, triggerServerAction, addAuditLog, saveToSheet } = useData();
  const { currentUser, hasPermission } = useAuth();
  const [showModal, setShowModal] = useState(false);

  // Exact 11-column Schema Form State:
  // HospitalID, HospitalCode, HospitalName, Address, City, ContactPerson, Mobile, TotalCounters, IsActive, CreatedOn, UpdatedOn
  const [formData, setFormData] = useState({
    HospitalCode: '',
    HospitalName: '',
    Address: '',
    City: '',
    ContactPerson: '',
    Mobile: '',
    TotalCounters: 5,
    IsActive: 'TRUE'
  });

  const handleAddHospital = async (e) => {
    e.preventDefault();
    await triggerServerAction(async () => {
      const hospitalId = 'HOSP-' + Date.now();
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

      // Exact 11 Columns array for Hospitals!A:K
      const hospitalRow = [
        hospitalId,
        formData.HospitalCode.toUpperCase(),
        formData.HospitalName,
        formData.Address || '-',
        formData.City || '-',
        formData.ContactPerson || '-',
        formData.Mobile || '-',
        parseInt(formData.TotalCounters) || 5,
        formData.IsActive,
        now,
        now
      ];

      const newHospitalObject = {
        id: hospitalId,
        HospitalID: hospitalId,
        HospitalCode: formData.HospitalCode.toUpperCase(),
        code: formData.HospitalCode.toUpperCase(),
        HospitalName: formData.HospitalName,
        name: formData.HospitalName,
        Address: formData.Address || '-',
        City: formData.City || '-',
        ContactPerson: formData.ContactPerson || '-',
        Mobile: formData.Mobile || '-',
        countersCount: parseInt(formData.TotalCounters) || 5,
        TotalCounters: parseInt(formData.TotalCounters) || 5,
        IsActive: formData.IsActive,
        status: formData.IsActive === 'TRUE' ? 'Active' : 'Inactive',
        CreatedOn: now,
        UpdatedOn: now
      };

      setHospitals([newHospitalObject, ...hospitals]);
      await saveToSheet('Hospitals', hospitalRow);
      addAuditLog(currentUser.email, 'Create Hospital Registry', '-', `${newHospitalObject.HospitalName} (${newHospitalObject.HospitalCode})`);
      setShowModal(false);
      setFormData({
        HospitalCode: '',
        HospitalName: '',
        Address: '',
        City: '',
        ContactPerson: '',
        Mobile: '',
        TotalCounters: 5,
        IsActive: 'TRUE'
      });
    }, 'Saving Hospital Entry to Hospitals!A:K Google Sheet...');
  };

  const toggleStatus = async (hItem) => {
    if (!hasPermission('all')) return;
    await triggerServerAction(async () => {
      const currentActive = hItem.IsActive === 'TRUE' || hItem.status === 'Active';
      const nextActiveStatus = currentActive ? 'FALSE' : 'TRUE';
      
      setHospitals(hospitals.map(h => {
        const matches = (h.HospitalID && h.HospitalID === hItem.HospitalID) || h.id === hItem.id;
        if (matches) {
          addAuditLog(currentUser.email, 'Toggle Hospital Status', `${h.HospitalName || h.name}: ${currentActive ? 'Active' : 'Inactive'}`, `${h.HospitalName || h.name}: ${nextActiveStatus === 'TRUE' ? 'Active' : 'Inactive'}`);
          return {
            ...h,
            IsActive: nextActiveStatus,
            status: nextActiveStatus === 'TRUE' ? 'Active' : 'Inactive'
          };
        }
        return h;
      }));
    }, 'Updating Hospital Active Status...');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Hospital Registry</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Mapped to exact 11-column <code>Hospitals!A:K</code> Google Sheet Range
          </p>
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
              <th>City / Address</th>
              <th>Contact Person</th>
              <th>Mobile</th>
              <th>Counters</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hospitals.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                  No hospitals registered. Click 'Add Hospital' to add one.
                </td>
              </tr>
            ) : (
              hospitals.map(h => {
                const name = h.HospitalName || h.name || 'Unnamed Hospital';
                const code = h.HospitalCode || h.code || 'CODE';
                const city = h.City || '-';
                const address = h.Address || '-';
                const contact = h.ContactPerson || '-';
                const mobile = h.Mobile || '-';
                const counters = h.TotalCounters || h.countersCount || 0;
                const isActive = h.IsActive === 'TRUE' || h.IsActive === true || h.status === 'Active';

                return (
                  <tr key={h.HospitalID || h.id}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={16} color="var(--accent)" />
                        {name}
                      </div>
                    </td>
                    <td><span className="badge badge-secondary">{code}</span></td>
                    <td>
                      <div style={{ fontSize: '0.725rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={11} color="var(--text-muted)" />
                        {city !== '-' ? `${city} (${address})` : address}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.725rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <User size={11} color="var(--text-muted)" />
                        {contact}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.725rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Phone size={11} color="var(--text-muted)" />
                        {mobile}
                      </div>
                    </td>
                    <td>{counters} Counters</td>
                    <td>
                      <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {hasPermission('all') && (
                        <button className="btn btn-outline btn-sm" onClick={() => toggleStatus(h)}>
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Complete 11-Column Schema Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Add New Hospital (Hospitals!A:K Schema)</h3>
              <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddHospital}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hospital Name (HospitalName)</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. UMMED Hospital"
                      value={formData.HospitalName}
                      onChange={e => setFormData({ ...formData, HospitalName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Facility Code (HospitalCode)</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. UH"
                      value={formData.HospitalCode}
                      onChange={e => setFormData({ ...formData, HospitalCode: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Address</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Near Paota Circle"
                      value={formData.Address}
                      onChange={e => setFormData({ ...formData, Address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>City</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Jodhpur"
                      value={formData.City}
                      onChange={e => setFormData({ ...formData, City: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contact Person</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Dr. Sharma"
                      value={formData.ContactPerson}
                      onChange={e => setFormData({ ...formData, ContactPerson: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mobile Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. +91 9876543210"
                      value={formData.Mobile}
                      onChange={e => setFormData({ ...formData, Mobile: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Counters (Number)</label>
                    <input
                      type="number"
                      required
                      className="form-control"
                      value={formData.TotalCounters}
                      onChange={e => setFormData({ ...formData, TotalCounters: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Is Active (Boolean)</label>
                    <select
                      className="form-select"
                      value={formData.IsActive}
                      onChange={e => setFormData({ ...formData, IsActive: e.target.value })}
                    >
                      <option value="TRUE">TRUE (Active)</option>
                      <option value="FALSE">FALSE (Inactive)</option>
                    </select>
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save to Hospitals!A:K Sheet</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
