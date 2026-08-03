import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // 12 Exact Google Sheet Data Stores (Initialized Empty - No Mock Data)
  const [users, setUsers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [counters, setCounters] = useState([]);
  const [paperTypes, setPaperTypes] = useState([]);
  const [monthlyReadings, setMonthlyReadings] = useState([]);
  const [stock, setStock] = useState([]);
  const [stockLedger, setStockLedger] = useState([]);
  const [issueRegister, setIssueRegister] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState([]);
  const [monthlyPeriods, setMonthlyPeriods] = useState([]);

  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const getApiEndpoint = () => {
    const customUrl = localStorage.getItem('pt_sheets_url');
    const envUrl = import.meta.env.VITE_APPS_SCRIPT_URL;

    if (customUrl && customUrl.startsWith('http')) {
      return customUrl;
    }
    if (envUrl && envUrl.startsWith('http')) {
      return envUrl;
    }
    return 'https://script.google.com/macros/s/AKfycbzEvndxwKutCuS06LvDQb_Iu0KcutInJTdGxQ6P-BtlbbNRcfSPdyD1QcQ9J4WK73HlCw/exec';
  };

  // Fetch all 12 tabs live from Google Sheet API backend
  const fetchLiveSheetData = async () => {
    const endpoint = getApiEndpoint();
    // Only fetch if a real deployed Apps Script URL or local PHP endpoint is present
    if (endpoint && !endpoint.includes('YOUR_DEPLOYED_ID_HERE')) {
      setLoadingMessage('Fetching Live 12-Tab Data from Google Sheet Database...');
      setLoading(true);
      try {
        const res = await fetch(`${endpoint}?action=fetchAllData`, { redirect: 'follow' });
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'success' && json.data) {
            const d = json.data;
            if (Array.isArray(d.users)) setUsers(d.users);
            if (Array.isArray(d.hospitals)) setHospitals(d.hospitals);
            if (Array.isArray(d.counters)) setCounters(d.counters);
            if (Array.isArray(d.paperTypes)) setPaperTypes(d.paperTypes);
            if (Array.isArray(d.monthlyReadings)) setMonthlyReadings(d.monthlyReadings);
            if (Array.isArray(d.stock)) setStock(d.stock);
            if (Array.isArray(d.stockLedger)) setStockLedger(d.stockLedger);
            if (Array.isArray(d.issueRegister)) setIssueRegister(d.issueRegister);
            if (Array.isArray(d.permissions)) setPermissions(d.permissions);
            if (Array.isArray(d.auditLog)) setAuditLogs(d.auditLog);
            if (Array.isArray(d.settings)) setSettings(d.settings);
            if (Array.isArray(d.monthlyPeriods)) setMonthlyPeriods(d.monthlyPeriods);

            setIsLiveConnected(true);
          }
        }
      } catch (err) {
        console.log('Live backend fetch fallback active:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchLiveSheetData();
  }, []);

  const triggerServerAction = async (actionFn, msg = 'Communicating with Google Sheet Server...') => {
    setLoadingMessage(msg);
    setLoading(true);
    try {
      const result = await actionFn();
      return result;
    } finally {
      setLoading(false);
    }
  };

  const addAuditLog = (userEmail, action, oldValue, newValue) => {
    const log = {
      AuditID: 'AUD-' + Date.now(),
      DateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      UserID: userEmail || 'System',
      Module: 'System',
      Action: action,
      RecordID: 'REC-' + Date.now(),
      OldValue: String(oldValue),
      NewValue: String(newValue),
      Reason: '-',
      IPAddress: '127.0.0.1',
      Browser: 'PWA Web App'
    };
    setAuditLogs(prev => [log, ...prev]);

    // Push to configured backend endpoint with text/plain to bypass Google Apps Script CORS preflight check
    const endpoint = getApiEndpoint();
    fetch(`${endpoint}?action=appendRow`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'appendRow', tabName: 'AuditLog', rowData: Object.values(log) })
    }).catch(() => {});
  };

  const calculateHospitalStock = (hospitalId) => {
    const hEntries = stockLedger.filter(l => l.HospitalID === hospitalId || l.hospitalId === hospitalId);
    let totalStock = 0;
    let totalPurchased = 0;
    let totalIssued = 0;

    hEntries.forEach(entry => {
      const qty = parseInt(entry.QuantityIn || entry.QuantityOut || entry.qty || 0);
      const type = entry.TransactionType || entry.type;
      if (type === 'Opening') { totalStock += qty; }
      else if (type === 'Purchase' || type === 'In') { totalStock += qty; totalPurchased += qty; }
      else if (type === 'Issued' || type === 'Out') { totalStock -= qty; totalIssued += qty; }
    });

    // Check main Stock tab if available
    const stockRow = stock.find(s => s.HospitalID === hospitalId);
    if (stockRow && stockRow.CurrentStock) {
      totalStock = parseInt(stockRow.CurrentStock);
    }

    return { totalStock, totalPurchased, totalIssued };
  };

  return (
    <DataContext.Provider value={{
      loading,
      loadingMessage,
      triggerServerAction,
      isLiveConnected,
      fetchLiveSheetData,
      users, setUsers,
      hospitals, setHospitals,
      counters, setCounters,
      paperTypes, setPaperTypes,
      monthlyReadings, setMonthlyReadings,
      stock, setStock,
      stockLedger, setStockLedger,
      issueRegister, setIssueRegister,
      permissions, setPermissions,
      auditLogs, setAuditLogs,
      settings, setSettings,
      monthlyPeriods, setMonthlyPeriods,
      addAuditLog,
      calculateHospitalStock
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
