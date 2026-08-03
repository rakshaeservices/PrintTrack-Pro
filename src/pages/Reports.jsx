import React, { useState } from 'react';
import { Printer, Download, FileSpreadsheet, BarChart3, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useData } from '../context/DataContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Reports() {
  const { monthlyReadings, hospitals, counters, stockLedger, calculateHospitalStock, triggerServerAction } = useData();
  const [activeReportTab, setActiveReportTab] = useState('counter');

  // Excel 1-click Export
  const exportToExcel = async () => {
    await triggerServerAction(async () => {
      let dataToExport = [];
      let filename = 'PrintTrack_Report.xlsx';

      if (activeReportTab === 'counter') {
        filename = 'PrintTrack_Counter_Report.xlsx';
        dataToExport = monthlyReadings.map(r => ({
          Month: r.month,
          Hospital: r.hospitalName,
          Counter: r.counterName,
          Opening: r.opening,
          Closing: r.closing,
          PagesConsumption: r.consumption,
          PaperIssuedRims: r.issued,
          PaperUsedRims: r.used,
          BalanceRims: r.balance,
          Status: r.verified
        }));
      } else if (activeReportTab === 'hospital') {
        filename = 'PrintTrack_Hospital_Report.xlsx';
        dataToExport = hospitals.map(h => {
          const { totalStock, totalIssued } = calculateHospitalStock(h.id);
          const totalPages = monthlyReadings.filter(r => r.hospitalId === h.id).reduce((s, r) => s + r.consumption, 0);
          return {
            Hospital: h.name,
            Code: h.code,
            CountersCount: h.countersCount,
            TotalPagesPrinted: totalPages,
            TotalPaperIssuedRims: totalIssued,
            CurrentStockRims: totalStock
          };
        });
      } else {
        filename = 'PrintTrack_Stock_Ledger.xlsx';
        dataToExport = stockLedger.map(s => ({
          Date: s.date,
          Hospital: s.hospitalName,
          Type: s.type,
          PaperType: s.paperType,
          QtyRims: s.qty,
          Counter: s.counterName,
          Remarks: s.remarks
        }));
      }

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
      XLSX.writeFile(workbook, filename);
    }, 'Generating 1-Click Excel Export...');
  };

  // PDF Landscape Export
  const exportToPDF = async () => {
    await triggerServerAction(async () => {
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(16);
      doc.text('PrintTrack Pro - Professional Landscape Executive Report', 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated Date: ${new Date().toLocaleString()} | Hospital Network System`, 14, 22);

      let tableHead = [];
      let tableRows = [];

      if (activeReportTab === 'counter') {
        tableHead = [['Month', 'Hospital', 'Counter', 'Opening', 'Closing', 'Pages', 'Issued', 'Used', 'Balance']];
        tableRows = monthlyReadings.map(r => [
          r.month, r.hospitalName, r.counterName, r.opening, r.closing, r.consumption, `${r.issued} Rims`, `${r.used} Rims`, `${r.balance} Rims`
        ]);
      } else if (activeReportTab === 'hospital') {
        tableHead = [['Hospital Name', 'Code', 'Counters', 'Total Pages Printed', 'Paper Issued', 'Current Stock']];
        tableRows = hospitals.map(h => {
          const { totalStock, totalIssued } = calculateHospitalStock(h.id);
          const totalPages = monthlyReadings.filter(r => r.hospitalId === h.id).reduce((s, r) => s + r.consumption, 0);
          return [h.name, h.code, h.countersCount, totalPages.toLocaleString(), `${totalIssued} Rims`, `${totalStock} Rims`];
        });
      } else {
        tableHead = [['Date', 'Hospital', 'Type', 'Paper Type', 'Quantity', 'Counter / Ref', 'Remarks']];
        tableRows = stockLedger.map(s => [s.date, s.hospitalName, s.type, s.paperType, `${s.qty} Rims`, s.counterName, s.remarks]);
      }

      doc.autoTable({
        head: tableHead,
        body: tableRows,
        startY: 28,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] }
      });

      doc.save(`PrintTrack_Landscape_Report_${Date.now()}.pdf`);
    }, 'Generating PDF Landscape Report...');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Enterprise Reports & Analytics</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Counter reports, hospital summaries, stock ledgers, trend analysis & 1-click exports
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={exportToPDF}>
            <Printer size={14} color="var(--accent)" /> Professional PDF
          </button>
          <button className="btn btn-primary" onClick={exportToExcel}>
            <FileSpreadsheet size={14} /> Excel Export
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'counter', label: 'Counter Report' },
          { id: 'hospital', label: 'Hospital Report' },
          { id: 'ledger', label: 'Stock Ledger' },
          { id: 'trend', label: 'Monthly Trend' },
          { id: 'top_consumers', label: 'Top Consumers' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id)}
            className={`btn btn-sm ${activeReportTab === tab.id ? 'btn-primary' : 'btn-outline'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Counter Report */}
      {activeReportTab === 'counter' && (
        <div className="table-responsive">
          <table className="table-compact">
            <thead>
              <tr>
                <th>Counter</th>
                <th>Opening</th>
                <th>Closing</th>
                <th>Pages</th>
                <th>Issued</th>
                <th>Used</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {monthlyReadings.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{r.hospitalName} - {r.counterName}</td>
                  <td>{r.opening.toLocaleString()}</td>
                  <td>{r.closing.toLocaleString()}</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>{r.consumption.toLocaleString()}</td>
                  <td>{r.issued} Rims</td>
                  <td>{r.used} Rims</td>
                  <td style={{ fontWeight: 600 }}>{r.balance} Rims</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Hospital Report */}
      {activeReportTab === 'hospital' && (
        <div className="table-responsive">
          <table className="table-compact">
            <thead>
              <tr>
                <th>Hospital</th>
                <th>Counters</th>
                <th>Total Pages Printed</th>
                <th>Issued Rims</th>
                <th>Current Stock</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map(h => {
                const { totalStock, totalIssued } = calculateHospitalStock(h.id);
                const totalPages = monthlyReadings.filter(r => r.hospitalId === h.id).reduce((s, r) => s + r.consumption, 0);
                return (
                  <tr key={h.id}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{h.name} ({h.code})</td>
                    <td>{h.countersCount} Printers</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{totalPages.toLocaleString()}</td>
                    <td>{totalIssued} Rims</td>
                    <td><span className="badge badge-success">{totalStock} Rims</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock Ledger Report */}
      {activeReportTab === 'ledger' && (
        <div className="table-responsive">
          <table className="table-compact">
            <thead>
              <tr>
                <th>Opening</th>
                <th>Received</th>
                <th>Issued</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map(h => {
                const { totalStock, totalPurchased, totalIssued } = calculateHospitalStock(h.id);
                return (
                  <tr key={h.id}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{h.name} (150 Opening)</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>+{totalPurchased} Rims</td>
                    <td style={{ color: 'var(--warning)', fontWeight: 600 }}>-{totalIssued} Rims</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{totalStock} Rims</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Monthly Trend Report */}
      {activeReportTab === 'trend' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--clm-radius-md)', padding: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginBottom: '0.75rem' }}>Historical Monthly Trend</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { month: 'August 2026', paperRims: 238, pages: 258420 },
              { month: 'September 2026', paperRims: 241, pages: 262100 },
              { month: 'October 2026', paperRims: 220, pages: 245800 }
            ].map((t, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#0f172a', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 600, color: '#fff' }}>{t.month}</span>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t.pages.toLocaleString()} Pages</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{t.paperRims} Rims</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Consumers Report */}
      {activeReportTab === 'top_consumers' && (
        <div className="table-responsive">
          <table className="table-compact">
            <thead>
              <tr>
                <th>Top Consumer Counter</th>
                <th>Paper Consumed</th>
                <th>Page Count</th>
              </tr>
            </thead>
            <tbody>
              {[
                { counter: 'Counter 21 (City Heart Institute)', rims: '17 Rims', pages: '8,500 Pages' },
                { counter: 'Counter 18 (City Heart Institute)', rims: '15 Rims', pages: '7,500 Pages' },
                { counter: 'Counter 5 (UMMED Hospital)', rims: '13 Rims', pages: '6,100 Pages' }
              ].map((tc, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{tc.counter}</td>
                  <td style={{ fontWeight: 700, color: 'var(--warning)' }}>{tc.rims}</td>
                  <td>{tc.pages}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
