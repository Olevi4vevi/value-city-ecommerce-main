import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { verifyEmail, resendVerificationCode } from '../api/api';
import './customerAuth.css';

// This page is reached three ways:
//  1. Right after registering, with no ?token= yet -- just tell them to
//     check their inbox (email pre-filled via router state).
//  2. By actually clicking the confirmation link in that email, which
//     lands here with ?token=<the long random token>. As soon as that's
//     present we call the API ourselves -- there's nothing to type,
//     clicking the link *is* the confirmation (REQ-4/5/6).
//  3. Bounced here from login if the account was never confirmed, same as
//     case 1.
// The email stays editable so a page refresh -- which loses router state
// -- doesn't strand anyone who needs to resend.
export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState(location.state?.email || '');
  const [status, setStatus] = useState(token ? 'verifying' : 'idle'); // idle | verifying | success | error
  const [message, setMessage] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [resending, setResending] = useState(false);
  const ranRef = useRef(false);

  useEffect(() => {
    if (!token || ranRef.current) return;
    ranRef.current = true; // the token is single-use -- never fire this twice

    verifyEmail({ token })
      .then((res) => {
        localStorage.setItem('customerToken', res.data.token);
        localStorage.setItem('customerUser', JSON.stringify(res.data.user));
        setStatus('success');
        setTimeout(() => {
          navigate('/', { state: { toast: 'Email confirmed! Welcome to Value City.' } });
        }, 1800);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'This link is invalid or has expired.');
      });
  }, [token, navigate]);

  const handleResend = async () => {
    if (!email) {
      setMessage('Enter your email first, then resend.');
      return;
    }
    setMessage('');
    setResendStatus('');
    setResending(true);
    try {
      const res = await resendVerificationCode({ email });
      setResendStatus(res.data.message || 'A new confirmation link has been sent.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not resend the link.');
    } finally {
      setResending(false);
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

        <div className="au-form">
          {status === 'verifying' && (
            <>
              <header className="au-head">
                <span className="au-eyebrow">One more step</span>
                <h1>Confirming your email…</h1>
                <p>Hang tight, this only takes a second.</p>
              </header>
            </>
          )}

          {status === 'success' && (
            <>
              <header className="au-head">
                <span className="au-eyebrow">All set</span>
                <h1>Email confirmed!</h1>
              </header>
              <div className="au-success">Welcome to Value City -- taking you to the shop…</div>
            </>
          )}

          {(status === 'idle' || status === 'error') && (
            <>
              <header className="au-head">
                <span className="au-eyebrow">One more step</span>
                <h1>Confirm your email</h1>
                <p>
                  {status === 'error'
                    ? 'That link didn\'t work. Request a new one below.'
                    : 'We sent a confirmation link to your inbox. Click it to activate your account.'}
                </p>
              </header>

              {message && <div className="au-error">{message}</div>}
              {resendStatus && <div className="au-success">{resendStatus}</div>}

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

              <button type="button" className="au-submit" onClick={handleResend} disabled={resending}>
                {resending ? 'Sending…' : 'Resend confirmation link'}
              </button>

              <em className="au-hint">Links expire after 15 minutes.</em>

              <p className="au-switch">
                Already confirmed? <Link to="/login">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
