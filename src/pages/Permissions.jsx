import React, { useState } from 'react';
import {
  ShieldCheck, Users, Key, Plus, Trash2, CheckCircle2, XCircle,
  Save, RefreshCw, Lock, UserPlus, Shield, Building2, ChevronDown
} from 'lucide-react';
import { useAuth, ALL_PERMISSIONS, DEFAULT_ROLES } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const ROLE_COLORS = {
  SUPERADMIN:     { badge: 'badge-danger',   bg: '#ef444420', border: '#ef4444' },
  DIRECTOR:       { badge: 'badge-primary',  bg: '#6366f120', border: '#6366f1' },
  MANAGER:        { badge: 'badge-success',  bg: '#10b98120', border: '#10b981' },
  LOCATION_ADMIN: { badge: 'badge-warning',  bg: '#f59e0b20', border: '#f59e0b' },
  STORE_OPERATOR: { badge: 'badge-secondary',bg: '#94a3b820', border: '#94a3b8' },
};

const ROLE_KEYS = ['SUPERADMIN', 'DIRECTOR', 'MANAGER', 'LOCATION_ADMIN', 'STORE_OPERATOR'];

export default function Permissions() {
  const {
    currentUser, hasPermission,
    getRolePermissions, updateRolePermissions,
    allAuthorizedUsers, addRuntimeUser, removeRuntimeUser,
    rolesList
  } = useAuth();
  const { users, hospitals, saveToSheet, addAuditLog, triggerServerAction } = useData();

  const [activeTab, setActiveTab]   = useState('matrix');
  const [savedMsg,  setSavedMsg]    = useState('');

  // Tab 3 state
  const [showAddAuth,   setShowAddAuth]   = useState(false);
  const [authForm,      setAuthForm]      = useState({ name: '', email: '', role: 'LOCATION_ADMIN', hospitalId: 'ALL' });

  // Tab 2 state
  const [roleChanges, setRoleChanges]     = useState({});
  const [savingRole,  setSavingRole]      = useState(null);

  if (currentUser?.role !== 'SUPERADMIN') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Lock size={40} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h2 style={{ color: 'var(--danger)' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Permissions module is restricted to Super Admin only.
        </p>
      </div>
    );
  }

  const flash = (msg) => { setSavedMsg(msg); setTimeout(() => setSavedMsg(''), 2500); };

  // ── Tab 1: Permission Matrix logic ────────────────────────────────────────
  const handleTogglePerm = (role, permId) => {
    if (role === 'SUPERADMIN') return;
    const current = getRolePermissions(role);
    const next = current.includes(permId)
      ? current.filter(p => p !== permId)
      : [...current, permId];
    updateRolePermissions(role, next);
    addAuditLog(currentUser.email, 'Update Role Permission', `${role}: remove ${permId}`, `${role}: ${next.join(', ')}`);
    flash('✓ Permission updated & saved');
  };

  const handleResetRole = (role) => {
    if (role === 'SUPERADMIN') return;
    updateRolePermissions(role, DEFAULT_ROLES[role].permissions);
    flash(`✓ ${role} reset to defaults`);
  };

  // ── Tab 2: User Role change ───────────────────────────────────────────────
  const handleRoleChange = async (user) => {
    const newRole = roleChanges[user.UserID || user.Email];
    if (!newRole || newRole === user.Role) return;
    setSavingRole(user.UserID || user.Email);
    await triggerServerAction(async () => {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      await saveToSheet('Users', [
        user.UserID || '', user.FullName || '', user.Email || '',
        user.MobileNumber || '-', newRole, user.HospitalID || 'ALL',
        'TRUE', newRole === 'SUPERADMIN' ? 'TRUE' : 'FALSE', 'TRUE',
        '-', currentUser.email, user.CreatedOn || now, now
      ]);
      addAuditLog(currentUser.email, 'Change User Role', `${user.Email}: ${user.Role}`, `${user.Email}: ${newRole}`);
    }, `Updating ${user.FullName || user.Email} role...`);
    setRoleChanges(prev => { const n = { ...prev }; delete n[user.UserID || user.Email]; return n; });
    setSavingRole(null);
    flash(`✓ Role updated — takes effect on next login`);
  };

  // ── Tab 3: Add authorized user ────────────────────────────────────────────
  const handleAddAuthUser = () => {
    if (!authForm.email || !authForm.name) return;
    const result = addRuntimeUser(authForm);
    if (!result.success) { alert(result.msg); return; }
    addAuditLog(currentUser.email, 'Add Authorized User', '-', `${authForm.email} as ${authForm.role}`);
    setAuthForm({ name: '', email: '', role: 'LOCATION_ADMIN', hospitalId: 'ALL' });
    setShowAddAuth(false);
    flash('✓ User authorized — they can now login');
  };

  const handleRevokeUser = (email, name) => {
    if (!window.confirm(`Revoke login access for "${name}" (${email})?\nIf currently logged in, they will be logged out immediately.`)) return;
    const result = removeRuntimeUser(email);
    if (!result.success) { alert(result.msg); return; }
    addAuditLog(currentUser.email, 'Revoke Authorized User', email, 'Access Revoked');
    flash(`✓ ${email} access revoked`);
  };

  // ── Deduplicated users list (from Google Sheet) ──────────────────────────
  const dedupedUsers = [...new Map(users.map(u => [(u.Email || '').toLowerCase(), u])).values()];

  // ── Tab definitions ───────────────────────────────────────────────────────
  const tabs = [
    { id: 'matrix',     label: 'Role & Permission Matrix', icon: ShieldCheck },
    { id: 'users',      label: 'User Role Management',     icon: Users },
    { id: 'authorized', label: 'Authorized Login Users',   icon: Key },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="var(--accent)" /> Permissions & Access Control
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Manage roles, permissions, and login access — Super Admin only
          </p>
        </div>
        {savedMsg && (
          <span style={{ fontSize: '0.8rem', color: '#10b981', background: '#10b98115', border: '1px solid #10b98140', padding: '0.3rem 0.75rem', borderRadius: '6px' }}>
            {savedMsg}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-card)', padding: '0.25rem', borderRadius: 'var(--clm-radius-sm)', border: '1px solid var(--border-color)' }}>
        {tabs.map(t => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.4rem', padding: '0.45rem 0.5rem', borderRadius: '4px', border: 'none',
              background: active ? 'var(--primary)' : 'transparent',
              color: active ? '#fff' : 'var(--text-muted)',
              fontWeight: active ? 600 : 400, fontSize: '0.78rem', cursor: 'pointer',
              transition: 'all 0.15s'
            }}>
              <Icon size={14} />{t.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: Role & Permission Matrix ─────────────────────────────── */}
      {activeTab === 'matrix' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--clm-radius-md)', overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>Permissions Matrix</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Click checkbox to toggle • SUPERADMIN always has all permissions</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  <th style={{ padding: '0.6rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', width: '200px', borderBottom: '1px solid var(--border-color)' }}>Permission</th>
                  {ROLE_KEYS.map(role => (
                    <th key={role} style={{ padding: '0.6rem 0.5rem', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                        <span className={`badge ${ROLE_COLORS[role].badge}`} style={{ fontSize: '0.62rem' }}>{role}</span>
                        {role !== 'SUPERADMIN' && (
                          <button onClick={() => handleResetRole(role)} title="Reset to defaults"
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <RefreshCw size={9} /> reset
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Group by category */}
                {['General', 'Readings', 'Stock', 'Hospital'].map(cat => {
                  const catPerms = ALL_PERMISSIONS.filter(p => p.category === cat);
                  return (
                    <React.Fragment key={cat}>
                      <tr style={{ background: '#1e293b' }}>
                        <td colSpan={ROLE_KEYS.length + 1} style={{ padding: '0.3rem 1rem', fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {cat}
                        </td>
                      </tr>
                      {catPerms.map((perm, i) => (
                        <tr key={perm.id} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'transparent' : '#0f172a20' }}>
                          <td style={{ padding: '0.5rem 1rem', color: '#e2e8f0', fontWeight: 500 }}>{perm.label}</td>
                          {ROLE_KEYS.map(role => {
                            const hasPerm = role === 'SUPERADMIN' || getRolePermissions(role).includes(perm.id);
                            const isModified = role !== 'SUPERADMIN' &&
                              JSON.stringify(getRolePermissions(role)) !== JSON.stringify(DEFAULT_ROLES[role]?.permissions);
                            return (
                              <td key={role} style={{ textAlign: 'center', padding: '0.5rem' }}>
                                {role === 'SUPERADMIN' ? (
                                  <CheckCircle2 size={18} color="#10b981" />
                                ) : (
                                  <button onClick={() => handleTogglePerm(role, perm.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', borderRadius: '4px', transition: 'transform 0.1s' }}
                                    title={`${hasPerm ? 'Remove' : 'Grant'} ${perm.label} for ${role}`}>
                                    {hasPerm
                                      ? <CheckCircle2 size={18} color="#10b981" />
                                      : <XCircle size={18} color="#475569" />
                                    }
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '0.6rem 1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            ℹ️ Changes are saved to localStorage immediately and synced to <code>Permissions</code> Google Sheet tab. Role changes take effect on the user's next login.
          </div>
        </div>
      )}

      {/* ── TAB 2: User Role Management ──────────────────────────────────── */}
      {activeTab === 'users' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--clm-radius-md)', overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>User Role Management</h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              Change a user's role → select new role → Save. Takes effect on their next login.
            </p>
          </div>
          <div className="table-responsive">
            <table className="table-compact">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Hospital</th>
                  <th>Current Role</th>
                  <th>Change Role To</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {dedupedUsers.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                    No users loaded from Google Sheet yet.
                  </td></tr>
                ) : dedupedUsers.map(u => {
                  const uid = u.UserID || u.Email;
                  const pendingRole = roleChanges[uid];
                  const changed = pendingRole && pendingRole !== u.Role;
                  return (
                    <tr key={uid}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{u.FullName || '-'}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.Email}</td>
                      <td>{u.HospitalID || 'ALL'}</td>
                      <td>
                        <span className={`badge ${ROLE_COLORS[u.Role]?.badge || 'badge-secondary'}`} style={{ fontSize: '0.65rem' }}>
                          <Shield size={9} /> {u.Role}
                        </span>
                      </td>
                      <td>
                        <select className="form-select" style={{ width: 'auto', minWidth: '160px', fontSize: '0.78rem' }}
                          value={pendingRole || u.Role}
                          onChange={e => setRoleChanges(prev => ({ ...prev, [uid]: e.target.value }))}>
                          {ROLE_KEYS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className={`btn btn-sm ${changed ? 'btn-primary' : 'btn-outline'}`}
                          disabled={!changed || savingRole === uid}
                          onClick={() => handleRoleChange(u)}
                          style={{ opacity: changed ? 1 : 0.4 }}>
                          {savingRole === uid ? '...' : <><Save size={12} /> Save</>}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: Authorized Login Users ────────────────────────────────── */}
      {activeTab === 'authorized' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* Summary bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span style={{ color: '#fff', fontWeight: 600 }}>{allAuthorizedUsers.length}</span> users authorized to login
              <span style={{ marginLeft: '1rem' }}>
                <span style={{ color: '#38bdf8' }}>{allAuthorizedUsers.filter(u => u.type === 'registered').length} registered</span>
                {' · '}
                <span style={{ color: '#10b981' }}>{allAuthorizedUsers.filter(u => u.type === 'demo').length} demo</span>
                {' · '}
                <span style={{ color: '#f59e0b' }}>{allAuthorizedUsers.filter(u => u.type === 'added').length} added</span>
              </span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddAuth(v => !v)}>
              <UserPlus size={13} /> Add Authorized User
            </button>
          </div>

          {/* Add form */}
          {showAddAuth && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: 'var(--clm-radius-md)', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', margin: 0 }}>Grant Login Access to New User</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Full Name</label>
                  <input className="form-control" placeholder="e.g. Rajesh Kumar" value={authForm.name}
                    onChange={e => setAuthForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Email Address</label>
                  <input className="form-control" type="email" placeholder="e.g. rajesh@hospital.com" value={authForm.email}
                    onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Assign Role</label>
                  <select className="form-select" value={authForm.role}
                    onChange={e => setAuthForm(p => ({ ...p, role: e.target.value }))}>
                    {ROLE_KEYS.filter(r => r !== 'SUPERADMIN').map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Assigned Hospital</label>
                  <select className="form-select" value={authForm.hospitalId}
                    onChange={e => setAuthForm(p => ({ ...p, hospitalId: e.target.value }))}>
                    <option value="ALL">All Hospitals</option>
                    {hospitals.map(h => <option key={h.HospitalID || h.id} value={h.HospitalID || h.id}>{h.HospitalName || h.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setShowAddAuth(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleAddAuthUser}
                  disabled={!authForm.email || !authForm.name}>
                  <Key size={12} /> Grant Access
                </button>
              </div>
            </div>
          )}

          {/* Users grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.6rem' }}>
            {allAuthorizedUsers.map(u => {
              const isHardcoded = u.type === 'registered' || u.type === 'demo';
              const color = ROLE_COLORS[u.role] || ROLE_COLORS['STORE_OPERATOR'];
              return (
                <div key={u.email} style={{
                  background: 'var(--bg-card)', border: `1px solid ${isHardcoded ? 'var(--border-color)' : '#f59e0b50'}`,
                  borderRadius: 'var(--clm-radius-md)', padding: '0.75rem',
                  display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative'
                }}>
                  {/* Type badge */}
                  <span style={{
                    position: 'absolute', top: '0.5rem', right: '0.5rem',
                    fontSize: '0.6rem', padding: '1px 6px', borderRadius: '10px', fontWeight: 600,
                    background: u.type === 'registered' ? '#38bdf820' : u.type === 'demo' ? '#10b98120' : '#f59e0b20',
                    color:      u.type === 'registered' ? '#38bdf8'   : u.type === 'demo' ? '#10b981'   : '#f59e0b',
                    border: `1px solid ${u.type === 'registered' ? '#38bdf840' : u.type === 'demo' ? '#10b98140' : '#f59e0b40'}`,
                    textTransform: 'uppercase'
                  }}>{u.type}</span>

                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', paddingRight: '60px' }}>{u.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                    <span className={`badge ${color.badge}`} style={{ fontSize: '0.62rem' }}>{u.role}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      <Building2 size={10} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                      {u.hospitalId}
                    </span>
                  </div>

                  {/* Revoke button — only for runtime-added users */}
                  {!isHardcoded && (
                    <button className="btn btn-sm" onClick={() => handleRevokeUser(u.email, u.name)}
                      style={{ marginTop: '0.25rem', background: '#ef444415', border: '1px solid #ef444440', color: '#ef4444', fontSize: '0.72rem' }}>
                      <Trash2 size={11} /> Revoke Access
                    </button>
                  )}
                  {isHardcoded && (
                    <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '0.1rem' }}>
                      <Lock size={9} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                      Hardcoded — cannot revoke from UI
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
