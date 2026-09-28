import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ComposedChart, Bar, Line, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import './AdminAnalytics.css';

const RANGES = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: '6m', label: 'Last 6 months' },
  { key: '1y', label: 'Last year' },
];

const STATUS_COLORS = {
  pending: '#C9973F',
  paid: '#5C8069',
  shipped: '#2C5F4F',
  completed: '#24392E',
  cancelled: '#B8663F',
};

function authHeaders() {
  return { Authorization: `Bearer ${sessionStorage.getItem('token')}` };
}

function useReport(endpoint, range) {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Intentional: show the loading state immediately while the range change refetches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(null);
    axios.get(`http://localhost:5000/api/reports/${endpoint}`, {
      headers: authHeaders(),
      params: { range },
    })
      .then(res => setState(res.data))
      .catch(() => setState('error'));
  }, [endpoint, range]);

  return state;
}

function ChartFrame({ title, report, children }) {
  return (
    <section className="panel an-panel">
      <span className="eyebrow">{title}</span>
      {report === null ? (
        <p className="panel-empty">Loading…</p>
      ) : report === 'error' ? (
        <p className="an-error">Service temporarily unavailable.</p>
      ) : !report.hasData ? (
        <p className="panel-empty">No information found for the selected criteria.</p>
      ) : (
        children
      )}
    </section>
  );
}

function AdminAnalytics() {
  const [range, setRange] = useState('30d');
  const salesTrend = useReport('sales-trend', range);
  const orderStats = useReport('order-stats', range);

  return (
    <div className="an">
      <nav className="seg">
        {RANGES.map((r) => (
          <button
            key={r.key}
            className={`seg-btn${range === r.key ? ' is-on' : ''}`}
            onClick={() => setRange(r.key)}
          >
            {r.label}
          </button>
        ))}
      </nav>

      <div className="an-panels">
        <ChartFrame title="Sales trend" report={salesTrend}>
          <div className="an-chart">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={salesTrend?.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="volume" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis yAxisId="revenue" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value, name) => (name === 'Revenue (FJD)' ? `$${Number(value).toFixed(2)}` : value)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="volume" dataKey="volume" name="Orders placed" fill="#8FB39B" barSize={18} />
                <Line yAxisId="revenue" type="monotone" dataKey="revenue" name="Revenue (FJD)" stroke="#24392E" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>

        <ChartFrame title="Order statistics" report={orderStats}>
          <div className="an-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderStats?.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <Bar key={status} dataKey={status} name={status} stackId="orders" fill={color} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>
      </div>
    </div>
  );
}

export default AdminAnalytics;
