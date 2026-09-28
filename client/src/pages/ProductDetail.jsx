import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getPublicProduct, getPublicProducts, getPublicCategories } from '../api/api';
import { useCart } from '../context/CartContext';
import { GRADE_LABEL } from '../constants/productLabels';
import SiteHeader from '../components/SiteHeader';
import ProductCard from '../components/ProductCard';
import Toast from '../components/Toast';
import './ProductDetail.css';

// Full product page -- replaces the old click-to-open ProductQuickView modal.
// Reached from any ProductCard (Home's "Just in" rail, the Shop grid) via
// /product/:id. Reuses admin's existing public GET /api/products/:id
// endpoint as-is (see server/controllers/productController.js -- that file
// is Sim's/admin's module and isn't touched here); since that endpoint
// doesn't JOIN categories or filter by availability the way the list
// endpoint does, both of those are handled client-side below instead.
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [toast, setToast] = useState(null);
  const addedTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setProduct(null);

    const load = async () => {
      try {
        const [prodRes, catRes, allRes] = await Promise.all([
          getPublicProduct(id),
          getPublicCategories().catch(() => ({ data: [] })),
          getPublicProducts().catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;

        const found = prodRes.data?.product || prodRes.data;
        if (!found || !found.id) {
          setNotFound(true);
          return;
        }

        setProduct(found);
        setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data.categories || []);
        const list = Array.isArray(allRes.data) ? allRes.data : allRes.data.products || allRes.data.data || [];
        setAllProducts(list);
      } catch (err) {
        console.error('Failed to load this product:', err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [id]);

  // Scroll to the top of the new page on every navigation here -- otherwise
  // clicking a "similar item" leaves the scroll position wherever it was on
  // the previous product's page.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Clears the "Added ✓" confirmation timer if the shopper navigates away
  // (e.g. to a similar item) before it finishes.
  useEffect(() => () => clearTimeout(addedTimerRef.current), []);

  const isCustomerLoggedIn = !!localStorage.getItem('customerToken');
  // The main product's "Add to cart" button -- flips to a brief "Added ✓"
  // confirmation on success instead of a toast, since it's already right
  // next to the price.
  // Turns a failed cart request into something useful for the shopper.
  // customerAuth middleware replies 401/403 with { message } (not { error })
  // when the login token is missing or expired -- in that case clear the
  // stale token and send them to sign in again instead of a vague toast.
  const handleCartError = (err) => {
    const status = err.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('customerToken');
      navigate('/login');
      return;
    }
    const reason = err.response?.data?.error || err.response?.data?.message;
    setToast({
      message: reason || (err.response ? 'Could not add that to your cart.' : 'Could not reach the server. Please try again.'),
      tone: 'error',
    });
  };

  const handleAddToCart = async () => {
    if (!isCustomerLoggedIn) return navigate('/login');
    try {
      await addToCart(product);
      setAddedToCart(true);
      clearTimeout(addedTimerRef.current);
      addedTimerRef.current = setTimeout(() => setAddedToCart(false), 1600);
    } catch (err) {
      handleCartError(err);
    }
  };

  // "Similar items" cards use the shared toast pattern (same as Home/Shop)
  // since there's no per-card confirmation state down there.
  const handleAddSimilarToCart = async (similarProduct) => {
    try {
      await addToCart(similarProduct);
      setToast({ message: `Added "${similarProduct.name}" to your cart`, tone: 'success' });
    } catch (err) {
      handleCartError(err);
    }
  };

  const categoryName = product?.category_name
    || categories.find((c) => c.id === product?.category_id)?.name
    || 'Uncategorised';

  // Same category, in stock, excluding the item itself -- capped to a
  // tidy row rather than dumping the whole category underneath.
  const similar = product
    ? allProducts
      .filter((p) => p.id !== product.id)
      .filter((p) => p.status === 'available')
      .filter((p) => p.category_id && p.category_id === product.category_id)
      .slice(0, 6)
    : [];

  if (loading) {
    return (
      <div className="pd">
        <SiteHeader active="shop" />
        <p className="pd-status">Loading this item…</p>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="pd">
        <SiteHeader active="shop" />
        <div className="pd-notfound">
          <span className="eyebrow">Hmm</span>
          <h1>We couldn't find that item.</h1>
          <p>It may have sold out or been taken down.</p>
          <Link to="/shop" className="hm-btn hm-btn-lg">Back to shop</Link>
        </div>
      </div>
    );
  }

  const stockQty = Number(product.stock_quantity);
  const isOut = Number.isFinite(stockQty) && stockQty === 0;
  const isUnavailable = product.status && product.status !== 'available';
  const hasDescription = !!product.description?.trim();

  return (
    <div className="pd">
      <SiteHeader active="shop" />

      <nav className="pd-crumb">
        <Link to="/shop">Shop</Link>
        <span>/</span>
        <Link to={`/shop?category=${product.category_id || ''}`}>{categoryName}</Link>
        <span>/</span>
        <span className="pd-crumb-current">{product.name}</span>
      </nav>

      <section className="pd-main">
        <div className="pd-media">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} />
          ) : (
            <span className="pd-noimg">No photo</span>
          )}
        </div>

        <div className="pd-info">
          <span className="pd-cat">{categoryName}</span>
          <h1>{product.name}</h1>

          <div className="pd-meta">
            {product.condition_grade && (
              <span className="pd-chip">{GRADE_LABEL[product.condition_grade] || product.condition_grade}</span>
            )}
            {(isOut || isUnavailable) ? (
              <span className="pd-stock is-out">Out of stock</span>
            ) : Number.isFinite(stockQty) ? (
              <span className="pd-stock">{stockQty} in stock</span>
            ) : null}
          </div>

          <div className="pd-price">
            ${Number(product.price).toFixed(2)}
          </div>

          <div className="pd-btn-row">
            <button
              type="button"
              className={`pd-cart${addedToCart ? ' is-added' : ''}`}
              onClick={handleAddToCart}
              disabled={isOut || isUnavailable}
            >
              {isOut || isUnavailable
                ? 'Currently unavailable'
                : addedToCart
                  ? 'Added ✓'
                  : 'Add to cart'}
            </button>
          </div>

          <div className="pd-desc-wrap">
            <span className="eyebrow">Description</span>
            <p className={`pd-desc${hasDescription ? '' : ' is-empty'}`}>
              {hasDescription ? product.description : 'No description added for this item yet.'}
            </p>
          </div>

          <p className="pd-note">One of each — once it's gone, it's gone. Pickup only, Suva, Fiji.</p>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="pd-similar">
          <div className="pd-similar-head">
            <h2>Similar items</h2>
            <Link to={`/shop?category=${product.category_id}`} className="hm-link">See more in {categoryName} →</Link>
          </div>
          <div className="pd-similar-grid">
            {similar.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isCustomerLoggedIn={isCustomerLoggedIn}
                onAddToCart={handleAddSimilarToCart}
              />
            ))}
          </div>
        </section>
      )}

      <Toast message={toast?.message} tone={toast?.tone} onDone={() => setToast(null)} />
    </div>
  );
}