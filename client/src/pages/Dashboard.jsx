import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import Toast from '../components/Toast';
import AdminAnalytics from './AdminAnalytics';
import './Dashboard.css';

function authHeaders() {
  return { Authorization: `Bearer ${sessionStorage.getItem('token')}` };
}

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [keyMetrics, setKeyMetrics] = useState(null);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/inventory/summary', { headers: authHeaders() })
      .then(res => setSummary(res.data))
      .catch(() => setError('Could not load inventory data. Check that the server is running.'));

    axios.get('http://localhost:5000/api/reports/key-metrics', { headers: authHeaders() })
      .then(res => setKeyMetrics(res.data))
      .catch(() => {
        setKeyMetrics('error');
        setToast({
          message: 'Service temporarily unavailable. Unable to load key metrics.',
          tone: 'error',
        });
      });
  }, []);

  if (error) return <p className="dash-error">{error}</p>;
  if (!summary) return <p className="dash-loading">Loading inventory…</p>;

  const { totals, productList, categoryBreakdown, lowThreshold } = summary;

  const tiles = [
    {
      label: 'Total Users',
      value: keyMetrics && keyMetrics !== 'error' ? keyMetrics.totalUsers : 'N/A',
      to: '/admin/users',
    },
    {
      label: 'Total Sales (FJD)',
      value: keyMetrics && keyMetrics !== 'error' ? `$${Number(keyMetrics.totalSales).toFixed(2)}` : 'N/A',
      to: '/admin/stock',
    },
    { label: 'Listings', value: totals.total_products, to: '/admin/products' },
    { label: 'Units in stock', value: totals.total_units, to: '/admin/stock' },
    { label: 'Stock value', value: `$${Number(totals.stock_value).toFixed(0)}`, to: '/admin/products' },
    {
      label: 'Needs restock',
      value: Number(totals.low_stock_count) + Number(totals.out_of_stock_count),
      to: '/admin/stock',
      alert: true,
    },
  ];

  const statusData = [
    { name: 'Available', value: Number(totals.available_count) || 0, fill: '#5C8069' },
    { name: 'Reserved', value: Number(totals.reserved_count) || 0, fill: '#C9973F' },
    { name: 'Sold', value: Number(totals.sold_count) || 0, fill: '#B8663F' },
  ];
  const statusTotal = statusData.reduce((sum, s) => sum + s.value, 0);
  const maxCategory = Math.max(...categoryBreakdown.map(c => c.product_count), 1);

  return (
    <div className="dash">
      <header className="dash-head">
        <div>
          <span className="eyebrow">Inventory floor</span>
          <h1>Reporting and Analytics</h1>
        </div>
        {tab === 'overview' && (
          <button className="dash-cta" onClick={() => navigate('/admin/products/add')}>
            List an item
          </button>
        )}
      </header>

      <nav className="seg dash-tabs">
        <button
          className={`seg-btn${tab === 'overview' ? ' is-on' : ''}`}
          onClick={() => setTab('overview')}
        >
          Overview
        </button>
        <button
          className={`seg-btn${tab === 'analytics' ? ' is-on' : ''}`}
          onClick={() => setTab('analytics')}
        >
          Analytics and Trends
        </button>
      </nav>

      {tab === 'analytics' ? (
        <AdminAnalytics />
      ) : (
        <>
          <div className="dash-tiles">
            {tiles.map((t) => (
              <button
                key={t.label}
                className={`tile${t.alert && t.value > 0 ? ' tile-alert' : ''}`}
                onClick={() => navigate(t.to)}
              >
                <span className="tile-value">{t.value}</span>
                <span className="eyebrow">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="dash-panels">
            <section className="panel">
              <span className="eyebrow">Status split</span>
              {statusTotal === 0 ? (
                <p className="panel-empty">Nothing listed yet.</p>
              ) : (
                <>
                  <div className="donut">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          dataKey="value"
                          innerRadius="62%"
                          outerRadius="100%"
                          startAngle={90}
                          endAngle={-270}
                          stroke="none"
                          paddingAngle={statusTotal > 1 ? 2 : 0}
                        >
                          {statusData.map((s) => <Cell key={s.name} fill={s.fill} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-core">
                      <span className="donut-num">{statusTotal}</span>
                    </div>
                  </div>
                  <ul className="legend">
                    {statusData.map((s) => (
                      <li key={s.name}>
                        <span className="swatch" style={{ background: s.fill }} />
                        <span className="legend-name">{s.name}</span>
                        <span className="legend-num">{s.value}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section className="panel">
              <span className="eyebrow">By category</span>
              <ul className="bars">
                {categoryBreakdown.map((c) => (
                  <li key={c.id}>
                    <button onClick={() => navigate(`/admin/categories?open=${c.id}`)}>
                      <span className="bar-name">{c.name}</span>
                      <span className="bar-track">
                        <span className="bar-fill" style={{ width: `${(c.product_count / maxCategory) * 100}%` }} />
                      </span>
                      <span className="bar-num">{c.product_count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel panel-dark">
              <div className="panel-head">
                <span className="eyebrow">All products</span>
                <span className="panel-count">{productList.length}</span>
              </div>
              {productList.length === 0 ? (
                <p className="panel-empty">Nothing listed yet.</p>
              ) : (
                <ul className="listing">
                  {productList.map((p) => {
                    const isOut = p.stock_quantity === 0;
                    const isLow = !isOut && p.stock_quantity <= lowThreshold;
                    return (
                      <li key={p.id}>
                        <button onClick={() => navigate(`/admin/products/edit/${p.id}`)}>
                          <span className="list-name">{p.name}</span>
                          <span className={`list-qty${isOut ? ' is-zero' : isLow ? ' is-low' : ''}`}>
                            {p.stock_quantity}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      <Toast
        message={toast?.message}
        tone={toast?.tone}
        onDone={() => setToast(null)}
      />
    </div>
  );
}

export default Dashboard;