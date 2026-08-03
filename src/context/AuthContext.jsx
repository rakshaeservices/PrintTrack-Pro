import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const ROLES = {
  SUPERADMIN: { name: 'Super Admin', permissions: ['all'] },
  DIRECTOR: { name: 'Director', permissions: ['view_dashboard', 'view_reports', 'export'] },
  MANAGER: { name: 'Manager', permissions: ['view_dashboard', 'view_readings', 'edit_unlocked', 'verify_readings', 'view_stock', 'view_reports'] },
  LOCATION_ADMIN: { name: 'Location Admin', permissions: ['view_hospital_data', 'verify_readings', 'view_stock', 'view_reports'] },
  STORE_OPERATOR: { name: 'Store Operator', permissions: ['issue_paper', 'enter_readings', 'view_stock'] }
};

export const MOCK_USERS = [
  { id: 'u1', name: 'Super Admin User', email: 'admin@printtrack.com', role: 'SUPERADMIN', hospitalId: 'ALL' },
  { id: 'u2', name: 'Executive Director', email: 'director@printtrack.com', role: 'DIRECTOR', hospitalId: 'ALL' },
  { id: 'u3', name: 'Operations Manager', email: 'manager@printtrack.com', role: 'MANAGER', hospitalId: 'ALL' },
  { id: 'u4', name: 'UMMED Location Admin', email: 'admin.ummed@printtrack.com', role: 'LOCATION_ADMIN', hospitalId: 'h1' },
  { id: 'u5', name: 'Store Operator', email: 'operator@printtrack.com', role: 'STORE_OPERATOR', hospitalId: 'h1' }
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('printtrack_user');
    return saved ? JSON.parse(saved) : MOCK_USERS[0];
  });

  const [authMode, setAuthMode] = useState(() => {
    return localStorage.getItem('printtrack_auth_mode') || 'GOOGLE_OAUTH'; // GOOGLE_OAUTH | FIREBASE | SHEETS_API
  });

  useEffect(() => {
    localStorage.setItem('printtrack_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('printtrack_auth_mode', authMode);
  }, [authMode]);

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
