import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginUser, confirmReactivation, getPublicProducts } from '../api/api';
import { useCart } from '../context/CartContext';
import ConfirmDialog from '../components/ConfirmDialog';
import './customerAuth.css';

const EyeOpen = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosed = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M3 3l18 18" />
    <path d="M10.6 10.6a2 2 0 002.8 2.8" />
    <path d="M9.9 4.24A9.1 9.1 0 0112 4c5 0 9 4 10 8-.36 1.4-1.05 2.7-2 3.8M6.6 6.6C4.6 8 3.2 9.9 2 12c1 4 5 8 10 8 1.3 0 2.5-.24 3.6-.66" />
  </svg>
);

function pickThree(list) {
  const withImages = list.filter((p) => p.image_url);
  const shuffled = [...withImages];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 3);
}

export default function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshCart } = useCart();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice] = useState(location.state?.notice || '');
  const [loading, setLoading] = useState(false);
  const [shots, setShots] = useState([]);
  const [reactivationOffer, setReactivationOffer] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  useEffect(() => {
    getPublicProducts()
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data.products || res.data.data || [];
        setShots(pickThree(list));
      })
      .catch(() => setShots([]));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginUser(form);
      localStorage.setItem('customerToken', res.data.token);
      localStorage.setItem('customerUser', JSON.stringify(res.data.user));

      // A pending-deletion account is silently restored by the server on a
      // successful login (see customerAuth.js) -- let them know what just
      // happened. A deactivated account is handled separately below, since
      // REQ-11 wants that one offered/confirmed rather than automatic.
      const toast = res.data.reactivated === 'deletion_cancelled'
        ? 'Welcome back! Your account deletion request was cancelled.'
        : null;

      await refreshCart();

      // Land on the storefront, not the dashboard -- customers now choose to
      // go to their account via the profile icon in the header.
      navigate('/', toast ? { state: { toast } } : undefined);
    } catch (err) {
      if (err.response?.data?.needsVerification) {
        // Right password, but the registration code was never confirmed --
        // send them to finish that instead of showing a dead-end error.
        navigate('/verify-email', { state: { email: err.response.data.email || form.email } });
        return;
      }
      if (err.response?.data?.needsReactivationOffer) {
        // REQ-11: the password's right and the account is just deactivated
        // -- offer to reactivate instead of logging in automatically.
        setReactivationOffer(true);
        return;
      }
      setError(err.response?.data?.message || 'Login failed. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReactivation = async () => {
    setReactivating(true);
    try {
      const res = await confirmReactivation(form);
      localStorage.setItem('customerToken', res.data.token);
      localStorage.setItem('customerUser', JSON.stringify(res.data.user));
      await refreshCart();
      navigate('/', { state: { toast: 'Welcome back! Your account is active again.' } });
    } catch (err) {
      setReactivationOffer(false);
      setError(err.response?.data?.message || 'Could not reactivate your account. Please try again.');
    } finally {
      setReactivating(false);
    }
  };

  return (
    <div className="au">
      <aside className="au-side">
        <Link to="/" className="au-side-logo">Value City</Link>

        <div className="au-collage">
          <span className="au-blob" aria-hidden="true" />
          {shots.length > 0 ? (
            shots.map((p, i) => (
              <figure key={p.id} className={`au-shot au-shot-${i + 1}`}>
                <img src={p.image_url} alt="" />
              </figure>
            ))
          ) : (
            <figure className="au-shot au-shot-1 is-blank" />
          )}
        </div>
      </aside>

      <main className="au-main">
        <Link to="/" className="au-back">← Back to shop</Link>

        <form className="au-form" onSubmit={handleSubmit}>
          <header className="au-head">
            <span className="au-eyebrow">Welcome back</span>
            <h1>Sign in</h1>
            <p>Pick up where you left off.</p>
          </header>

          {notice && <div className="au-success">{notice}</div>}
          {error && <div className="au-error">{error}</div>}

          <label className="au-field">
            <span>Email address</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="you@example.com"
              required
              autoFocus
            />
          </label>

          <label className="au-field">
            <span>Password</span>
            <div className="au-pw">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeClosed /> : <EyeOpen />}
              </button>
            </div>
            <Link to="/forgot-password" className="au-forgot">Forgot password?</Link>
          </label>

          <button type="submit" className="au-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="au-switch">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </main>

      <ConfirmDialog
        open={reactivationOffer}
        title="Reactivate your account?"
        message="This account was deactivated. Sign in again to reactivate it, or cancel to stay signed out."
        confirmLabel={reactivating ? 'Reactivating…' : 'Reactivate & sign in'}
        cancelLabel="Cancel"
        tone="reactivate"
        onConfirm={handleConfirmReactivation}
        onCancel={() => setReactivationOffer(false)}
      />
    </div>
  );
}
