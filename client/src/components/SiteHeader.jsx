import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './SiteHeader.css';

// Shared top bar for the public storefront (Home + Shop). Pass `active` so
// the current section can be highlighted, and `stuck` if the page wants the
// "scrolled" shadow treatment (Home does this on scroll).
//
// Login/register always land the customer on Home -- the profile icon here
// is the only way into the dashboard, per the professor's feedback ("home
// page not to user dashboard unless icon profile is clicked").
export default function SiteHeader({ active, stuck = false }) {
  const navigate = useNavigate();
  const { cartCount } = useCart();

  const isCustomerLoggedIn = !!localStorage.getItem('customerToken');
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('customerUser') || '{}');
    } catch {
      return {};
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUser');
    navigate('/');
    window.location.reload();
  };

  return (
    <header className={`hm-bar${stuck ? ' is-stuck' : ''}`}>
      <Link to="/" className="hm-logo">Value City</Link>

      <nav className="hm-nav">
        <Link to="/" className={`hm-navlink${active === 'home' ? ' is-active' : ''}`}>Home</Link>
        <Link to="/shop" className={`hm-navlink${active === 'shop' ? ' is-active' : ''}`}>Shop</Link>
      </nav>

      <div className="hm-bar-right">
        <Link to="/cart" className="hm-cart-link">
          🛒 Cart
          {cartCount > 0 && <span className="hm-cart-badge">{cartCount}</span>}
        </Link>

        {isCustomerLoggedIn ? (
          <>
            <Link
              to="/dashboard"
              className="hm-profile"
              aria-label={storedUser.full_name ? `Go to ${storedUser.full_name.split(' ')[0]}'s account` : 'Go to your account'}
              title="My account"
            >
              {storedUser.full_name ? storedUser.full_name.charAt(0).toUpperCase() : 'A'}
            </Link>
            <button type="button" onClick={handleLogout} className="hm-btn-ghost">
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hm-link">Sign in</Link>
            <Link to="/register" className="hm-btn">Create account</Link>
          </>
        )}
      </div>
    </header>
  );
}
