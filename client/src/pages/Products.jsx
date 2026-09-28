import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import './Products.css';

const API = 'http://localhost:5000/api/products';
const PER_PAGE = 8;

const GRADE_LABEL = {
  new: 'NEW',
  like_new: 'LIKE NEW',
  good: 'GOOD',
  fair: 'FAIR',
};

function authHeaders() {
  return { Authorization: `Bearer ${sessionStorage.getItem('token')}` };
}

function Products() {
  const [products, setProducts] = useState([]);
  const [removedProducts, setRemovedProducts] = useState([]);
  const [removedLoaded, setRemovedLoaded] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState(null);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const loadProducts = async () => {
    try {
      const res = await axios.get(API, { headers: authHeaders() });
      setProducts(res.data);
    } catch (err) {
      setError('Could not load products. Check that the server is running.');
    }
  };

  const loadRemoved = async () => {
    try {
      const res = await axios.get(`${API}?deleted=true`, { headers: authHeaders() });
      setRemovedProducts(res.data);
      setRemovedLoaded(true);
    } catch (err) {
      setError('Could not load removed listings.');
    }
  };

  useEffect(() => { loadProducts(); }, []);
  useEffect(() => { setPage(1); }, [filter, query]);

  useEffect(() => {
    if (filter === 'removed' && !removedLoaded) {
      loadRemoved();
    }
  }, [filter, removedLoaded]);

  useEffect(() => {
    if (location.state?.toast) {
      setToast({ message: location.state.toast, tone: 'success' });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const isRemovedView = filter === 'removed';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = isRemovedView ? removedProducts : products;

    return source.filter(p => {
      const statusOk = isRemovedView || filter === 'all' || p.status === filter;
      const queryOk = !q
        || p.name.toLowerCase().includes(q)
        || (p.category_name || '').toLowerCase().includes(q);
      return statusOk && queryOk;
    });
  }, [products, removedProducts, isRemovedView, filter, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleStatusChange = async (id, status) => {
    try {
      await axios.patch(`${API}/${id}/status`, { status }, { headers: authHeaders() });
      loadProducts();
      setToast({ message: 'Status updated', tone: 'success' });
    } catch (err) {
      setToast({ message: 'Could not update status', tone: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!pending) return;
    const name = pending.name;
    try {
      await axios.delete(`${API}/${pending.id}`, { headers: authHeaders() });
      setPending(null);
      loadProducts();
      setRemovedLoaded(false); // force a refresh next time the Removed tab is opened
      setToast({ message: `"${name}" removed. You can restore it from the Removed tab.`, tone: 'success' });
    } catch (err) {
      setPending(null);
      setToast({ message: err.response?.data?.error || 'Could not remove the item', tone: 'error' });
    }
  };

  const handleRestore = async (p) => {
    try {
      await axios.patch(`${API}/${p.id}/restore`, {}, { headers: authHeaders() });
      loadRemoved();
      loadProducts();
      setToast({ message: `"${p.name}" restored`, tone: 'success' });
    } catch (err) {
      setToast({ message: 'Could not restore the item', tone: 'error' });
    }
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'available', label: 'Available' },
    { key: 'reserved', label: 'Reserved' },
    { key: 'sold', label: 'Sold' },
    { key: 'removed', label: 'Removed' },
  ];

  return (
    <div className="prod">
      <header className="prod-head">
        <div>
          <span className="eyebrow">The rail</span>
          <h1>Listings</h1>
        </div>
        <Link to="/admin/products/add" className="prod-cta">List an item</Link>
      </header>

      <div className="prod-bar">
        <nav className="seg">
          {filters.map(f => (
            <button
              key={f.key}
              className={`seg-btn${filter === f.key ? ' is-on' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </nav>

        <div className="prod-bar-right">
          <div className="prod-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or section"
              aria-label="Search listings"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>
            )}
          </div>
          <span className="prod-count">
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      {error && <p className="prod-error">{error}</p>}

      {filtered.length === 0 ? (
        <div className="prod-empty">
          <p>
            {query
              ? `No listings match "${query}".`
              : isRemovedView
                ? 'Nothing has been removed.'
                : filter === 'all'
                  ? 'The rail is empty.'
                  : `Nothing marked ${filter}.`}
          </p>
          {query
            ? <button className="prod-cta" onClick={() => setQuery('')}>Clear search</button>
            : (!isRemovedView && filter === 'all') && (
              <Link to="/admin/products/add" className="prod-cta">List your first item</Link>
            )}
        </div>
      ) : (
        <div className="prod-grid">
          {visible.map((p) => (
            <article key={p.id} className="card">
              <div className="card-img">
                {p.image_url
                  ? <img src={p.image_url} alt="" />
                  : <span className="eyebrow">No image</span>}
                <span className={`tag tag-${p.status}`}>{p.status}</span>
              </div>

              <div className="card-body">
                <span className="eyebrow">{p.category_name || 'Uncategorised'}</span>
                <h2>{p.name}</h2>
                <div className="card-meta">
                  <span className="card-price">${Number(p.price).toFixed(2)}</span>
                  <span className="grade-chip">{GRADE_LABEL[p.condition_grade] || p.condition_grade}</span>
                </div>
                <div className="card-stock">
                  <span className="eyebrow">Stock</span>
                  <span className={`stock-num${p.stock_quantity === 0 ? ' is-zero' : ''}`}>
                    {p.stock_quantity}
                  </span>
                </div>
                {isRemovedView && p.deleted_at && (
                  <div className="card-stock">
                    <span className="eyebrow">Removed</span>
                    <span>{new Date(p.deleted_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="card-foot">
                {isRemovedView ? (
                  <button className="prod-cta" onClick={() => handleRestore(p)}>Restore listing</button>
                ) : (
                  <>
                    <select
                      value={p.status}
                      onChange={(e) => handleStatusChange(p.id, e.target.value)}
                      aria-label={`Status for ${p.name}`}
                    >
                      <option value="available">Available</option>
                      <option value="reserved">Reserved</option>
                      <option value="sold">Sold</option>
                    </select>
                    <button onClick={() => navigate(`/admin/products/edit/${p.id}`)}>Edit</button>
                    <button className="btn-del" onClick={() => setPending(p)}>Delete</button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <footer className="pager">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <span className="pager-num">{page} / {pageCount}</span>
          <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount}>Next</button>
        </footer>
      )}

      <ConfirmDialog
        open={!!pending}
        title={`Remove "${pending?.name}"?`}
        message="This listing will be taken off the rail and hidden from customers."
        detail="It's not permanently deleted — you can bring it back anytime from the Removed tab."
        confirmLabel="Remove listing"
        onConfirm={confirmDelete}
        onCancel={() => setPending(null)}
      />

      <Toast
        message={toast?.message}
        tone={toast?.tone}
        onDone={() => setToast(null)}
      />
    </div>
  );
}

export default Products;