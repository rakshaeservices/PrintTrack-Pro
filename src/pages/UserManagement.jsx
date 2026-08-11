import React, { useState } from 'react';
import { UserPlus, Shield, CheckCircle, XCircle, Mail, Phone, Building2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function UserManagement() {
  const { users, setUsers, hospitals, triggerServerAction, addAuditLog, saveToSheet } = useData();
  const { currentUser, addRuntimeUser } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    FullName: '',
    Email: '',
    MobileNumber: '',
    Role: 'LOCATION_ADMIN',
    HospitalID: hospitals[0]?.HospitalID || hospitals[0]?.id || 'ALL',
    IsActive: 'TRUE',
    CanEditReports: 'FALSE',
    CanExport: 'TRUE'
  });

  const [editingUser, setEditingUser] = useState(null);

  // Strict check: Only SUPERADMIN can access
  if (currentUser.role !== 'SUPERADMIN') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          User Management module is strictly restricted to Super Admin (softtech.lovejeet@gmail.com).
        </p>
      </div>
    );
  }

  const handleAddUser = async (e) => {
    e.preventDefault();
    await triggerServerAction(async () => {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newUser = {
        UserID: 'USR-' + Date.now(),
        FullName: formData.FullName,
        Email: formData.Email.toLowerCase().trim(),
        MobileNumber: formData.MobileNumber,
        Role: formData.Role,
        HospitalID: formData.HospitalID,
        IsActive: formData.IsActive,
        CanEditReports: formData.CanEditReports,
        CanExport: formData.CanExport,
        LastLogin: '-',
        CreatedBy: currentUser.email,
        CreatedOn: now,
        UpdatedOn: now
      };

      // Prevent duplicate email
      const alreadyExists = users.some(u => (u.Email || '').toLowerCase() === newUser.Email);
      if (alreadyExists) {
        alert(`User with email "${newUser.Email}" already exists.`);
        return;
      }

      setUsers([newUser, ...users]);
      // Auto-authorize login access so user can log in immediately
      addRuntimeUser({
        email: newUser.Email,
        name: newUser.FullName,
        role: newUser.Role,
        hospitalId: newUser.HospitalID
      });
      // Persist to Users!A:M (13 columns)
      await saveToSheet('Users', [
        newUser.UserID, newUser.FullName, newUser.Email,
        newUser.MobileNumber, newUser.Role, newUser.HospitalID,
        'TRUE', formData.CanEditReports, formData.CanExport,
        '-', currentUser.email, now, now
      ]);
      addAuditLog(currentUser.email, 'Add System User', '-', `${newUser.FullName} (${newUser.Email} - ${newUser.Role})`);
      setShowModal(false);
      setFormData({
        FullName: '',
        Email: '',
        MobileNumber: '',
        Role: 'LOCATION_ADMIN',
        HospitalID: hospitals[0]?.HospitalID || hospitals[0]?.id || 'ALL',
        IsActive: 'TRUE',
        CanEditReports: 'FALSE',
        CanExport: 'TRUE'
      });
    }, 'Saving User to Users!A:M Google Sheet Range...');
  };

  const handleEditUserClick = (user) => {
    setEditingUser({
      UserID: user.UserID || 'USR-' + Date.now(),
      FullName: user.FullName || '',
      Email: user.Email || '',
      MobileNumber: user.MobileNumber || '',
      Role: user.Role || 'LOCATION_ADMIN',
      HospitalID: user.HospitalID || 'ALL',
      IsActive: user.IsActive === 'FALSE' || user.IsActive === false ? 'FALSE' : 'TRUE',
      CanEditReports: user.CanEditReports === 'TRUE' || user.CanEditReports === true ? 'TRUE' : 'FALSE',
      CanExport: user.CanExport === 'FALSE' || user.CanExport === false ? 'FALSE' : 'TRUE',
      CreatedOn: user.CreatedOn || new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
  };

  const handleSaveEditedUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    await triggerServerAction(async () => {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const updatedUser = {
        ...editingUser,
        UpdatedOn: now
      };

      // Update in state
      setUsers(users.map(u => (u.Email || '').toLowerCase() === updatedUser.Email.toLowerCase() ? updatedUser : u));

      // Persist to Users!A:M (13 columns) via upsert
      await saveToSheet('Users', [
        updatedUser.UserID, updatedUser.FullName, updatedUser.Email,
        updatedUser.MobileNumber, updatedUser.Role, updatedUser.HospitalID,
        updatedUser.IsActive, updatedUser.CanEditReports, updatedUser.CanExport,
        '-', currentUser.email, updatedUser.CreatedOn, now
      ]);

      addAuditLog(currentUser.email, 'Edit System User', updatedUser.Email, `Updated Name: ${updatedUser.FullName}, Role: ${updatedUser.Role}, Status: ${updatedUser.IsActive}`);
      setEditingUser(null);
    }, 'Updating User in Users!A:M Google Sheet Range...');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>User Management (Super Admin Only)</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            RBAC User controls mapped to <code>Users!A:M</code> Google Sheet range
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <UserPlus size={14} /> Add New User
        </button>
      </div>



      <div className="table-responsive">
        <table className="table-compact">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Role</th>
              <th>Hospital</th>
              <th>Status</th>
              <th>Can Export</th>
              <th>Created On</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                  No users found in <code>Users!A:M</code> sheet. Click 'Add New User' to create one.
                </td>
              </tr>
            ) : (
              [...new Map(users.map(u => [(u.Email || '').toLowerCase(), u])).values()].map(u => (
                <tr key={u.UserID || u.Email}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{u.FullName}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Mail size={12} color="var(--accent)" />
                      {u.Email}
                    </div>
                  </td>
                  <td>{u.MobileNumber || '-'}</td>
                  <td>
                    <span className={`badge ${u.Role === 'SUPERADMIN' ? 'badge-danger' : 'badge-primary'}`}>
                      <Shield size={10} /> {u.Role}
                    </span>
                  </td>
                  <td>{u.HospitalID || 'ALL'}</td>
                  <td>
                    <span className={`badge ${u.IsActive === 'TRUE' || u.IsActive === true ? 'badge-success' : 'badge-secondary'}`}>
                      {u.IsActive === 'TRUE' || u.IsActive === true ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{u.CanExport || 'TRUE'}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.CreatedOn || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleEditUserClick(u)}
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Create New RBAC System User</h3>
              <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Lovejeet Singh"
                    value={formData.FullName}
                    onChange={e => setFormData({ ...formData, FullName: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</label>
                    <input
                      type="email"
                      required
                      className="form-control"
                      placeholder="e.g. softtech.lovejeet@gmail.com"
                      value={formData.Email}
                      onChange={e => setFormData({ ...formData, Email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mobile Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. +91 9876543210"
                      value={formData.MobileNumber}
                      onChange={e => setFormData({ ...formData, MobileNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned RBAC Role</label>
                    <select
                      className="form-select"
                      value={formData.Role}
                      onChange={e => setFormData({ ...formData, Role: e.target.value })}
                    >
                      <option value="SUPERADMIN">SUPERADMIN</option>
                      <option value="DIRECTOR">DIRECTOR</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="LOCATION_ADMIN">LOCATION_ADMIN</option>
                      <option value="STORE_OPERATOR">STORE_OPERATOR</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned Hospital</label>
                    <select
                      className="form-select"
                      value={formData.HospitalID}
                      onChange={e => setFormData({ ...formData, HospitalID: e.target.value })}
                    >
                      <option value="ALL">All Hospitals (Super Admin / Director)</option>
                      {hospitals.map(h => <option key={h.HospitalID || h.id} value={h.HospitalID || h.id}>{h.HospitalName || h.name}</option>)}
                    </select>
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save User to Sheet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Edit User Details</h3>
              <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setEditingUser(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveEditedUser}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={editingUser.FullName}
                    onChange={e => setEditingUser({ ...editingUser, FullName: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email (Read-only Key)</label>
                    <input
                      type="email"
                      disabled
                      className="form-control"
                      value={editingUser.Email}
                      style={{ opacity: 0.7, cursor: 'not-allowed' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mobile Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. +91 9876543210"
                      value={editingUser.MobileNumber}
                      onChange={e => setEditingUser({ ...editingUser, MobileNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned RBAC Role</label>
                    <select
                      className="form-select"
                      value={editingUser.Role}
                      onChange={e => setEditingUser({ ...editingUser, Role: e.target.value })}
                    >
                      <option value="SUPERADMIN">SUPERADMIN</option>
                      <option value="DIRECTOR">DIRECTOR</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="LOCATION_ADMIN">LOCATION_ADMIN</option>
                      <option value="STORE_OPERATOR">STORE_OPERATOR</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned Hospital</label>
                    <select
                      className="form-select"
                      value={editingUser.HospitalID}
                      onChange={e => setEditingUser({ ...editingUser, HospitalID: e.target.value })}
                    >
                      <option value="ALL">All Hospitals (Super Admin / Director)</option>
                      {hospitals.map(h => <option key={h.HospitalID || h.id} value={h.HospitalID || h.id}>{h.HospitalName || h.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Account Status</label>
                    <select
                      className="form-select"
                      value={editingUser.IsActive}
                      onChange={e => setEditingUser({ ...editingUser, IsActive: e.target.value })}
                    >
                      <option value="TRUE">Active</option>
                      <option value="FALSE">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Can Export Data</label>
                    <select
                      className="form-select"
                      value={editingUser.CanExport}
                      onChange={e => setEditingUser({ ...editingUser, CanExport: e.target.value })}
                    >
                      <option value="TRUE">TRUE (Allowed)</option>
                      <option value="FALSE">FALSE (Disabled)</option>
                    </select>
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update User in Sheet</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
