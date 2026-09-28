import { useState, useRef } from 'react';
import axios from 'axios';
import './Login.css';

function Login({ onLoginSuccess }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        username: name,
        password,
      });

      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('username', res.data.username);
      sessionStorage.setItem('displayName', res.data.displayName || res.data.username);
      onLoginSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      setBusy(false);
    }
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      passwordRef.current?.focus();
    }
  };

  return (
    <div className="login-page">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="leaf-bg">
        <rect width="1600" height="900" fill="var(--c-cream)" />
        <path d="M1600 0 L1600 900 L500 900 C650 780 600 650 780 540 C950 430 900 300 1080 180 C1250 60 1350 -20 1600 0Z" fill="var(--c-leaf)" opacity="0.9" />
        <path d="M1600 40 L1600 900 L600 900 C730 790 690 660 850 560 C1010 460 970 330 1130 210 C1280 100 1400 30 1600 40Z" fill="var(--c-mint)" opacity="0.75" />
        <path d="M1600 90 L1600 900 L700 900 C810 800 780 680 920 590 C1060 500 1030 370 1170 250 C1300 150 1440 90 1600 90Z" fill="var(--c-sage)" opacity="0.6" />
        <g stroke="var(--c-forest)" strokeWidth="1" opacity="0.2" fill="none">
          <path d="M600 850 Q700 750 680 620" />
          <path d="M700 800 Q800 700 780 570" />
          <path d="M800 750 Q740 660 850 570" />
        </g>
      </svg>

      <div className="login-outer">
        <div className="login-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </div>

        <div className="login-card">
          <span className="login-brand">Value City Admin</span>
          <h1>Log in</h1>

          <form onSubmit={handleSubmit} className="login-form">
            <label>
              <span>Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleNameKeyDown}
                autoComplete="username"
                autoFocus
              />
            </label>

            <label>
              <span>Password</span>
              <div className="password-wrap">
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                      <path d="M9.9 4.24A9.1 9.1 0 0112 4c5 0 9 4 10 8-.36 1.4-1.05 2.7-2 3.8M6.6 6.6C4.6 8 3.2 9.9 2 12c1 4 5 8 10 8 1.3 0 2.5-.24 3.6-.66" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Log in'}
            </button>

            <button
              type="button"
              className="login-forgot"
              onClick={() => setShowHelp(!showHelp)}
            >
              Forgot your password?
            </button>

            {showHelp && (
              <p className="login-help">
                Sign in and use Settings to change your password. If you're locked out,
                contact whoever set up the system.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;