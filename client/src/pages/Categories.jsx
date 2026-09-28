import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ConfirmDialog from '../components/ConfirmDialog';
import './Categories.css';

const CAT_API = 'http://localhost:5000/api/categories';
const PROD_API = 'http://localhost:5000/api/products';

const GRADE_LABEL = {
  new: 'NEW',
  like_new: 'LIKE NEW',
  good: 'GOOD',
  fair: 'FAIR',
};

function authHeaders() {
  return { Authorization: `Bearer ${sessionStorage.getItem('token')}` };
}

function Categories() {
  const [searchParams, setSearchParams] = useSearchParams();
  const openParam = searchParams.get('open');

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [managing, setManaging] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [error, setError] = useState('');

  const loadAll = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        axios.get(CAT_API, { headers: authHeaders() }),
        axios.get(PROD_API, { headers: authHeaders() }),
      ]);
      setCategories(catRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      setError('Could not load categories. Check that the server is running.');
    }
  };

  useEffect(() => { loadAll(); }, []);

  const openCategory = (id) => setSearchParams({ open: String(id) });
  const closeCategory = () => setSearchParams({});

  const grouped = useMemo(() => {
    const map = {};
    categories.forEach(c => { map[String(c.id)] = []; });
    products.forEach(p => {
      const key = String(p.category_id);
      if (p.category_id && map[key]) map[key].push(p);
    });
    return map;
  }, [categories, products]);

  const uncategorised = useMemo(
    () => products.filter(p => !p.category_id),
    [products]
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!newName.trim()) return;
    try {
      await axios.post(CAT_API, { name: newName.trim() }, { headers: authHeaders() });
      setNewName('');
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add that section.');
    }
  };

  const saveEdit = async (id) => {
    if (!editingName.trim()) return;
    try {
      await axios.put(`${CAT_API}/${id}`, { name: editingName.trim() }, { headers: authHeaders() });
      setEditingId(null);
      setEditingName('');
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not rename that section.');
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await axios.delete(`${CAT_API}/${pendingDelete.id}`, { headers: authHeaders() });
      setPendingDelete(null);
      loadAll();
    } catch (err) {
      setPendingDelete(null);
      setError('Could not delete that section.');
    }
  };

  if (openParam) {
    const openCat = categories.find(c => String(c.id) === openParam);
    const openItems = openParam === 'none' ? uncategorised : (grouped[openParam] || []);

    return (
      <div className="cats">
        <header className="cats-head">
          <div>
            <button className="crumb" onClick={closeCategory}>← All sections</button>
            <h1>{openParam === 'none' ? 'Uncategorised' : (openCat?.name || 'Section')}</h1>
          </div>
          <span className="cats-count">
            {openItems.length} {openItems.length === 1 ? 'item' : 'items'}
          </span>
        </header>

        {openItems.length === 0 ? (
          <div className="cats-empty">
            <p>Nothing filed here yet.</p>
            <Link to="/admin/products/add" className="cats-cta">List an item</Link>
          </div>
        ) : (
          <div className="drill">
            {openItems.map(p => (
              <article key={p.id} className="drill-card">
                <div className="drill-img">
                  {p.image_url ? <img src={p.image_url} alt="" /> : <span className="eyebrow">No image</span>}
                  <span className={`tag tag-${p.status}`}>{p.status}</span>
                </div>
                <div className="drill-body">
                  <h2>{p.name}</h2>
                  <div className="drill-meta">
                    <span className="drill-price">${Number(p.price).toFixed(2)}</span>
                    <span className="grade-chip">{GRADE_LABEL[p.condition_grade] || p.condition_grade}</span>
                  </div>
                  <div className="drill-stock">
                    <span className="eyebrow">Stock</span>
                    <span className={`stock-num${p.stock_quantity === 0 ? ' is-zero' : ''}`}>{p.stock_quantity}</span>
                  </div>
                </div>
                <Link to={`/admin/products/edit/${p.id}`} className="drill-edit">Edit</Link>
              </article>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="cats">
      <header className="cats-head">
        <div>
          <span className="eyebrow">Rail sections</span>
          <h1>Categories</h1>
        </div>
        <div className="cats-head-right">
          <span className="cats-count">
            {categories.length} {categories.length === 1 ? 'section' : 'sections'}
          </span>
          <button className={`manage-btn${managing ? ' is-on' : ''}`} onClick={() => setManaging(!managing)}>
            {managing ? 'Done' : 'Manage'}
          </button>
        </div>
      </header>

      {error && <p className="cats-error">{error}</p>}

      {managing && (
        <div className="manage-bar">
          <form onSubmit={handleAdd}>
            <input
              type="text"
              placeholder="New section name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={80}
            />
            <button type="submit">Add section</button>
          </form>
          <p className="manage-note">Deleting a section keeps its items — they move to Uncategorised.</p>
        </div>
      )}

      <div className="tiles">
        {categories.map(cat => {
          const items = grouped[String(cat.id)] || [];
          const cover = items.find(p => p.image_url)?.image_url;
          return (
            <article key={cat.id} className="tile-cat">
              <button className="tile-open" onClick={() => openCategory(cat.id)}>
                <span className="tile-img">
                  {cover && <img src={cover} alt="" />}
                  <span className="tile-word">{cat.name}</span>
                </span>
                <span className="tile-bar">
                  {editingId === cat.id ? (
                    <input
                      className="tile-rename"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      maxLength={80}
                      autoFocus
                    />
                  ) : (
                    <span className="tile-name">{cat.name}</span>
                  )}
                  <span className="tile-num">{items.length}</span>
                </span>
              </button>

              {managing && (
                <div className="tile-acts">
                  {editingId === cat.id ? (
                    <>
                      <button onClick={() => saveEdit(cat.id)}>Save</button>
                      <button onClick={() => { setEditingId(null); setEditingName(''); }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }}>Rename</button>
                      <button className="btn-del" onClick={() => setPendingDelete(cat)}>Delete</button>
                    </>
                  )}
                </div>
              )}
            </article>
          );
        })}

        {uncategorised.length > 0 && (
          <article className="tile-cat">
            <button className="tile-open" onClick={() => openCategory('none')}>
              <span className="tile-img is-none">
                <span className="tile-word">Unfiled</span>
              </span>
              <span className="tile-bar">
                <span className="tile-name">Uncategorised</span>
                <span className="tile-num">{uncategorised.length}</span>
              </span>
            </button>
          </article>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete "${pendingDelete?.name}"?`}
        message="This section will be removed from the rail."
        detail="Items filed here won't be deleted — they'll move to Uncategorised."
        confirmLabel="Delete section"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

export default Categories;