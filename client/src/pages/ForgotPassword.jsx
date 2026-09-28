import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword } from '../api/api';
import './customerAuth.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // The server always answers with the same generic message whether or
      // not the email is registered (so this can't be used to check who
      // has an account) -- move straight to the "enter the code" screen
      // either way.
      await forgotPassword({ email });
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
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
          <figure className="au-shot au-shot-1 is-blank" />
        </div>
      </aside>

      <main className="au-main">
        <Link to="/" className="au-back">← Back to shop</Link>

        <form className="au-form" onSubmit={handleSubmit}>
          <header className="au-head">
            <span className="au-eyebrow">Forgot password</span>
            <h1>Reset your password</h1>
            <p>Enter your account email and we'll send you a code to reset it.</p>
          </header>

          {error && <div className="au-error">{error}</div>}

          <label className="au-field">
            <span>Email address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              required
              autoFocus
            />
          </label>

          <button type="submit" className="au-submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset code'}
          </button>

          <p className="au-switch">
            Remembered it after all? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
