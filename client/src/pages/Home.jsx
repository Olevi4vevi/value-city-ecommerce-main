import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getPublicProducts, getPublicCategories } from '../api/api';
import { useCart } from '../context/CartContext';
import SiteHeader from '../components/SiteHeader';
import ProductCard from '../components/ProductCard';
import Toast from '../components/Toast';
import './home.css';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [toast, setToast] = useState(null);
  const justInTrackRef = useRef(null);
  const [justInScroll, setJustInScroll] = useState({ atStart: true, atEnd: false });

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        getPublicProducts(),
        getPublicCategories().catch(() => ({ data: [] }))
      ]);
      const list = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.products || prodRes.data.data || [];
      setProducts(list.filter((p) => p.status === 'available'));
      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data.categories || []);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Could not load products right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (location.state?.toast) {
      setToast({ message: location.state.toast, tone: 'success' });
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const isCustomerLoggedIn = !!localStorage.getItem('customerToken');

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product);
      setToast({ message: `Added "${product.name}" to your cart`, tone: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Could not add that to your cart.', tone: 'error' });
    }
  };

  const showcase = products.filter((p) => p.image_url).slice(0, 3);

  // "Just in" -- the newest listings, newest-created-first. No fake/seed
  // data here: whatever admin has actually added shows up, freshest first,
  // capped at 10 -- shown 5-at-a-time in a scrollable rail (see
  // .hm-justin-track below) so the section stays one uniform row instead
  // of growing taller as more gets added.
  const justIn = [...products]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  // One tile per category: a representative photo (first in-stock item with
  // an image) plus how many items are currently listed there. Categories
  // with zero items yet still show up -- with a "coming soon" placeholder --
  // so the grid doesn't reshuffle every time someone adds new stock. Only
  // the first 7 render here -- "View all" on the section header takes
  // shoppers to /shop, where every category lives.
  const categoryPreviews = categories.map((cat) => {
    const inCategory = products.filter((p) => p.category_id === cat.id);
    const withImage = inCategory.find((p) => p.image_url);
    return {
      id: cat.id,
      name: cat.name,
      image: withImage?.image_url || null,
      count: inCategory.length
    };
  }).slice(0, 7);

  // Keeps the prev/next arrows honest -- disabled once the rail is
  // scrolled all the way to that edge, rather than always clickable.
  const updateJustInScroll = () => {
    const track = justInTrackRef.current;
    if (!track) return;
    setJustInScroll({
      atStart: track.scrollLeft <= 4,
      atEnd: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4
    });
  };

  useEffect(() => {
    updateJustInScroll();
  }, [justIn.length]);

  const scrollJustIn = (direction) => {
    const track = justInTrackRef.current;
    if (!track) return;
    const item = track.querySelector('.hm-justin-item');
    const step = item ? item.getBoundingClientRect().width + 18 : track.clientWidth * 0.8;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <div className="home">
      <SiteHeader active="home" stuck={scrolled} />

      <section className="hm-hero">
        <div className="hm-hero-text">
          <span className="hm-eyebrow">Second-hand, sustainably sourced</span>
          <h1>Pre-loved fashion,<br />priced fairly.</h1>
          <p className="hm-lede">
            Every piece is checked, graded and photographed by hand.
            One of each — when it's gone, it's gone.
          </p>
          <div className="hm-hero-actions">
            <Link to="/shop" className="hm-btn hm-btn-lg">Shop with us</Link>
          </div>
        </div>

        <div className="hm-hero-art">
          <span className="hm-wash" aria-hidden="true" />
          {showcase.length > 0 ? (
            showcase.map((p, i) => (
              <figure key={p.id} className={`hm-frame hm-frame-${i + 1}`}>
                <img src={p.image_url} alt="" />
              </figure>
            ))
          ) : (
            <div className="hm-frame hm-frame-empty" />
          )}
        </div>
      </section>

      <section className="hm-mission">
        <div className="hm-mission-copy">
          <span className="eyebrow">Why secondhand</span>
          <h2>Good clothes shouldn't cost the earth — or your budget.</h2>
          <p>
            Every piece that comes through Value City is inspected, graded and priced
            by hand before it goes up. We're Suva-based, so there's no shipping wait —
            just pick your item up when it's ready.
          </p>
        </div>
        <div className="hm-pillars">
          <div className="hm-pillar">
            <span className="hm-pillar-num">01</span>
            <div>
              <strong>Hand-graded, every time</strong>
              <span>Condition checked and honestly labelled before it's ever listed — no surprises at pickup.</span>
            </div>
          </div>
          <div className="hm-pillar">
            <span className="hm-pillar-num">02</span>
            <div>
              <strong>One of a kind</strong>
              <span>Single pieces, never restocked. If you see it and like it, that's the only one there'll be.</span>
            </div>
          </div>
          <div className="hm-pillar">
            <span className="hm-pillar-num">03</span>
            <div>
              <strong>Suva pickup, no shipping</strong>
              <span>Collect your order locally — no delivery fees, no waiting on a courier.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Loading/error feedback for the catalog sections below -- moved up
          here (rather than tied to one specific section) since "Just in"
          and "Shop by category" both simply render nothing when there's no
          data yet, and the page needs to explain why rather than just going
          quiet. */}
      {loading && <p className="hm-status">Loading the rail…</p>}
      {error && <p className="hm-status hm-status-error">{error}</p>}

      {justIn.length > 0 && (
        <section className="hm-catalog hm-justin">
          <div className="hm-catalog-head">
            <div>
              <span className="eyebrow">Fresh off the rail</span>
              <h2 className="hm-catalog-title">Just in</h2>
              <p className="hm-justin-sub">Newest pieces added this week — most go fast.</p>
            </div>
            <Link to="/shop?sort=newest" className="hm-link">See everything new →</Link>
          </div>
          <div className="hm-justin-carousel">
            <button
              type="button"
              className="hm-justin-arrow hm-justin-arrow-prev"
              onClick={() => scrollJustIn(-1)}
              disabled={justInScroll.atStart}
              aria-label="Show previous items"
            >
              ‹
            </button>
            <div className="hm-justin-track" ref={justInTrackRef} onScroll={updateJustInScroll}>
              {justIn.map((product) => (
                <div className="hm-justin-item" key={product.id}>
                  <ProductCard
                    product={product}
                    isCustomerLoggedIn={isCustomerLoggedIn}
                    onAddToCart={handleAddToCart}
                    badge="New"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              className="hm-justin-arrow hm-justin-arrow-next"
              onClick={() => scrollJustIn(1)}
              disabled={justInScroll.atEnd}
              aria-label="Show more items"
            >
              ›
            </button>
          </div>
        </section>
      )}

      {categoryPreviews.length > 0 && (
        <section className="hm-catgrid-section">
          <div className="hm-catalog-head">
            <h2 className="hm-catalog-title">Shop by category</h2>
            <Link to="/shop" className="hm-link">View all →</Link>
          </div>
          <div className="hm-catgrid">
            {categoryPreviews.map((cat) => (
              <Link key={cat.id} to={`/shop?category=${cat.id}`} className="hm-cattile">
                <div className="hm-cattile-img">
                  {cat.image ? (
                    <img src={cat.image} alt="" />
                  ) : (
                    <span className="hm-cattile-noimg">Coming soon</span>
                  )}
                </div>
                <div className="hm-cattile-body">
                  <span className="hm-cattile-name">{cat.name}</span>
                  <span className="hm-cattile-count">{cat.count} {cat.count === 1 ? 'item' : 'items'}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="hm-foot">
        <div className="hm-foot-brand">
          <span className="hm-logo">Value City</span>
          <p>Second-hand clothing, sold fairly. Suva, Fiji.</p>
          <div className="hm-foot-pickup">⌂ Pickup only — Suva, Fiji</div>
        </div>
        <div className="hm-foot-cols">
          <div className="hm-foot-col">
            <h4>Shop</h4>
            <Link to="/shop">All categories</Link>
            <Link to="/shop?sort=newest">New arrivals</Link>
          </div>
          <div className="hm-foot-col">
            <h4>Account</h4>
            {isCustomerLoggedIn
              ? <Link to="/orders">Orders</Link>
              : <Link to="/register">Create account</Link>}
          </div>
        </div>
      </footer>

      <Toast message={toast?.message} tone={toast?.tone} onDone={() => setToast(null)} />
    </div>
  );
}