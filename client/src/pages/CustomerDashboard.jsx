import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getProfile, updateProfile, changePassword, deleteAccount, deactivateAccount, getOrders } from '../api/api';
import CustomerSpendingAnalytics from './CustomerSpendingAnalytics';
import './customerDashboard.css';

// Order statuses that mean "not picked up yet" -- these are what gate
// account deactivation/deletion (see the "danger" tab below, and REQ-18).
const ACTIVE_ORDER_STATUSES = ['pending', 'paid', 'shipped'];

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'analytics', label: 'My Spending Analytics' },
  { key: 'password', label: 'Password' },
  { key: 'danger', label: 'Close account' },
];

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone_number: '', address: '' });
  const [status, setStatus] = useState({ type: '', message: '' });

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '' });
  const [showPwForm, setShowPwForm] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [closingMessage, setClosingMessage] = useState('');
  const [tab, setTab] = useState(location.state?.tab || 'profile');

  // REQ-18: Order History sends the user back here (with these two flags)
  // once they've been shown the "you have orders pending pickup" notice --
  // acknowledging it once is enough to proceed with that specific action
  // without being bounced back and forth.
  const [acknowledgedFor] = useState(
    location.state?.acknowledgedPending ? location.state?.pendingAction : null
  );

  const [orderSummary, setOrderSummary] = useState({ count: 0, totalSpent: 0, lastOrderDate: null, activeCount: 0 });

  useEffect(() => {
    loadProfile();
    loadOrderSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getProfile();
      setProfile(res.data);
      setForm({
        full_name: res.data.full_name,
        phone_number: res.data.phone_number || '',
        address: res.data.address || ''
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const loadOrderSummary = async () => {
    try {
      const res = await getOrders();
      const orders = res.data;
      const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const lastOrderDate = orders.length > 0 ? orders[0].order_date : null;
      const activeCount = orders.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status)).length;
      setOrderSummary({ count: orders.length, totalSpent, lastOrderDate, activeCount });
    } catch (err) {
      console.error('Failed to load order summary:', err);
    }
  };

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    try {
      await updateProfile(form);
      setStatus({ type: 'success', message: 'Profile updated successfully.' });
      setEditMode(false);
      loadProfile();
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to update profile.' });
    }
  };

  const handlePwChange = (e) => setPwForm({ ...pwForm, [e.target.name]: e.target.value });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    try {
      await changePassword(pwForm);
      setStatus({ type: 'success', message: 'Password changed successfully.' });
      setPwForm({ current_password: '', new_password: '' });
      setShowPwForm(false);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to change password.' });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await deleteAccount();
      setClosingMessage(res.data.message);
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customerUser');
      setTimeout(() => { window.location.href = '/'; }, 2400);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to delete account.' });
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      const res = await deactivateAccount();
      setClosingMessage(res.data.message);
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customerUser');
      setTimeout(() => { window.location.href = '/'; }, 2400);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to deactivate account.' });
    }
  };

  // REQ-18: before letting either action even get to a confirm step, check
  // for orders that haven't been picked up yet. First time through, send
  // the user to Order History to deal with them (or not -- acknowledging
  // the notice is enough); once they've been shown it for that action, or
  // there's nothing pending, the confirm step opens as normal.
  const handleDeactivateClick = () => {
    if (orderSummary.activeCount > 0 && acknowledgedFor !== 'deactivate') {
      navigate('/orders', { state: { pendingAction: 'deactivate' } });
      return;
    }
    setShowDeactivateConfirm(true);
  };

  const handleDeleteClick = () => {
    if (orderSummary.activeCount > 0 && acknowledgedFor !== 'delete') {
      navigate('/orders', { state: { pendingAction: 'delete' } });
      return;
    }
    setShowDeleteConfirm(true);
  };

  const switchTab = (key) => {
    setTab(key);
    setStatus({ type: '', message: '' });
    setEditMode(false);
    setShowPwForm(false);
    setShowDeleteConfirm(false);
  };

  if (!profile) return <div className="acct-loading">Loading your account…</div>;

  const firstName = profile.full_name.split(' ')[0];
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <div className="acct">
      <section className="acct-hero">
        <div className="acct-hero-id">
          <span className="acct-avatar">{initial}</span>
          <div>
            <span className="acct-hello">Hello, {firstName}</span>
            <span className="acct-email">{profile.email}</span>
          </div>
        </div>

        <div className="acct-hero-stats">
          <div>
            <span className="acct-stat-value">{orderSummary.count}</span>
            <span className="acct-stat-label">Orders</span>
          </div>
          <div>
            <span className="acct-stat-value">${orderSummary.totalSpent.toFixed(2)}</span>
            <span className="acct-stat-label">Spent</span>
          </div>
          <div>
            <span className="acct-stat-value">
              {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
            </span>
            <span className="acct-stat-label">Member since</span>
          </div>
        </div>

        {orderSummary.lastOrderDate && (
          <Link to="/orders" className="acct-hero-link">
            Last order {new Date(orderSummary.lastOrderDate).toLocaleDateString()} — view history →
          </Link>
        )}
      </section>

      <nav className="acct-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`acct-tab${tab === t.key ? ' is-on' : ''}${t.key === 'danger' ? ' is-danger' : ''}`}
            onClick={() => switchTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {status.message && (
        <div className={status.type === 'error' ? 'acct-error' : 'acct-success'}>
          {status.message}
        </div>
      )}

      <section className="acct-panel">
        {tab === 'profile' && (
          !editMode ? (
            <>
              <div className="acct-panel-head">
                <h2>Your details</h2>
                <button className="acct-ghost" onClick={() => setEditMode(true)}>Edit</button>
              </div>
              <dl className="acct-rows">
                <div><dt>Name</dt><dd>{profile.full_name}</dd></div>
                <div><dt>Email</dt><dd>{profile.email}</dd></div>
                <div><dt>Phone</dt><dd>{profile.phone_number || 'Not set'}</dd></div>
                <div><dt>Address</dt><dd>{profile.address || 'Not set'}</dd></div>
              </dl>
            </>
          ) : (
            <>
              <div className="acct-panel-head">
                <h2>Edit details</h2>
              </div>
              <form className="acct-form" onSubmit={handleSaveProfile}>
                <label>
                  <span>Full name</span>
                  <input name="full_name" value={form.full_name} onChange={handleFormChange} required />
                </label>
                <div className="acct-two">
                  <label>
                    <span>Phone number</span>
                    <input name="phone_number" value={form.phone_number} onChange={handleFormChange} />
                  </label>
                  <label>
                    <span>Address</span>
                    <input name="address" value={form.address} onChange={handleFormChange} />
                  </label>
                </div>
                <p className="acct-note">Your email address cannot be changed.</p>
                <div className="acct-actions">
                  <button type="button" className="acct-ghost" onClick={() => setEditMode(false)}>Cancel</button>
                  <button type="submit" className="acct-primary">Save changes</button>
                </div>
              </form>
            </>
          )
        )}

        {tab === 'analytics' && <CustomerSpendingAnalytics />}

        {tab === 'password' && (
          !showPwForm ? (
            <>
              <div className="acct-panel-head">
                <h2>Password</h2>
                <button className="acct-ghost" onClick={() => setShowPwForm(true)}>Change</button>
              </div>
              <p className="acct-note">
                Choose something you don't use anywhere else. Minimum six characters.
              </p>
            </>
          ) : (
            <>
              <div className="acct-panel-head">
                <h2>Change password</h2>
              </div>
              <form className="acct-form" onSubmit={handleChangePassword}>
                <label>
                  <span>Current password</span>
                  <input
                    type="password"
                    name="current_password"
                    value={pwForm.current_password}
                    onChange={handlePwChange}
                    required
                  />
                </label>
                <label>
                  <span>New password</span>
                  <input
                    type="password"
                    name="new_password"
                    value={pwForm.new_password}
                    onChange={handlePwChange}
                    required
                    minLength={6}
                  />
                </label>
                <div className="acct-actions">
                  <button type="button" className="acct-ghost" onClick={() => setShowPwForm(false)}>Cancel</button>
                  <button type="submit" className="acct-primary">Update password</button>
                </div>
              </form>
            </>
          )
        )}

        {tab === 'danger' && (
          closingMessage ? (
            <div className="acct-closing">
              <p>{closingMessage}</p>
              <p className="acct-note">Taking you back to the shop…</p>
            </div>
          ) : (
            <>
              <div className="acct-panel-head">
                <h2>Deactivate instead?</h2>
              </div>
              <p className="acct-note">
                Deactivating hides your account until you're ready to come back — nothing about your
                orders changes, and there's no deadline. Log in anytime to reactivate.
              </p>
              {!showDeactivateConfirm ? (
                <div className="acct-actions">
                  <button className="acct-ghost" onClick={handleDeactivateClick}>
                    Deactivate my account
                  </button>
                </div>
              ) : (
                <div className="acct-confirm acct-confirm-soft">
                  <p>You can log back in anytime to reactivate — there's no deadline.</p>
                  <div className="acct-actions">
                    <button className="acct-ghost" onClick={() => setShowDeactivateConfirm(false)}>
                      Cancel
                    </button>
                    <button className="acct-primary" onClick={handleDeactivateAccount}>
                      Yes, deactivate
                    </button>
                  </div>
                </div>
              )}

              <div className="acct-panel-head acct-panel-head-spaced">
                <h2>Delete your account</h2>
              </div>
              <p className="acct-note">
                Deleting gives you a 30-day grace period — log back in within that window and your
                account is restored automatically. After 30 days it's gone for good.
              </p>
              {!showDeleteConfirm ? (
                <div className="acct-actions">
                  <button className="acct-danger" onClick={handleDeleteClick}>
                    Delete my account
                  </button>
                </div>
              ) : (
                <div className="acct-confirm">
                  {orderSummary.activeCount > 0 ? (
                    <>
                      <p>
                        You have {orderSummary.activeCount} order{orderSummary.activeCount === 1 ? '' : 's'} that
                        {orderSummary.activeCount === 1 ? " hasn't" : " haven't"} been picked up yet.
                      </p>
                      <p className="acct-confirm-detail">
                        Deleting your account will cancel {orderSummary.activeCount === 1 ? 'it' : 'them'} and
                        refund you. If you're planning to collect {orderSummary.activeCount === 1 ? 'it' : 'them'},
                        consider deactivating instead — it leaves your orders untouched.
                      </p>
                    </>
                  ) : (
                    <p>Are you certain? You'll have 30 days to change your mind by logging back in.</p>
                  )}
                  <div className="acct-actions">
                    <button className="acct-ghost" onClick={() => setShowDeleteConfirm(false)}>
                      Keep my account
                    </button>
                    <button className="acct-danger" onClick={handleDeleteAccount}>
                      {orderSummary.activeCount > 0 ? 'Cancel orders & delete anyway' : 'Yes, delete my account'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )
        )}
      </section>
    </div>
  );
}