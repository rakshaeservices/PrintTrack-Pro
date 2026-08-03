import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Loader from './components/Loader';
import Dashboard from './pages/Dashboard';
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
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
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
      default: return <Dashboard />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Loader />
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
          <div className="container-fluid">
            {renderContent()}
          </div>
        </main>
      </div>
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
