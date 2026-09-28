import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { resetPassword } from '../api/api';
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

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ email, code, new_password: newPassword });
      navigate('/login', { state: { notice: 'Password updated — sign in with your new password.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password. Please try again.');
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
            <span className="au-eyebrow">Almost there</span>
            <h1>Enter your reset code</h1>
            <p>Check your email for the 6-digit code, then choose a new password.</p>
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
              autoFocus={!email}
            />
          </label>

          <label className="au-field">
            <span>Reset code</span>
            <input
              className="au-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="000000"
              required
              autoFocus={!!email}
            />
            <em className="au-hint">Codes expire after 15 minutes.</em>
          </label>

          <label className="au-field">
            <span>New password</span>
            <div className="au-pw">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
            <span>Confirm new password</span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </label>

          <button type="submit" className="au-submit" disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </button>

          <p className="au-switch">
            Didn't request this? <Link to="/login">Back to sign in</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
