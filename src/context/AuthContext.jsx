import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from '../firebase';

const AuthContext = createContext();

export const ROLES = {
  SUPERADMIN:     { name: 'Super Admin',     permissions: ['all'] },
  DIRECTOR:       { name: 'Director',        permissions: ['view_dashboard', 'view_reports', 'export'] },
  MANAGER:        { name: 'Manager',         permissions: ['view_dashboard', 'view_readings', 'edit_unlocked', 'verify_readings', 'view_stock', 'view_reports'] },
  LOCATION_ADMIN: { name: 'Location Admin',  permissions: ['view_hospital_data', 'verify_readings', 'view_stock', 'view_reports'] },
  STORE_OPERATOR: { name: 'Store Operator',  permissions: ['issue_paper', 'enter_readings', 'view_stock'] }
};

// ─── AUTHORIZED USER ALLOWLIST ────────────────────────────────────────────────
// ONLY these emails can login. All others are blocked.
// SUPERADMIN can add new users from UserManagement page.
export const AUTHORIZED_USERS = [
  // ── Real Registered Users ─────────────────────────────────────────────────
  { email: 'softtech.lovejeet@gmail.com', role: 'SUPERADMIN',     hospitalId: 'ALL',   name: 'Lovejeet Singh',      type: 'registered' },

  // ── Demo Accounts (one per role — for testing & onboarding only) ──────────
  { email: 'demo.director@gmail.com',     role: 'DIRECTOR',       hospitalId: 'ALL',   name: 'Demo Director',       type: 'demo' },
  { email: 'demo.manager@gmail.com',      role: 'MANAGER',        hospitalId: 'ALL',   name: 'Demo Manager',        type: 'demo' },
  { email: 'demo.admin@gmail.com',        role: 'LOCATION_ADMIN', hospitalId: 'UMMED', name: 'Demo Location Admin', type: 'demo' },
  { email: 'demo.operator@gmail.com',     role: 'STORE_OPERATOR', hospitalId: 'UMMED', name: 'Demo Operator',       type: 'demo' },
];

// Legacy export used by Navbar role switcher (SUPERADMIN only sees this)
export const MOCK_USERS = AUTHORIZED_USERS.map((u, i) => ({ id: `u${i + 1}`, ...u }));

// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('printtrack_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [authLoading, setAuthLoading] = useState(true);
  const [authError,   setAuthError]   = useState(null);
  const [authMode,    setAuthMode]    = useState(() => {
    return localStorage.getItem('printtrack_auth_mode') || 'GOOGLE_OAUTH';
  });

  useEffect(() => {
    const timer = setTimeout(() => setAuthLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('printtrack_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('printtrack_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('printtrack_auth_mode', authMode);
  }, [authMode]);

  // ── Check email against allowlist ──────────────────────────────────────────
  const getAuthorizedProfile = (email) => {
    const lowerEmail = (email || '').toLowerCase().trim();
    return AUTHORIZED_USERS.find(u => u.email === lowerEmail) || null;
  };

  // ── Google Sign-In ─────────────────────────────────────────────────────────
  const loginWithFirebaseGoogle = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user   = result.user;
      const lowerEmail = (user.email || '').toLowerCase().trim();

      // SECURITY: Reject any email not in allowlist
      const profile = getAuthorizedProfile(lowerEmail);
      if (!profile) {
        await firebaseSignOut(auth);
        const msg = `Access Denied. "${lowerEmail}" is not authorized. Contact your Super Admin.`;
        setAuthError(msg);
        throw new Error(msg);
      }

      const loggedUser = {
        id:         user.uid,
        name:       user.displayName || profile.name,
        email:      lowerEmail,
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
    const lowerEmail = (email || '').toLowerCase().trim();

    // SECURITY: Check allowlist before even calling Firebase
    const profile = getAuthorizedProfile(lowerEmail);
    if (!profile) {
      const msg = `Access Denied. "${lowerEmail}" is not authorized. Contact your Super Admin.`;
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
        const res = await signInWithEmailAndPassword(auth, lowerEmail, password);
        firebaseUser = res.user;
      } catch (firebaseErr) {
        // Auto-create account only for authorized users on their first login
        if (firebaseErr.code === 'auth/user-not-found' || firebaseErr.code === 'auth/invalid-credential') {
          const newRes = await createUserWithEmailAndPassword(auth, lowerEmail, password);
          firebaseUser = newRes.user;
        } else {
          throw firebaseErr;
        }
      }

      const loggedUser = {
        id:         firebaseUser.uid,
        name:       firebaseUser.displayName || profile.name,
        email:      lowerEmail,
        role:       profile.role,
        hospitalId: profile.hospitalId,
        photoUrl:   `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=2563eb&color=fff`
      };

      setCurrentUser(loggedUser);
      syncUserToSheets(loggedUser);
      return loggedUser;

    } catch (err) {
      const msg = err.code === 'auth/wrong-password'
        ? 'Incorrect password. Please try again.'
        : err.message || 'Authentication failed.';
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Sync to Google Sheets Users tab ───────────────────────────────────────
  const syncUserToSheets = (u) => {
    const customUrl = localStorage.getItem('pt_sheets_url');
    const envUrl    = import.meta.env.VITE_APPS_SCRIPT_URL;
    // BUG-11 fix: 3-tier fallback
    const endpoint  = customUrl || envUrl || 'https://script.google.com/macros/s/AKfycbzEvndxwKutCuS06LvDQb_Iu0KcutInJTdGxQ6P-BtlbbNRcfSPdyD1QcQ9J4WK73HlCw/exec';
    if (!endpoint || endpoint.includes('YOUR_DEPLOYED_ID_HERE')) return;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    fetch(`${endpoint}?action=appendRow`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'appendRow', tabName: 'Users', rowData: [
        u.id, u.name, u.email, '-', u.role, u.hospitalId,
        'TRUE', u.role === 'SUPERADMIN' ? 'TRUE' : 'FALSE', 'TRUE',
        now, 'Firebase Auth', now, now
      ]}),
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

  const hasPermission = (perm) => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPERADMIN') return true;
    const roleConfig = ROLES[currentUser.role];
    return roleConfig ? roleConfig.permissions.includes(perm) : false;
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      setCurrentUser,
      authLoading,
      authError,
      authorizedUsers: AUTHORIZED_USERS,
      loginWithFirebaseGoogle,
      loginWithEmailPassword,
      logout,
      switchRole,
      hasPermission,
      authMode,
      setAuthMode,
      rolesList: ROLES,
      mockUsers: MOCK_USERS
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
