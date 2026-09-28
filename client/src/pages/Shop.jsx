import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPublicProducts, getPublicCategories } from '../api/api';
import { useCart } from '../context/CartContext';
import SiteHeader from '../components/SiteHeader';
import ProductCard from '../components/ProductCard';
import Toast from '../components/Toast';
import './Shop.css';

const SORTS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

// Public "shop everything the admin has listed" page -- a row of category
// chips plus a sort control over the grid.
export default function Shop() {
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'recommended';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        getPublicProducts(),
        getPublicCategories().catch(() => ({ data: [] })),
      ]);
      const list = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.products || prodRes.data.data || [];
      setProducts(list.filter((p) => p.status === 'available'));
      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data.categories || []);
    } catch (err) {
      console.error('Failed to load the shop:', err);
      setError('Could not load products right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isCustomerLoggedIn = !!localStorage.getItem('customerToken');


  const handleAddToCart = async (product) => {
    try {
      await addToCart(product);
      setToast({ message: `Added "${product.name}" to your cart`, tone: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Could not add that to your cart.', tone: 'error' });
    }
  };

  const setCategory = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id === 'all') next.delete('category');
    else next.set('category', String(id));
    setSearchParams(next);
  };

  const setSort = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'recommended') next.delete('sort');
    else next.set('sort', value);
    setSearchParams(next);
  };

  const countsByCategory = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      const key = p.category_id ? String(p.category_id) : 'none';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (categoryParam !== 'all') {
      list = categoryParam === 'none'
        ? list.filter((p) => !p.category_id)
        : list.filter((p) => String(p.category_id) === categoryParam);
    }

    const sorted = [...list];
    if (sort === 'price_asc') sorted.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === 'price_desc') sorted.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === 'newest') sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    // 'recommended' keeps the API's default order (newest listings first)

    return sorted;
  }, [products, categoryParam, sort]);

  const activeCategoryName = categoryParam === 'all'
    ? 'All categories'
    : categoryParam === 'none'
      ? 'Uncategorised'
      : categories.find((c) => String(c.id) === categoryParam)?.name || 'Category';

  return (
    <div className="shop">
      <SiteHeader active="shop" />

      <section className="sh-head">
        <span className="eyebrow">Second-hand rail</span>
        <h1>{activeCategoryName}</h1>
        <p className="sh-count">
          {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'item' : 'items'}`}
        </p>
      </section>

      <div className="sh-filters">
        <div className="sh-chips">
          <button
            className={`sh-chip${categoryParam === 'all' ? ' is-active' : ''}`}
            onClick={() => setCategory('all')}
          >
            All <span>{products.length}</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`sh-chip${categoryParam === String(cat.id) ? ' is-active' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.name} <span>{countsByCategory[String(cat.id)] || 0}</span>
            </button>
          ))}
          {countsByCategory.none > 0 && (
            <button
              className={`sh-chip${categoryParam === 'none' ? ' is-active' : ''}`}
              onClick={() => setCategory('none')}
            >
              Uncategorised <span>{countsByCategory.none}</span>
            </button>
          )}
        </div>

        <label className="sh-sort">
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="sh-status">Loading the rail…</p>}
      {error && <p className="sh-status sh-status-error">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="sh-status">Nothing filed here yet — check back soon.</p>
      )}

      <div className="sh-grid">
        {filtered.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isCustomerLoggedIn={isCustomerLoggedIn}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>

      <Toast message={toast?.message} tone={toast?.tone} onDone={() => setToast(null)} />
    </div>
  );
}