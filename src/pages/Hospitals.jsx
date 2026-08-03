import React, { useState } from 'react';
import { Plus, X, Building2, MapPin, User, Phone, CheckCircle, XCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = {
  HospitalCode: '',
  HospitalName: '',
  Address: '',
  City: '',
  ContactPerson: '',
  Mobile: '',
  TotalCounters: 5,
  IsActive: 'TRUE'
};

export default function Hospitals() {
  const { hospitals, setHospitals, triggerServerAction, addAuditLog, saveToSheet } = useData();
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const handleAddHospital = async (e) => {
    e.preventDefault();
    setSaving(true);
    await triggerServerAction(async () => {
      const hospitalId = 'HOSP-' + Date.now();
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

      // Exact Hospitals!A:K — 11 columns
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

      const newH = {
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
        TotalCounters: parseInt(formData.TotalCounters) || 5,
        countersCount: parseInt(formData.TotalCounters) || 5,
        IsActive: formData.IsActive,
        status: formData.IsActive === 'TRUE' ? 'Active' : 'Inactive',
        CreatedOn: now,
        UpdatedOn: now
      };

      setHospitals([newH, ...hospitals]);
      await saveToSheet('Hospitals', hospitalRow);
      addAuditLog(currentUser.email, 'Create Hospital', '-', `${newH.HospitalName} (${newH.HospitalCode})`);
      setShowForm(false);
      setFormData(EMPTY_FORM);
    }, 'Saving to Hospitals!A:K...');
    setSaving(false);
  };

  const toggleStatus = async (hItem) => {
    if (!isSuperAdmin) return;
    await triggerServerAction(async () => {
      const wasActive = hItem.IsActive === 'TRUE' || hItem.status === 'Active';
      const nextActive = wasActive ? 'FALSE' : 'TRUE';
      setHospitals(hospitals.map(h => {
        if ((h.HospitalID && h.HospitalID === hItem.HospitalID) || h.id === hItem.id) {
          addAuditLog(currentUser.email, 'Toggle Hospital Status',
            `${h.HospitalName || h.name}: ${wasActive ? 'Active' : 'Inactive'}`,
            `${h.HospitalName || h.name}: ${nextActive === 'TRUE' ? 'Active' : 'Inactive'}`
          );
          return { ...h, IsActive: nextActive, status: nextActive === 'TRUE' ? 'Active' : 'Inactive' };
        }
        return h;
      }));
    }, 'Updating Hospital Status...');
  };

  const F = ({ label, children }) => (
    <div>
      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Hospital Registry</h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Multi-tenant facility setup · <code style={{ fontSize: '0.68rem' }}>Hospitals!A:K</code>
          </p>
        </div>
        {isSuperAdmin && (
          <button
            className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`}
            onClick={() => { setShowForm(v => !v); setFormData(EMPTY_FORM); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            {showForm ? <><X size={13} /> Cancel</> : <><Plus size={13} /> Add Hospital</>}
          </button>
        )}
      </div>

      {/* Inline Form — appears above table when showForm is true */}
      {showForm && isSuperAdmin && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--clm-radius-md)',
          padding: '0.85rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '0.1rem' }}>
            New Hospital Entry — All 11 Columns
          </div>

          <form onSubmit={handleAddHospital}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <F label="Hospital Name *">
                <input className="form-control" required placeholder="e.g. UMMED Hospital"
                  value={formData.HospitalName}
                  onChange={e => setFormData({ ...formData, HospitalName: e.target.value })} />
              </F>
              <F label="Facility Code *">
                <input className="form-control" required placeholder="e.g. UH"
                  value={formData.HospitalCode}
                  onChange={e => setFormData({ ...formData, HospitalCode: e.target.value })} />
              </F>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <F label="Address">
                <input className="form-control" placeholder="e.g. Near Paota Circle"
                  value={formData.Address}
                  onChange={e => setFormData({ ...formData, Address: e.target.value })} />
              </F>
              <F label="City">
                <input className="form-control" placeholder="e.g. Jodhpur"
                  value={formData.City}
                  onChange={e => setFormData({ ...formData, City: e.target.value })} />
              </F>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <F label="Contact Person">
                <input className="form-control" placeholder="e.g. Dr. Sharma"
                  value={formData.ContactPerson}
                  onChange={e => setFormData({ ...formData, ContactPerson: e.target.value })} />
              </F>
              <F label="Mobile">
                <input className="form-control" placeholder="+91 98765..."
                  value={formData.Mobile}
                  onChange={e => setFormData({ ...formData, Mobile: e.target.value })} />
              </F>
              <F label="Total Counters *">
                <input type="number" className="form-control" required min="1"
                  value={formData.TotalCounters}
                  onChange={e => setFormData({ ...formData, TotalCounters: e.target.value })} />
              </F>
              <F label="Is Active">
                <select className="form-select"
                  value={formData.IsActive}
                  onChange={e => setFormData({ ...formData, IsActive: e.target.value })}>
                  <option value="TRUE">TRUE (Active)</option>
                  <option value="FALSE">FALSE (Inactive)</option>
                </select>
              </F>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline btn-sm"
                onClick={() => { setShowForm(false); setFormData(EMPTY_FORM); }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Saving...' : 'Save to Google Sheet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="table-responsive">
        <table className="table-compact">
          <thead>
            <tr>
              <th>Hospital Name</th>
              <th>Code</th>
              <th>City</th>
              <th>Contact Person</th>
              <th>Mobile</th>
              <th>Counters</th>
              <th>Status</th>
              {isSuperAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {hospitals.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                  No hospitals registered yet.
                </td>
              </tr>
            ) : (
              hospitals.map(h => {
                const name = h.HospitalName || h.name || '-';
                const code = h.HospitalCode || h.code || '-';
                const city = h.City || '-';
                const contact = h.ContactPerson || '-';
                const mobile = h.Mobile || '-';
                const counters = h.TotalCounters || h.countersCount || 0;
                const isActive = h.IsActive === 'TRUE' || h.IsActive === true || h.status === 'Active';

                return (
                  <tr key={h.HospitalID || h.id}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building2 size={14} color="var(--accent)" />
                        {name}
                      </div>
                    </td>
                    <td><span className="badge badge-secondary">{code}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem' }}>
                        <MapPin size={10} color="var(--text-muted)" /> {city}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem' }}>
                        <User size={10} color="var(--text-muted)" /> {contact}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem' }}>
                        <Phone size={10} color="var(--text-muted)" /> {mobile}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.78rem' }}>{counters}</td>
                    <td>
                      <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => toggleStatus(h)}>
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    )}
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
