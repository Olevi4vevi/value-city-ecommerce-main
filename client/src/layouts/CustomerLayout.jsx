import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import './CustomerLayout.css';

const NAV_LINKS = [
  { to: '/dashboard', text: 'My account', end: true },
  { to: '/orders', text: 'Orders', end: true },
  { to: '/reports', text: 'My Reports', end: true },
];

function CustomerLayout() {
  const navigate = useNavigate();

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('customerUser') || '{}');
    } catch {
      return {};
    }
  })();
  const displayName = storedUser.full_name || 'Customer';
  const firstName = displayName.split(' ')[0];
  const initials = displayName.slice(0, 1).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUser');
    navigate('/login');
  };

  return (
    <div className="cust-shell">
      <header className="cust-bar">
        <Link to="/" className="cust-logo">Value City</Link>

        <nav className="cust-nav">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `cust-nav-link${isActive ? ' is-on' : ''}`}
            >
              {link.text}
            </NavLink>
          ))}
          <Link to="/shop" className="cust-nav-link">Shop</Link>
        </nav>

        <div className="cust-user">
          <span className="cust-avatar">{initials}</span>
          <span className="cust-name">{firstName}</span>
          <button onClick={handleLogout} className="cust-logout">Sign out</button>
        </div>
      </header>

      <main className="cust-main">
        <Outlet />
      </main>
    </div>
  );
}

export default CustomerLayout;