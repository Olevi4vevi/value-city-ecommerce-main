import { useNavigate } from 'react-router-dom';
import './ProductCard.css';

// A single rail item. Clicking anywhere on the card goes to that product's
// own page (see pages/ProductDetail.jsx) so shoppers can read the full
// description, condition and similar items before deciding to buy. The
// hover panel shows the price as a plain, non-interactive label; "Add to
// cart" is the only action and stops propagation so it doesn't also
// navigate away. Price is public (no sign-in needed); signed-out shoppers
// who click "Add to cart" are sent to /login. onAddToCart is optional --
// callers that don't pass it just don't get the button.
export default function ProductCard({ product, isCustomerLoggedIn, onAddToCart, badge }) {
  const navigate = useNavigate();
  const handleOpen = () => navigate(`/product/${product.id}`);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (!isCustomerLoggedIn) {
      navigate('/login');
      return;
    }
    onAddToCart(product);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpen();
    }
  };

  return (
    <article
      className="pc"
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${product.name}`}
    >
      <div className="pc-img">
        {badge && <span className="pc-badge">{badge}</span>}
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} />
        ) : (
          <span className="pc-noimg">No photo</span>
        )}
        <div className="pc-hover">
          <span className="pc-price">${Number(product.price).toFixed(2)}</span>
          {onAddToCart && (
            <button type="button" className="pc-cart" onClick={handleAdd}>
              Add to cart
            </button>
          )}
        </div>
      </div>

      <div className="pc-body">
        <span className="pc-cat">{product.category_name || 'Uncategorised'}</span>
        <h3>{product.name}</h3>
      </div>
    </article>
  );
}