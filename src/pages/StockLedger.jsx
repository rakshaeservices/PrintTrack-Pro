import React, { useState } from 'react';
import { Plus, Package, ArrowUpRight, ArrowDownLeft, Building2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function StockLedger() {
  const { stockLedger, setStockLedger, hospitals, paperTypes, calculateHospitalStock, triggerServerAction, addAuditLog } = useData();
  const { currentUser, hasPermission } = useAuth();
  
  const [selectedHospitalFilter, setSelectedHospitalFilter] = useState('h1');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    hospitalId: 'h1',
    type: 'Purchase',
    paperType: 'A4 500',
    qty: 50,
    remarks: 'Direct Purchase Order'
  });

  const { totalStock, totalPurchased, totalIssued } = calculateHospitalStock(selectedHospitalFilter);
  const filteredLedgers = stockLedger.filter(l => l.hospitalId === selectedHospitalFilter);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    await triggerServerAction(async () => {
      const selH = hospitals.find(h => h.id === formData.hospitalId);
      const newEntry = {
        id: 'st' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        hospitalId: formData.hospitalId,
        hospitalName: selH ? selH.name : 'Hospital',
        type: formData.type,
        paperType: formData.paperType,
        qty: parseInt(formData.qty),
        counterName: '-',
        remarks: formData.remarks
      };

      setStockLedger([newEntry, ...stockLedger]);
      addAuditLog(currentUser.email, `Stock Movement (${formData.type})`, '-', `${newEntry.hospitalName} - ${formData.type} ${formData.qty} Rims of ${formData.paperType}`);
      setShowModal(false);
    }, 'Processing Stock Transaction...');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Stock & Transaction Ledger</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Transaction-level stock movements with automatically derived real-time balances
          </p>
        </div>
        {hasPermission('view_stock') && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add Stock Movement
          </button>
        )}
      </div>

      {/* Hospital Selector Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.4rem 0.75rem', borderRadius: 'var(--clm-radius-sm)', border: '1px solid var(--border-color)' }}>
        <Building2 size={15} color="var(--accent)" />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hospital Stock Location:</span>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '200px' }}
          value={selectedHospitalFilter}
          onChange={(e) => setSelectedHospitalFilter(e.target.value)}
        >
          {hospitals.map(h => (
            <option key={h.id} value={h.id}>{h.name} ({h.code})</option>
          ))}
        </select>
      </div>

      {/* Hospital Stock Ledger Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--clm-radius-md)', padding: '0.75rem 1rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Opening Stock</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>150 Rims</h3>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--clm-radius-md)', padding: '0.75rem 1rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Purchased Stock</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.2rem' }}>+{totalPurchased} Rims</h3>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--clm-radius-md)', padding: '0.75rem 1rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Issued Stock</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--warning)', marginTop: '0.2rem' }}>-{totalIssued} Rims</h3>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--primary)', borderRadius: 'var(--clm-radius-md)', padding: '0.75rem 1rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 600 }}>Derived Closing Stock</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>{totalStock} Rims</h3>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table-compact">
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction Type</th>
              <th>Paper Type</th>
              <th>Quantity</th>
              <th>Target Counter / Reference</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {filteredLedgers.map(l => (
              <tr key={l.id}>
                <td>{l.date}</td>
                <td>
                  <span className={`badge ${l.type === 'Purchase' || l.type === 'Opening' ? 'badge-success' : 'badge-warning'}`}>
                    {l.type === 'Purchase' ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />} {l.type}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{l.paperType}</td>
                <td style={{ fontWeight: 700, color: l.type === 'Issued' ? 'var(--warning)' : 'var(--success)' }}>
                  {l.type === 'Issued' ? `-${l.qty}` : `+${l.qty}`} Rims
                </td>
                <td>{l.counterName}</td>
                <td style={{ color: 'var(--text-muted)' }}>{l.remarks}</td>
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
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Post Stock Transaction Entry</h3>
              <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddTransaction}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hospital Facility</label>
                  <select
                    className="form-select"
                    value={formData.hospitalId}
                    onChange={e => setFormData({ ...formData, hospitalId: e.target.value })}
                  >
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Transaction Type</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Purchase">Purchase (Stock In)</option>
                    <option value="Opening">Opening Adjustment</option>
                    <option value="Return">Return to Store</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paper Type</label>
                    <select
                      className="form-select"
                      value={formData.paperType}
                      onChange={e => setFormData({ ...formData, paperType: e.target.value })}
                    >
                      {paperTypes.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quantity (Rims)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="form-control"
                      value={formData.qty}
                      onChange={e => setFormData({ ...formData, qty: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Remarks / Ref PO</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Vendor PO #1084"
                    value={formData.remarks}
                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
