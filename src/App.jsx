import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNavbar from './components/BottomNavbar';
import Loader from './components/Loader';
import InitialLoadingScreen from './components/InitialLoadingScreen';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import Hospitals from './pages/Hospitals';
import Counters from './pages/Counters';
import MonthlyReadings from './pages/MonthlyReadings';
import StockLedger from './pages/StockLedger';
import IssuePaper from './pages/IssuePaper';
import PaperTypes from './pages/PaperTypes';
import FutureConsumables from './pages/FutureConsumables';
import Reports from './pages/Reports';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';
import Permissions from './pages/Permissions';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

function AppContent() {
  const { currentUser, authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. App Initial Brand Loading Screen
  if (authLoading) {
    return <InitialLoadingScreen />;
  }

  // 2. Google Identity Sign-In Gatekeeper Page
  if (!currentUser) {
    return <LoginPage />;
  }

  // 3. Authenticated App Layout
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'users': return <UserManagement />;
      case 'hospitals': return <Hospitals />;
      case 'counters': return <Counters />;
      case 'monthly_readings': return <MonthlyReadings />;
      case 'stock': return <StockLedger />;
      case 'issue_paper': return <IssuePaper />;
      case 'paper_types': return <PaperTypes />;
      case 'consumables': return <FutureConsumables />;
      case 'reports': return <Reports />;
      case 'audit_log': return <AuditLog />;
      case 'settings': return <Settings />;
      case 'permissions': return <Permissions />;
      default: return <Dashboard />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Loader />
      <Navbar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <main style={{ flex: 1, padding: '0.75rem', overflowY: 'auto', width: '100%' }}>
          <div className="container-fluid">
            {renderContent()}
          </div>
        </main>
      </div>

      <BottomNavbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
