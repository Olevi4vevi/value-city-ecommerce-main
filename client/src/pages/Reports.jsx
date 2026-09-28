import { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Reports.css';

const REPORT_TYPES = [
  { key: 'sales-trend', label: 'Sales Trends' },
  { key: 'order-stats', label: 'Order Statistics' },
];

function authHeaders() {
  return { Authorization: `Bearer ${sessionStorage.getItem('token')}` };
}

function Reports() {
  const [reportType, setReportType] = useState('sales-trend');
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
      const res = await axios.get(`http://localhost:5000/api/reports/${reportType}`, {
        headers: authHeaders(),
        params: { startDate, endDate },
      });
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
      const title = reportType === 'sales-trend' ? 'Sales Trends Report' : 'Order Statistics Report';

      doc.setFontSize(16);
      doc.text('Value City', 14, 18);
      doc.setFontSize(12);
      doc.text(title, 14, 26);
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(`${report.startDate} to ${report.endDate} · generated ${new Date().toLocaleString()}`, 14, 33);

      if (reportType === 'sales-trend') {
        autoTable(doc, {
          startY: 40,
          head: [['Date', 'Orders placed', 'Revenue (FJD)']],
          body: report.series.map((b) => [b.label, b.volume, `$${Number(b.revenue).toFixed(2)}`]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [36, 57, 46] },
        });

        const totalVolume = report.series.reduce((sum, b) => sum + b.volume, 0);
        const totalRevenue = report.series.reduce((sum, b) => sum + Number(b.revenue), 0);
        const finalY = doc.lastAutoTable.finalY || 40;
        doc.setFontSize(10);
        doc.setTextColor(30, 42, 34);
        doc.text(`Total orders: ${totalVolume}   Total revenue: $${totalRevenue.toFixed(2)} FJD`, 14, finalY + 10);
      } else {
        autoTable(doc, {
          startY: 40,
          head: [['Date', 'Pending', 'Paid', 'Shipped', 'Completed', 'Cancelled', 'Total']],
          body: report.series.map((b) => [b.label, b.pending, b.paid, b.shipped, b.completed, b.cancelled, b.total]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [36, 57, 46] },
        });

        const totalOrders = report.series.reduce((sum, b) => sum + b.total, 0);
        const finalY = doc.lastAutoTable.finalY || 40;
        doc.setFontSize(10);
        doc.setTextColor(30, 42, 34);
        doc.text(`Total orders: ${totalOrders}`, 14, finalY + 10);
      }

      doc.save(`value-city-${reportType}-${report.startDate}-to-${report.endDate}.pdf`);
    } catch {
      setDownloadError('Unable to start download, please check your browser settings.');
    }
  };

  return (
    <div className="rpt">
      <header className="rpt-head">
        <div>
          <span className="eyebrow">Value City</span>
          <h1>Reports</h1>
        </div>
      </header>

      <div className="rpt-form">
        <nav className="seg">
          {REPORT_TYPES.map((t) => (
            <button
              key={t.key}
              className={`seg-btn${reportType === t.key ? ' is-on' : ''}`}
              onClick={() => { setReportType(t.key); setReport(null); }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="rpt-dates">
          <label>
            <span className="eyebrow">Start date</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label>
            <span className="eyebrow">End date</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
          <button className="rpt-cta" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating…' : 'Generate report'}
          </button>
        </div>

        {formError && <p className="rpt-error">{formError}</p>}
      </div>

      {report && (
        <section className="rpt-preview">
          {report.error ? (
            <p className="rpt-error">{report.error}</p>
          ) : !report.hasData ? (
            <p className="rpt-empty">No information found for the selected criteria.</p>
          ) : (
            <>
              <div className="rpt-preview-head">
                <div>
                  <span className="eyebrow">Value City</span>
                  <h2>{reportType === 'sales-trend' ? 'Sales Trends Report' : 'Order Statistics Report'}</h2>
                  <span className="rpt-meta">
                    {report.startDate} to {report.endDate} · generated {new Date().toLocaleString()}
                  </span>
                </div>
                <button className="rpt-cta" onClick={handleDownloadPdf}>Download PDF</button>
              </div>

              {downloadError && <p className="rpt-error">{downloadError}</p>}

              <div className="rpt-table-wrap">
                <table className="rpt-table">
                  <thead>
                    {reportType === 'sales-trend' ? (
                      <tr><th>Date</th><th>Orders placed</th><th>Revenue (FJD)</th></tr>
                    ) : (
                      <tr>
                        <th>Date</th><th>Pending</th><th>Paid</th><th>Shipped</th>
                        <th>Completed</th><th>Cancelled</th><th>Total</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {report.series.map((b) => (
                      <tr key={b.key}>
                        {reportType === 'sales-trend' ? (
                          <>
                            <td>{b.label}</td>
                            <td>{b.volume}</td>
                            <td>${Number(b.revenue).toFixed(2)}</td>
                          </>
                        ) : (
                          <>
                            <td>{b.label}</td>
                            <td>{b.pending}</td>
                            <td>{b.paid}</td>
                            <td>{b.shipped}</td>
                            <td>{b.completed}</td>
                            <td>{b.cancelled}</td>
                            <td>{b.total}</td>
                          </>
                        )}
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

export default Reports;
