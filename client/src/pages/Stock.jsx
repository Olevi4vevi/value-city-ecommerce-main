import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './Stock.css';

const API = 'http://localhost:5000/api/stock';
const CAT_API = 'http://localhost:5000/api/categories';
const SETTINGS_API = 'http://localhost:5000/api/settings';
const PER_PAGE = 7;

function authHeaders() {
  return { Authorization: `Bearer ${sessionStorage.getItem('token')}` };
}

function Stock() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [low, setLow] = useState(5);
  const [target, setTarget] = useState(10);
  const [amounts, setAmounts] = useState({});
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadAll = async () => {
    try {
      const [stockRes, catRes, setRes] = await Promise.all([
        axios.get(API, { headers: authHeaders() }),
        axios.get(CAT_API, { headers: authHeaders() }),
        axios.get(SETTINGS_API, { headers: authHeaders() }),
      ]);
      setProducts(stockRes.data);
      setCategories(catRes.data);
      setLow(setRes.data.low_stock_threshold);
      setTarget(setRes.data.stock_target);
    } catch (err) {
      setError('Could not load stock levels. Check that the server is running.');
    }
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { setPage(1); }, [filter]);

  const filtered = useMemo(() => {
    if (filter === 'all') return products;
    if (filter === 'attention') return products.filter(p => p.stock_quantity <= low);
    return products.filter(p => String(p.category_id) === filter);
  }, [products, filter, low]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const getAmount = (id) => amounts[id] ?? 1;
  const setAmount = (id, v) => setAmounts(prev => ({ ...prev, [id]: v }));

  const adjust = async (id, direction, amount) => {
    setBusyId(id);
    try {
      await axios.patch(`${API}/${id}/${direction}`, { amount }, { headers: authHeaders() });
      await loadAll();
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update stock. Try again.');
    } finally {
      setBusyId(null);
    }
  };

  const outCount = products.filter(p => p.stock_quantity === 0).length;
  const lowCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= low).length;
  const totalUnits = products.reduce((sum, p) => sum + p.stock_quantity, 0);

  return (
    <div className="stk">
      <header className="stk-head">
        <div>
          <span className="eyebrow">Stock room</span>
          <h1>Stock levels</h1>
        </div>
        <div className="stk-flags">
          <span className="flag"><b>{totalUnits}</b> units</span>
          <span className="flag"><b>{lowCount}</b> low</span>
          <span className="flag flag-out"><b>{outCount}</b> out</span>
        </div>
      </header>

      <div className="stk-bar">
        <nav className="seg">
          <button className={`seg-btn${filter === 'all' ? ' is-on' : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`seg-btn${filter === 'attention' ? ' is-on' : ''}`} onClick={() => setFilter('attention')}>
            Needs attention
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              className={`seg-btn${filter === String(c.id) ? ' is-on' : ''}`}
              onClick={() => setFilter(String(c.id))}
            >
              {c.name}
            </button>
          ))}
        </nav>
        <span className="stk-count">{filtered.length} {filtered.length === 1 ? 'item' : 'items'}</span>
      </div>

      {error && <p className="stk-error">{error}</p>}

      {filtered.length === 0 ? (
        <div className="stk-empty">
          {filter === 'attention' ? 'Every rail is stocked.' : 'Nothing here yet.'}
        </div>
      ) : (
        <div className="ledger">
          <div className="ledger-head">
            <span />
            <span className="eyebrow">Item</span>
            <span className="eyebrow">Level</span>
            <span className="eyebrow">On hand</span>
            <span className="eyebrow">Adjust</span>
          </div>

          <div className="ledger-body">
            {visible.map((p) => {
              const isOut = p.stock_quantity === 0;
              const isLow = !isOut && p.stock_quantity <= low;
              const pct = Math.min(100, (p.stock_quantity / target) * 100);
              const busy = busyId === p.id;

              return (
                <div key={p.id} className={`row${isOut ? ' row-out' : ''}${busy ? ' is-busy' : ''}`}>
                  <span className="row-thumb">
                    {p.image_url ? <img src={p.image_url} alt="" /> : <i />}
                  </span>

                  <span className="row-id">
                    <span className="row-name">{p.name}</span>
                    <span className="row-sub">
                      {p.category_name || 'Uncategorised'}
                      <em className={`dot dot-${p.status}`} />
                      {p.status}
                    </span>
                  </span>

                  <span className="row-meter">
                    <span className="meter">
                      <span
                        className={`meter-fill${isOut ? ' is-out' : isLow ? ' is-low' : ''}`}
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                  </span>

                  <span className="row-qty">
                    <b className={isOut ? 'is-zero' : isLow ? 'is-low' : ''}>{p.stock_quantity}</b>
                    {isOut && <em>out</em>}
                    {isLow && <em>low</em>}
                  </span>

                  <span className="row-ctrl">
                    <button
                      className="step"
                      onClick={() => adjust(p.id, 'remove', 1)}
                      disabled={busy || isOut}
                      aria-label={`Remove one ${p.name}`}
                    >−</button>
                    <button
                      className="step"
                      onClick={() => adjust(p.id, 'add', 1)}
                      disabled={busy}
                      aria-label={`Add one ${p.name}`}
                    >+</button>
                    <input
                      type="number"
                      min="1"
                      value={getAmount(p.id)}
                      onChange={(e) => setAmount(p.id, Number(e.target.value))}
                      aria-label={`Bulk amount for ${p.name}`}
                    />
                    <button onClick={() => adjust(p.id, 'add', getAmount(p.id))} disabled={busy}>Add</button>
                    <button className="btn-out" onClick={() => adjust(p.id, 'remove', getAmount(p.id))} disabled={busy}>
                      Remove
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pageCount > 1 && (
        <footer className="pager">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <span className="pager-num">{page} / {pageCount}</span>
          <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount}>Next</button>
        </footer>
      )}
    </div>
  );
}

export default Stock;