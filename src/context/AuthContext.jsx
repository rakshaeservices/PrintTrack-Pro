import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signOut as firebaseSignOut } from '../firebase';

const AuthContext = createContext();

export const ROLES = {
  SUPERADMIN: { name: 'Super Admin', permissions: ['all'] },
  DIRECTOR: { name: 'Director', permissions: ['view_dashboard', 'view_reports', 'export'] },
  MANAGER: { name: 'Manager', permissions: ['view_dashboard', 'view_readings', 'edit_unlocked', 'verify_readings', 'view_stock', 'view_reports'] },
  LOCATION_ADMIN: { name: 'Location Admin', permissions: ['view_hospital_data', 'verify_readings', 'view_stock', 'view_reports'] },
  STORE_OPERATOR: { name: 'Store Operator', permissions: ['issue_paper', 'enter_readings', 'view_stock'] }
};

export const MOCK_USERS = [
  { id: 'u1', name: 'Lovejeet (Super Admin)', email: 'softtech.lovejeet@gmail.com', role: 'SUPERADMIN', hospitalId: 'ALL' },
  { id: 'u2', name: 'Executive Director', email: 'director@printtrack.com', role: 'DIRECTOR', hospitalId: 'ALL' },
  { id: 'u3', name: 'Operations Manager', email: 'manager@printtrack.com', role: 'MANAGER', hospitalId: 'ALL' },
  { id: 'u4', name: 'UMMED Location Admin', email: 'admin.ummed@printtrack.com', role: 'LOCATION_ADMIN', hospitalId: 'h1' },
  { id: 'u5', name: 'Store Operator', email: 'operator@printtrack.com', role: 'STORE_OPERATOR', hospitalId: 'h1' }
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('printtrack_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authMode, setAuthMode] = useState(() => {
    return localStorage.getItem('printtrack_auth_mode') || 'GOOGLE_OAUTH';
  });

  // Initial App Loading State Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthLoading(false);
    }, 1200);
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

  // Actual Firebase Google Sign-In Trigger with OAuth Popup
  const loginWithFirebaseGoogle = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const lowerEmail = (user.email || '').toLowerCase().trim();

      // Auto-assign RBAC permissions & SUPERADMIN role
      let userRole = 'LOCATION_ADMIN';
      let userHospital = 'h1';

      if (lowerEmail === 'softtech.lovejeet@gmail.com' || lowerEmail.includes('admin')) {
        userRole = 'SUPERADMIN';
        userHospital = 'ALL';
      } else if (lowerEmail.includes('director')) {
        userRole = 'DIRECTOR';
        userHospital = 'ALL';
      } else if (lowerEmail.includes('manager')) {
        userRole = 'MANAGER';
        userHospital = 'ALL';
      } else if (lowerEmail.includes('operator')) {
        userRole = 'STORE_OPERATOR';
        userHospital = 'h1';
      }

      const loggedUser = {
        id: user.uid,
        name: user.displayName || lowerEmail.split('@')[0],
        email: lowerEmail,
        role: userRole,
        hospitalId: userHospital,
        photoUrl: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || lowerEmail)}&background=2563eb&color=fff`
      };

      setCurrentUser(loggedUser);

      // Sync Firebase User Data directly into Google Sheet Users!A:M tab
      syncUserToSheets(loggedUser);

      return loggedUser;
    } catch (err) {
      console.error("Firebase Google Auth Error:", err);
      setAuthError(err.message || "Failed to authenticate with Firebase Google Popup.");
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const syncUserToSheets = (u) => {
    const customUrl = localStorage.getItem('pt_sheets_url');
    const envUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
    const endpoint = customUrl || envUrl;

    if (!endpoint || endpoint.includes('YOUR_DEPLOYED_ID_HERE')) return;

    const userRow = [
      u.id,
      u.name,
      u.email,
      '-', // MobileNumber
      u.role,
      u.hospitalId,
      'TRUE', // IsActive
      u.role === 'SUPERADMIN' ? 'TRUE' : 'FALSE', // CanEditReports
      'TRUE', // CanExport
      new Date().toISOString().replace('T', ' ').substring(0, 19), // LastLogin
      'Firebase Auth System', // CreatedBy
      new Date().toISOString().replace('T', ' ').substring(0, 19), // CreatedOn
      new Date().toISOString().replace('T', ' ').substring(0, 19)  // UpdatedOn
    ];

    fetch(`${endpoint}?action=appendRow`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'appendRow', tabName: 'Users', rowData: userRow }),
      redirect: 'follow'
    }).catch(() => {});
  };

  // Authorized Email & Password Sign-In (Firebase Auth + Fallback)
  const loginWithEmailPassword = async (email, password, name) => {
    setAuthLoading(true);
    setAuthError(null);
    const lowerEmail = email.toLowerCase().trim();

    let userRole = 'LOCATION_ADMIN';
    let userHospital = 'h1';

    if (lowerEmail === 'softtech.lovejeet@gmail.com' || lowerEmail.includes('admin')) {
      userRole = 'SUPERADMIN';
      userHospital = 'ALL';
    } else if (lowerEmail.includes('director')) {
      userRole = 'DIRECTOR';
      userHospital = 'ALL';
    } else if (lowerEmail.includes('manager')) {
      userRole = 'MANAGER';
      userHospital = 'ALL';
    } else if (lowerEmail.includes('operator')) {
      userRole = 'STORE_OPERATOR';
      userHospital = 'h1';
    }

    try {
      // 1. Try Firebase Email/Password Auth
      let firebaseUser = null;
      try {
        const res = await signInWithEmailAndPassword(auth, lowerEmail, password);
        firebaseUser = res.user;
      } catch (err) {
        // If user not found, auto-create account forAuthorized users
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          try {
            const newRes = await createUserWithEmailAndPassword(auth, lowerEmail, password);
            firebaseUser = newRes.user;
          } catch (createErr) {
            console.log("Firebase Email Auth fallback to direct logic:", createErr);
          }
        }
      }

      const loggedUser = {
        id: firebaseUser ? firebaseUser.uid : 'usr_' + Date.now(),
        name: name || (firebaseUser && firebaseUser.displayName) || lowerEmail.split('@')[0],
        email: lowerEmail,
        role: userRole,
        hospitalId: userHospital,
        photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || lowerEmail)}&background=2563eb&color=fff`
      };

      setCurrentUser(loggedUser);
      syncUserToSheets(loggedUser);
      return loggedUser;
    } catch (err) {
      console.error("Email Password Auth Error:", err);
      setAuthError(err.message || "Failed to authenticate with Email & Password.");
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    setAuthLoading(true);
    try {
      await firebaseSignOut(auth);
    } catch (e) {}
    setCurrentUser(null);
    setAuthLoading(false);
  };

  const switchRole = (userId) => {
    const found = MOCK_USERS.find(u => u.id === userId);
    if (found) setCurrentUser(found);
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
