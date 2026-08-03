import React, { useState } from 'react';
import { Plus, X, Edit2, Save, Building2, MapPin, User, Phone, ShieldOff } from 'lucide-react';
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

const F = ({ label, children }) => (
  <div>
    <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>
      {label}
    </label>
    {children}
  </div>
);

export default function Hospitals() {
  const { hospitals, setHospitals, triggerServerAction, addAuditLog, saveToSheet } = useData();
  const { currentUser } = useAuth();

  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';
  const isDirector  = currentUser?.role === 'DIRECTOR';
  const canView     = isSuperAdmin || isDirector;

  const [showForm,  setShowForm]  = useState(false);
  const [formData,  setFormData]  = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [editingId, setEditingId] = useState(null);   // HospitalID being edited
  const [editData,  setEditData]  = useState({});     // live edit state

  // ─── Access Guard ──────────────────────────────────────────────
  if (!canView) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', gap: '0.75rem' }}>
        <ShieldOff size={36} color="var(--text-muted)" />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
          Hospital Registry is accessible only to <strong style={{ color: '#fff' }}>SUPERADMIN</strong> and <strong style={{ color: '#fff' }}>DIRECTOR</strong>.
        </p>
      </div>
    );
  }

  // ─── Add New Hospital ──────────────────────────────────────────
  const handleAddHospital = async (e) => {
    e.preventDefault();
    setSaving(true);
    await triggerServerAction(async () => {
      const hospitalId = 'HOSP-' + Date.now();
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

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

  // ─── Begin Edit ────────────────────────────────────────────────
  const beginEdit = (h) => {
    setEditingId(h.HospitalID || h.id);
    setEditData({
      HospitalCode:  h.HospitalCode || h.code || '',
      HospitalName:  h.HospitalName || h.name || '',
      Address:       h.Address || '',
      City:          h.City || '',
      ContactPerson: h.ContactPerson || '',
      Mobile:        h.Mobile || '',
      TotalCounters: h.TotalCounters || h.countersCount || 5,
      IsActive:      h.IsActive || (h.status === 'Active' ? 'TRUE' : 'FALSE')
    });
    setShowForm(false); // close add form if open
  };

  // ─── Save Edit ─────────────────────────────────────────────────
  const handleSaveEdit = async (hItem) => {
    if (!isSuperAdmin) return;
    setSaving(true);
    await triggerServerAction(async () => {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const updatedH = {
        ...hItem,
        HospitalCode:  editData.HospitalCode.toUpperCase(),
        code:          editData.HospitalCode.toUpperCase(),
        HospitalName:  editData.HospitalName,
        name:          editData.HospitalName,
        Address:       editData.Address || '-',
        City:          editData.City || '-',
        ContactPerson: editData.ContactPerson || '-',
        Mobile:        editData.Mobile || '-',
        TotalCounters: parseInt(editData.TotalCounters) || 5,
        countersCount: parseInt(editData.TotalCounters) || 5,
        IsActive:      editData.IsActive,
        status:        editData.IsActive === 'TRUE' ? 'Active' : 'Inactive',
        UpdatedOn:     now
      };

      setHospitals(hospitals.map(h =>
        (h.HospitalID === hItem.HospitalID || h.id === hItem.id) ? updatedH : h
      ));

      addAuditLog(currentUser.email, 'Edit Hospital',
        `${hItem.HospitalName} (${hItem.HospitalCode})`,
        `${updatedH.HospitalName} (${updatedH.HospitalCode})`
      );
      setEditingId(null);
      setEditData({});
    }, 'Updating Hospital in Google Sheet...');
    setSaving(false);
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); };

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

  // ─── Render ────────────────────────────────────────────────────
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
            onClick={() => { setShowForm(v => !v); setFormData(EMPTY_FORM); cancelEdit(); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            {showForm ? <><X size={13} /> Cancel</> : <><Plus size={13} /> Add Hospital</>}
          </button>
        )}
      </div>

      {/* ── Inline Add Form ── */}
      {showForm && isSuperAdmin && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--clm-radius-md)',
          padding: '0.85rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.55rem'
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent)' }}>
            New Hospital — Hospitals!A:K (11 Columns)
          </div>
          <form onSubmit={handleAddHospital}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', marginBottom: '0.45rem' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.45rem' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.55rem' }}>
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
                <select className="form-select" value={formData.IsActive}
                  onChange={e => setFormData({ ...formData, IsActive: e.target.value })}>
                  <option value="TRUE">TRUE (Active)</option>
                  <option value="FALSE">FALSE (Inactive)</option>
                </select>
              </F>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
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

      {/* ── Table ── */}
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
              <th style={{ textAlign: 'right' }}>Actions</th>
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
                const hid      = h.HospitalID || h.id;
                const isEditing = editingId === hid;
                const name     = h.HospitalName || h.name || '-';
                const code     = h.HospitalCode || h.code || '-';
                const city     = h.City || '-';
                const contact  = h.ContactPerson || '-';
                const mobile   = h.Mobile || '-';
                const counters = h.TotalCounters || h.countersCount || 0;
                const isActive = h.IsActive === 'TRUE' || h.IsActive === true || h.status === 'Active';

                if (isEditing) {
                  // ── Inline Edit Row ──
                  return (
                    <tr key={hid} style={{ background: 'rgba(37,99,235,0.08)', outline: '1px solid var(--accent)' }}>
                      <td>
                        <input className="form-control" style={{ minWidth: '130px' }}
                          value={editData.HospitalName}
                          onChange={e => setEditData({ ...editData, HospitalName: e.target.value })} />
                      </td>
                      <td>
                        <input className="form-control" style={{ width: '60px', textTransform: 'uppercase' }}
                          value={editData.HospitalCode}
                          onChange={e => setEditData({ ...editData, HospitalCode: e.target.value })} />
                      </td>
                      <td>
                        <input className="form-control" style={{ minWidth: '90px' }}
                          placeholder="City"
                          value={editData.City}
                          onChange={e => setEditData({ ...editData, City: e.target.value })} />
                      </td>
                      <td>
                        <input className="form-control" style={{ minWidth: '110px' }}
                          value={editData.ContactPerson}
                          onChange={e => setEditData({ ...editData, ContactPerson: e.target.value })} />
                      </td>
                      <td>
                        <input className="form-control" style={{ minWidth: '110px' }}
                          value={editData.Mobile}
                          onChange={e => setEditData({ ...editData, Mobile: e.target.value })} />
                      </td>
                      <td>
                        <input type="number" className="form-control" style={{ width: '65px' }}
                          value={editData.TotalCounters}
                          onChange={e => setEditData({ ...editData, TotalCounters: e.target.value })} />
                      </td>
                      <td>
                        <select className="form-select" style={{ minWidth: '80px' }}
                          value={editData.IsActive}
                          onChange={e => setEditData({ ...editData, IsActive: e.target.value })}>
                          <option value="TRUE">Active</option>
                          <option value="FALSE">Inactive</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                          <button className="btn btn-primary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                            onClick={() => handleSaveEdit(h)} disabled={saving}>
                            <Save size={11} /> {saving ? '...' : 'Save'}
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={cancelEdit}>
                            <X size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                // ── Normal Row ──
                return (
                  <tr key={hid}>
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
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                        {isSuperAdmin && (
                          <button className="btn btn-outline btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                            onClick={() => beginEdit(h)}>
                            <Edit2 size={11} /> Edit
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button className="btn btn-outline btn-sm" onClick={() => toggleStatus(h)}>
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
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
