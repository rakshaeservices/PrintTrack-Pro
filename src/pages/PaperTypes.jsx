import React, { useState } from 'react';
import { Plus, Layers, CheckCircle2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function PaperTypes() {
  const { paperTypes, setPaperTypes, triggerServerAction, addAuditLog } = useData();
  const { currentUser, hasPermission } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  const handleAddType = async (e) => {
    e.preventDefault();
    if (!newTypeName) return;

    await triggerServerAction(async () => {
      const newP = {
        id: 'pt' + (paperTypes.length + 1),
        name: newTypeName,
        isDefault: false,
        status: 'Active'
      };
      setPaperTypes([...paperTypes, newP]);
      addAuditLog(currentUser.email, 'Add Paper Type Master', '-', newTypeName);
      setShowModal(false);
      setNewTypeName('');
    }, 'Saving Dynamic Paper Type Master...');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Paper Types Master</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No coding required. Admin can dynamically add consumable paper types.</p>
        </div>
        {hasPermission('all') && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add Paper Type
          </button>
        )}
      </div>

      <div className="table-responsive">
        <table className="table-compact">
          <thead>
            <tr>
              <th>Paper Type</th>
              <th>Default</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paperTypes.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600, color: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Layers size={14} color="var(--accent)" />
                    {p.name}
                  </div>
                </td>
                <td>
                  {p.isDefault ? (
                    <span className="badge badge-success"><CheckCircle2 size={10} /> Default</span>
                  ) : (
                    <span className="badge badge-secondary">Standard</span>
                  )}
                </td>
                <td>
                  <span className="badge badge-success">{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Add Paper Type Master</h3>
              <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddType}>
              <div className="modal-body">
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paper Type Name (e.g. A4 500, A3, Legal)</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. A4 500 / A3 / Legal"
                  value={newTypeName}
                  onChange={e => setNewTypeName(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Paper Type</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
