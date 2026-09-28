import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './AdminLayout.css';
import NotificationBell from '../pages/NotificationBell';

const icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  products: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20 7l-8-4-8 4 8 4 8-4z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M12 11v10"/></svg>,
  add: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 5v14M5 12h14"/></svg>,
  categories: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="6" rx="1.5"/><rect x="3" y="13" width="18" height="8" rx="1.5"/></svg>,
  stock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 8L12 3 3 8m18 0l-9 5m9-5v9l-9 5m0-9L3 8m9 5v9M3 8v9l9 5"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  reports: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  collapse: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M15 6l-6 6 6 6"/></svg>,
  expand: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 6l6 6-6 6"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>,
};

const NAV_GROUPS = [
  {
    label: 'Overview',
    links: [
      { to: '/admin/dashboard', icon: 'dashboard', text: 'Dashboard', end: true },
      { to: '/admin/users', icon: 'users', text: 'Users', end: true },
      { to: '/admin/reports', icon: 'reports', text: 'Reports', end: true },
    ],
  },
  {
    label: 'Product',
    links: [
      { to: '/admin/products', icon: 'products', text: 'View Products', end: true },
      { to: '/admin/products/add', icon: 'add', text: 'Add Product', end: true },
    ],
  },
  {
    label: 'Inventory',
    links: [
      { to: '/admin/categories', icon: 'categories', text: 'Categories', end: true },
      { to: '/admin/stock', icon: 'stock', text: 'Stock', end: true },
    ],
  },
  {
    label: 'Account',
    links: [{ to: '/admin/settings', icon: 'settings', text: 'Settings', end: true }],
  },
];

function AdminLayout({ onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const displayName = sessionStorage.getItem('displayName') || sessionStorage.getItem('username') || 'Admin';
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <div className={`admin-shell ${collapsed ? 'is-collapsed' : ''}`}>
      <aside className="admin-sidebar">
        <div className="sidebar-top">
          {!collapsed && <span className="sidebar-brand">Value City</span>}
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? icons.expand : icons.collapse}
          </button>
        </div>

        <div className="sidebar-profile">
          <div className="sidebar-avatar">{initials}</div>
          {!collapsed && (
            <div className="sidebar-profile-text">
              <span className="sidebar-name">{displayName}</span>
              <span className="sidebar-role">Admin</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="sidebar-group">
              {!collapsed && <div className="sidebar-label">{group.label}</div>}
              {group.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                  title={collapsed ? link.text : undefined}
                >
                  <span className="sidebar-icon">{icons[link.icon]}</span>
                  {!collapsed && <span className="sidebar-text">{link.text}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <button onClick={onLogout} className="sidebar-logout" title={collapsed ? 'Logout' : undefined}>
          <span className="sidebar-icon">{icons.logout}</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </aside>

      <div className="admin-main">
        <header className='admin-topbar'>
          <NotificationBell />
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;