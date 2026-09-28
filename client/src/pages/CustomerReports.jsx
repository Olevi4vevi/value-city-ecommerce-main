import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getSpendingSummaryReport } from '../api/api';
import './customerDashboard.css';
import './Reports.css';

export default function CustomerReports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formError, setFormError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setDownloadError('');

    if (!startDate || !endDate) {
      setFormError('Time range is required to generate a report.');
      setReport(null);
      return;
    }
    if (endDate < startDate) {
      setFormError('The selected time range is invalid. The end date must be on or after the start date.');
      setReport(null);
      return;
    }
    setFormError('');
    setGenerating(true);
    setReport(null);

    try {
      const res = await getSpendingSummaryReport(startDate, endDate);
      setReport(res.data);
    } catch (err) {
      const code = err.response?.data?.error;
      if (err.response?.status === 400 && code === 'missing') {
        setFormError('Time range is required to generate a report.');
      } else if (err.response?.status === 400 && code === 'invalid') {
        setFormError('The selected time range is invalid. Please check your dates and try again.');
      } else {
        setReport({ error: 'Service temporarily unavailable.' });
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!report || report.error || !report.hasData) return;

    try {
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text('Value City', 14, 18);
      doc.setFontSize(12);
      doc.text('Spending Summary Report', 14, 26);
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(`${report.startDate} to ${report.endDate} · generated ${new Date().toLocaleString()}`, 14, 33);

      autoTable(doc, {
        startY: 40,
        head: [['Date', 'Orders', 'Spent (FJD)']],
        body: report.series.map((b) => [b.label, b.orders, `$${Number(b.spent).toFixed(2)}`]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [36, 57, 46] },
      });

      const totalOrders = report.series.reduce((sum, b) => sum + b.orders, 0);
      const totalSpent = report.series.reduce((sum, b) => sum + Number(b.spent), 0);
      const finalY = doc.lastAutoTable.finalY || 40;
      doc.setFontSize(10);
      doc.setTextColor(30, 42, 34);
      doc.text(`Total orders: ${totalOrders}   Total spent: $${totalSpent.toFixed(2)} FJD`, 14, finalY + 10);

      doc.save(`value-city-spending-summary-${report.startDate}-to-${report.endDate}.pdf`);
    } catch {
      setDownloadError('Unable to start download, please check your browser settings.');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>My Reports</h1>
      </header>

      <div className="rpt-form">
        <div className="rpt-dates">
          <label>
            <span className="eyebrow">Start date</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label>
            <span className="eyebrow">End date</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
          <button className="link-btn" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating…' : 'Generate report'}
          </button>
        </div>

        {formError && <p className="status-error">{formError}</p>}
      </div>

      {report && (
        <section className="rpt-preview">
          {report.error ? (
            <p className="status-error">{report.error}</p>
          ) : !report.hasData ? (
            <p>No information found for the selected criteria.</p>
          ) : (
            <>
              <div className="dashboard-header-actions rpt-preview-head">
                <div>
                  <h2>Spending Summary Report</h2>
                  <span className="rpt-meta">
                    {report.startDate} to {report.endDate} · generated {new Date().toLocaleString()}
                  </span>
                </div>
                <button className="link-btn" onClick={handleDownloadPdf}>Download PDF</button>
              </div>

              {downloadError && <p className="status-error">{downloadError}</p>}

              <div className="rpt-table-wrap">
                <table className="rpt-table">
                  <thead>
                    <tr><th>Date</th><th>Orders</th><th>Spent (FJD)</th></tr>
                  </thead>
                  <tbody>
                    {report.series.map((b) => (
                      <tr key={b.key}>
                        <td>{b.label}</td>
                        <td>{b.orders}</td>
                        <td>${Number(b.spent).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
