import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from '../firebase';

const AuthContext = createContext();

// ─── ALL AVAILABLE PERMISSIONS ────────────────────────────────────────────────
export const ALL_PERMISSIONS = [
  { id: 'view_dashboard',     label: 'View Dashboard',       category: 'General' },
  { id: 'view_reports',       label: 'View Reports',         category: 'General' },
  { id: 'export',             label: 'Export Data',          category: 'General' },
  { id: 'view_readings',      label: 'View Readings',        category: 'Readings' },
  { id: 'enter_readings',     label: 'Enter Readings',       category: 'Readings' },
  { id: 'verify_readings',    label: 'Verify Readings',      category: 'Readings' },
  { id: 'edit_unlocked',      label: 'Edit Unlocked Record', category: 'Readings' },
  { id: 'view_stock',         label: 'View Stock Ledger',    category: 'Stock' },
  { id: 'issue_paper',        label: 'Issue Paper',          category: 'Stock' },
  { id: 'view_hospital_data', label: 'View Hospital Data',   category: 'Hospital' },
];

// ─── DEFAULT ROLES (used as fallback if no custom perms saved) ────────────────
export const DEFAULT_ROLES = {
  SUPERADMIN:     { name: 'Super Admin',    permissions: ['all'] },
  DIRECTOR:       { name: 'Director',       permissions: ['view_dashboard', 'view_reports', 'export'] },
  MANAGER:        { name: 'Manager',        permissions: ['view_dashboard', 'view_readings', 'edit_unlocked', 'verify_readings', 'view_stock', 'view_reports', 'export'] },
  LOCATION_ADMIN: { name: 'Location Admin', permissions: ['view_hospital_data', 'verify_readings', 'view_stock', 'view_reports'] },
  STORE_OPERATOR: { name: 'Store Operator', permissions: ['issue_paper', 'enter_readings', 'view_stock'] }
};

// Legacy export
export const ROLES = DEFAULT_ROLES;

// ─── HARDCODED AUTHORIZED USERS (baseline — always allowed) ──────────────────
export const AUTHORIZED_USERS = [
  { email: 'softtech.lovejeet@gmail.com', role: 'SUPERADMIN',     hospitalId: 'ALL',   name: 'Lovejeet Singh',      type: 'registered' },
  { email: 'demo.director@gmail.com',     role: 'DIRECTOR',       hospitalId: 'ALL',   name: 'Demo Director',       type: 'demo' },
  { email: 'demo.manager@gmail.com',      role: 'MANAGER',        hospitalId: 'ALL',   name: 'Demo Manager',        type: 'demo' },
  { email: 'demo.admin@gmail.com',        role: 'LOCATION_ADMIN', hospitalId: 'UMMED', name: 'Demo Location Admin', type: 'demo' },
  { email: 'demo.operator@gmail.com',     role: 'STORE_OPERATOR', hospitalId: 'UMMED', name: 'Demo Operator',       type: 'demo' },
];

export const MOCK_USERS = AUTHORIZED_USERS.map((u, i) => ({ id: `u${i + 1}`, ...u }));

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const loadRuntimeUsers = () => {
  try { return JSON.parse(localStorage.getItem('pt_authorized_users') || '[]'); } catch { return []; }
};
const loadCustomRolePerms = () => {
  try { return JSON.parse(localStorage.getItem('pt_role_permissions') || '{}'); } catch { return {}; }
};

// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [currentUser,    setCurrentUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('printtrack_user') || 'null'); } catch { return null; }
  });
  const [authLoading,    setAuthLoading]    = useState(true);
  const [authError,      setAuthError]      = useState(null);
  const [authMode,       setAuthMode]       = useState(() => localStorage.getItem('printtrack_auth_mode') || 'GOOGLE_OAUTH');

  // Runtime additions (SUPERADMIN-managed, stored in localStorage)
  const [runtimeUsers,   setRuntimeUsers]   = useState(loadRuntimeUsers);
  // Dynamic role permissions (SUPERADMIN-managed, stored in localStorage)
  const [customRolePerms, setCustomRolePerms] = useState(loadCustomRolePerms);

  // Persist runtimeUsers whenever changed
  useEffect(() => {
    localStorage.setItem('pt_authorized_users', JSON.stringify(runtimeUsers));
  }, [runtimeUsers]);

  // Persist customRolePerms whenever changed
  useEffect(() => {
    localStorage.setItem('pt_role_permissions', JSON.stringify(customRolePerms));
  }, [customRolePerms]);

  useEffect(() => {
    const t = setTimeout(() => setAuthLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (currentUser) localStorage.setItem('printtrack_user', JSON.stringify(currentUser));
    else localStorage.removeItem('printtrack_user');
  }, [currentUser]);

  useEffect(() => { localStorage.setItem('printtrack_auth_mode', authMode); }, [authMode]);

  // ── Force-logout check: runs on window focus & mount ─────────────────────
  const checkStillAuthorized = useCallback(() => {
    if (!currentUser) return;
    const profile = getAuthorizedProfileFn(currentUser.email, runtimeUsers);
    if (!profile) {
      // User has been revoked — force logout
      firebaseSignOut(auth).catch(() => {});
      setCurrentUser(null);
    }
  }, [currentUser, runtimeUsers]);

  useEffect(() => {
    window.addEventListener('focus', checkStillAuthorized);
    return () => window.removeEventListener('focus', checkStillAuthorized);
  }, [checkStillAuthorized]);

  // ── Internal: check email against hardcoded + runtime allowlist ───────────
  function getAuthorizedProfileFn(email, rtUsers) {
    const lower = (email || '').toLowerCase().trim();
    return (
      AUTHORIZED_USERS.find(u => u.email === lower) ||
      (rtUsers || []).find(u => u.email === lower) ||
      null
    );
  }
  const getAuthorizedProfile = (email) => getAuthorizedProfileFn(email, runtimeUsers);

  // ── All authorized users (hardcoded + runtime, deduplicated) ─────────────
  const allAuthorizedUsers = [
    ...AUTHORIZED_USERS,
    ...runtimeUsers.filter(ru => !AUTHORIZED_USERS.find(au => au.email === ru.email))
  ];

  // ── Add a runtime authorized user ─────────────────────────────────────────
  const addRuntimeUser = (user) => {
    const lower = (user.email || '').toLowerCase().trim();
    if (getAuthorizedProfile(lower)) return { success: false, msg: 'User already authorized.' };
    const newUser = { ...user, email: lower, type: 'added' };
    setRuntimeUsers(prev => [...prev, newUser]);
    syncRuntimeUsersToSheet([...runtimeUsers, newUser]);
    return { success: true };
  };

  // ── Revoke a runtime authorized user (immediate force logout if online) ───
  const removeRuntimeUser = (email) => {
    const lower = (email || '').toLowerCase().trim();
    // Cannot revoke hardcoded users
    if (AUTHORIZED_USERS.find(u => u.email === lower)) {
      return { success: false, msg: 'Cannot revoke a hardcoded authorized user.' };
    }
    const updated = runtimeUsers.filter(u => u.email !== lower);
    setRuntimeUsers(updated);
    syncRuntimeUsersToSheet(updated);
    // If the revoked user is the current user — force logout now
    if (currentUser?.email === lower) {
      firebaseSignOut(auth).catch(() => {});
      setCurrentUser(null);
    }
    return { success: true };
  };

  // ── Dynamic role permission management ────────────────────────────────────
  const getRolePermissions = (role) => {
    if (role === 'SUPERADMIN') return ['all'];
    return customRolePerms[role] || DEFAULT_ROLES[role]?.permissions || [];
  };

  const updateRolePermissions = (role, newPermissions) => {
    if (role === 'SUPERADMIN') return; // SUPERADMIN always has 'all'
    const updated = { ...customRolePerms, [role]: newPermissions };
    setCustomRolePerms(updated);
    syncRolePermsToSheet(updated);
  };

  // ── hasPermission — uses dynamic permissions ───────────────────────────────
  const hasPermission = (perm) => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPERADMIN') return true;
    const perms = getRolePermissions(currentUser.role);
    return perms.includes('all') || perms.includes(perm);
  };

  // ── Google Sign-In ─────────────────────────────────────────────────────────
  const loginWithFirebaseGoogle = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user   = result.user;
      const lower  = (user.email || '').toLowerCase().trim();

      const profile = getAuthorizedProfile(lower);
      if (!profile) {
        await firebaseSignOut(auth);
        const msg = `Access Denied. "${lower}" is not authorized. Contact your Super Admin.`;
        setAuthError(msg);
        throw new Error(msg);
      }

      const loggedUser = {
        id:         user.uid,
        name:       user.displayName || profile.name,
        email:      lower,
        role:       profile.role,
        hospitalId: profile.hospitalId,
        photoUrl:   user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=2563eb&color=fff`
      };
      setCurrentUser(loggedUser);
      syncUserToSheets(loggedUser);
      return loggedUser;
    } catch (err) {
      if (!authError) setAuthError(err.message || 'Firebase OAuth failed.');
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Email + Password Sign-In ───────────────────────────────────────────────
  const loginWithEmailPassword = async (email, password) => {
    setAuthLoading(true);
    setAuthError(null);
    const lower = (email || '').toLowerCase().trim();

    const profile = getAuthorizedProfile(lower);
    if (!profile) {
      const msg = `Access Denied. "${lower}" is not authorized. Contact your Super Admin.`;
      setAuthError(msg);
      setAuthLoading(false);
      throw new Error(msg);
    }
    if (!password || password.length < 6) {
      const msg = 'Password must be at least 6 characters.';
      setAuthError(msg);
      setAuthLoading(false);
      throw new Error(msg);
    }

    try {
      let firebaseUser = null;
      try {
        const res = await signInWithEmailAndPassword(auth, lower, password);
        firebaseUser = res.user;
      } catch (fe) {
        if (fe.code === 'auth/user-not-found' || fe.code === 'auth/invalid-credential') {
          const nr = await createUserWithEmailAndPassword(auth, lower, password);
          firebaseUser = nr.user;
        } else throw fe;
      }

      const loggedUser = {
        id:         firebaseUser.uid,
        name:       firebaseUser.displayName || profile.name,
        email:      lower,
        role:       profile.role,
        hospitalId: profile.hospitalId,
        photoUrl:   `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=2563eb&color=fff`
      };
      setCurrentUser(loggedUser);
      syncUserToSheets(loggedUser);
      return loggedUser;
    } catch (err) {
      const msg = err.code === 'auth/wrong-password' ? 'Incorrect password.' : err.message || 'Auth failed.';
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Sync helpers ──────────────────────────────────────────────────────────
  const getEndpoint = () => {
    return localStorage.getItem('pt_sheets_url') ||
      import.meta.env.VITE_APPS_SCRIPT_URL ||
      'https://script.google.com/macros/s/AKfycbzEvndxwKutCuS06LvDQb_Iu0KcutInJTdGxQ6P-BtlbbNRcfSPdyD1QcQ9J4WK73HlCw/exec';
  };

  const syncUserToSheets = (u) => {
    const endpoint = getEndpoint();
    if (!endpoint || endpoint.includes('YOUR_DEPLOYED_ID_HERE')) return;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    fetch(`${endpoint}?action=upsertRow`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'upsertRow', tabName: 'Users', matchColumn: 'Email',
        rowData: [u.id, u.name, u.email, '-', u.role, u.hospitalId,
          'TRUE', u.role === 'SUPERADMIN' ? 'TRUE' : 'FALSE', 'TRUE',
          now, 'Firebase Auth', now, now]
      }), redirect: 'follow'
    }).catch(() => {});
  };

  const syncRuntimeUsersToSheet = (users) => {
    const endpoint = getEndpoint();
    if (!endpoint) return;
    fetch(`${endpoint}?action=savePermissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'savePermissions', type: 'authorizedUsers', data: users }),
      redirect: 'follow'
    }).catch(() => {});
  };

  const syncRolePermsToSheet = (perms) => {
    const endpoint = getEndpoint();
    if (!endpoint) return;
    fetch(`${endpoint}?action=savePermissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'savePermissions', type: 'rolePermissions', data: perms }),
      redirect: 'follow'
    }).catch(() => {});
  };

  const logout = async () => {
    setAuthLoading(true);
    try { await firebaseSignOut(auth); } catch (e) {}
    setCurrentUser(null);
    setAuthLoading(false);
  };

  const switchRole = (userId) => {
    const found = MOCK_USERS.find(u => u.id === userId);
    if (found) setCurrentUser({ ...currentUser, role: found.role, hospitalId: found.hospitalId });
  };

  return (
    <AuthContext.Provider value={{
      currentUser, setCurrentUser,
      authLoading, authError,
      authMode, setAuthMode,
      rolesList: DEFAULT_ROLES,
      mockUsers: MOCK_USERS,
      allAuthorizedUsers,
      runtimeUsers,
      customRolePerms,
      loginWithFirebaseGoogle,
      loginWithEmailPassword,
      logout,
      switchRole,
      hasPermission,
      getRolePermissions,
      updateRolePermissions,
      addRuntimeUser,
      removeRuntimeUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
