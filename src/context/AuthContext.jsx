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
  { id: 'u1', name: 'Lovejeet (Super Admin)', email: 'softtech.lovejeet@gmail.com', role: 'SUPERADMIN', hospitalId: 'ALL' },
  { id: 'u2', name: 'Executive Director', email: 'director@printtrack.com', role: 'DIRECTOR', hospitalId: 'ALL' },
  { id: 'u3', name: 'Operations Manager', email: 'manager@printtrack.com', role: 'MANAGER', hospitalId: 'ALL' },
  { id: 'u4', name: 'UMMED Location Admin', email: 'admin.ummed@printtrack.com', role: 'LOCATION_ADMIN', hospitalId: 'h1' },
  { id: 'u5', name: 'Store Operator', email: 'operator@printtrack.com', role: 'STORE_OPERATOR', hospitalId: 'h1' }
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('printtrack_user');
    return saved ? JSON.parse(saved) : null; // Default to null to show Google Sign-In Page
  });

  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState(() => {
    return localStorage.getItem('printtrack_auth_mode') || 'GOOGLE_OAUTH';
  });

  // Initial App Loading State Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthLoading(false);
    }, 1200); // Smooth initial brand loading screen
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

  const loginWithGoogle = (email, name, photoUrl) => {
    setAuthLoading(true);
    setTimeout(() => {
      const lowerEmail = email.toLowerCase().trim();
      
      // Auto-assign SUPERADMIN role to softtech.lovejeet@gmail.com
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
        id: 'usr_' + Date.now(),
        name: name || lowerEmail.split('@')[0],
        email: lowerEmail,
        role: userRole,
        hospitalId: userHospital,
        photoUrl: photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || lowerEmail)}&background=2563eb&color=fff`
      };

      setCurrentUser(loggedUser);
      setAuthLoading(false);
    }, 800);
  };

  const logout = () => {
    setAuthLoading(true);
    setTimeout(() => {
      setCurrentUser(null);
      setAuthLoading(false);
    }, 400);
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
      loginWithGoogle,
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
