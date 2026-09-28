import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, getPublicProducts } from '../api/api';
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

export default function CustomerRegister() {
  const navigate = useNavigate();
  // REQ-1 asks for separate first/last name fields at registration. The
  // shared `users` table (and the admin Users module that also reads it)
  // only has one `full_name` column, so rather than change that shared
  // schema, the split stays at the form level -- the two fields get joined
  // into full_name right before submit.
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    phone_number: '',
    address: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shots, setShots] = useState([]);

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

    const full_name = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!full_name) {
      setError('First and last name are required.');
      return;
    }

    if (form.password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await registerUser({ ...form, full_name });
      // Email confirmation is switched off for now, so the account is usable
      // straight away -- send them to sign in.
      navigate('/login', { state: { notice: 'Account created. You can now sign in.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
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
            <span className="au-eyebrow">Join the rail</span>
            <h1>Create an account</h1>
            <p>See prices, place orders and track what you've bought.</p>
          </header>

          {error && <div className="au-error">{error}</div>}

          <div className="au-two">
            <label className="au-field">
              <span>First name</span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                placeholder="Jane"
                required
                autoFocus
              />
            </label>
            <label className="au-field">
              <span>Last name</span>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                placeholder="Doe"
                required
              />
            </label>
          </div>

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
                autoComplete="new-password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeClosed /> : <EyeOpen />}
              </button>
            </div>
            <em className="au-hint">At least six characters.</em>
          </label>

          <label className="au-field">
            <span>Confirm password</span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </label>

          <div className="au-two">
            <label className="au-field">
              <span>Phone <i>optional</i></span>
              <input
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                autoComplete="tel"
                placeholder="999 0000"
              />
            </label>

            <label className="au-field">
              <span>Address <i>optional</i></span>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                autoComplete="street-address"
                placeholder="Suva"
              />
            </label>
          </div>

          <button type="submit" className="au-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <p className="au-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </main>
    </div>
  );
}