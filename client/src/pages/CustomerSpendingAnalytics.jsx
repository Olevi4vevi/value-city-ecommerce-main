import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getSpendingSummary } from '../api/api';

const RANGES = [
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 3 months' },
  { key: '6m', label: 'Last 6 months' },
  { key: '1y', label: 'Last year' },
];

export default function CustomerSpendingAnalytics() {
  const [range, setRange] = useState('6m');
  const [report, setReport] = useState(null);

  useEffect(() => {
    // Intentional: show the loading state immediately while the range change refetches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReport(null);
    getSpendingSummary(range)
      .then(res => setReport(res.data))
      .catch(() => setReport('error'));
  }, [range]);

  return (
    <div className="acct-analytics">
      <div className="acct-panel-head">
        <h2>My spending analytics</h2>
      </div>

      <nav className="acct-seg">
        {RANGES.map((r) => (
          <button
            key={r.key}
            className={`acct-seg-btn${range === r.key ? ' is-on' : ''}`}
            onClick={() => setRange(r.key)}
          >
            {r.label}
          </button>
        ))}
      </nav>

      {report === null ? (
        <p className="acct-note">Loading…</p>
      ) : report === 'error' ? (
        <p className="acct-error">Service temporarily unavailable.</p>
      ) : !report.hasData ? (
        <p className="acct-note">No information found for the selected criteria.</p>
      ) : (
        <div className="acct-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={report.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
              <Area type="monotone" dataKey="spent" name="Spent (FJD)" stroke="#24392E" fill="#8FB39B" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
