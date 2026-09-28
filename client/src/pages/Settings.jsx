import { useState, useEffect } from 'react';
import axios from 'axios';
import './Settings.css';

const AUTH_API = 'http://localhost:5000/api/auth';
const SETTINGS_API = 'http://localhost:5000/api/settings';

const SECTIONS = [
  { key: 'store', label: 'Store details', hint: 'Name, contact, location' },
  { key: 'profile', label: 'Your profile', hint: 'Display name' },
  { key: 'username', label: 'Username', hint: 'Change your login name' },
  { key: 'password', label: 'Password', hint: 'Change your password' },
];

function authHeaders() {
  return { Authorization: `Bearer ${sessionStorage.getItem('token')}` };
}

function Settings() {
  const [section, setSection] = useState('store');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [store, setStore] = useState({ store_name: '', contact_email: '', location: '' });
  const [profile, setProfile] = useState({ display_name: '', username: '' });
  const [uname, setUname] = useState({ username: '', password: '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);

  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    axios.get(SETTINGS_API, { headers: authHeaders() })
      .then(res => {
        const d = res.data;
        setStore({
          store_name: d.store_name || '',
          contact_email: d.contact_email || '',
          location: d.location || '',
        });
        setProfile({ display_name: d.display_name || d.username, username: d.username });
        setUname({ username: d.username, password: '' });
        setLoading(false);
      })
      .catch(() => {
        setLoadError('Could not load settings. Check that the server is running.');
        setLoading(false);
      });
  }, []);

  const say = (text, isError = false) => {
    setMsg({ text, isError });
    setTimeout(() => setMsg(null), 4000);
  };

  const go = (key) => {
    setSection(key);
    setMsg(null);
  };

  const signOut = () => {
    sessionStorage.clear();
    window.location.reload();
  };

  const saveStore = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await axios.patch(`${SETTINGS_API}/store`, store, { headers: authHeaders() });
      say(res.data.message);
    } catch (err) {
      say(err.response?.data?.error || 'Could not save.', true);
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await axios.patch(`${SETTINGS_API}/profile`,
        { display_name: profile.display_name }, { headers: authHeaders() });
      sessionStorage.setItem('displayName', res.data.display_name);
      say('Display name saved. Refresh to update the sidebar.');
    } catch (err) {
      say(err.response?.data?.error || 'Could not save.', true);
    } finally {
      setBusy(false);
    }
  };

  const saveUsername = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await axios.patch(`${SETTINGS_API}/username`, uname, { headers: authHeaders() });
      say('Username changed. Signing you out…');
      setTimeout(signOut, 1600);
    } catch (err) {
      say(err.response?.data?.error || 'Could not change your username.', true);
      setBusy(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) {
      return say('The new passwords do not match', true);
    }
    setBusy(true);
    try {
      const res = await axios.patch(`${AUTH_API}/change-password`, {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      }, { headers: authHeaders() });
      say(res.data.message);
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      say(err.response?.data?.error || 'Could not update your password.', true);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="set-loading">Loading settings…</p>;
  if (loadError) return <p className="set-error">{loadError}</p>;

  const active = SECTIONS.find(s => s.key === section);

  return (
    <div className="set">
      <header className="set-head">
        <span className="eyebrow">Account &amp; store</span>
        <h1>Settings</h1>
      </header>

      <div className="set-body">
        <nav className="set-nav">
          {SECTIONS.map(s => (
            <button
              key={s.key}
              className={`set-tab${section === s.key ? ' is-on' : ''}`}
              onClick={() => go(s.key)}
            >
              <span className="set-tab-label">{s.label}</span>
              <span className="set-tab-hint">{s.hint}</span>
            </button>
          ))}
        </nav>

        <section className="set-panel">
          <div className="set-panel-head">
            <h2>{active.label}</h2>
            {msg && <span className={msg.isError ? 'set-error' : 'set-notice'}>{msg.text}</span>}
          </div>

          {section === 'store' && (
            <form onSubmit={saveStore} className="set-form">
              <label>
                <span className="eyebrow">Store name</span>
                <input
                  type="text"
                  value={store.store_name}
                  onChange={(e) => setStore({ ...store, store_name: e.target.value })}
                  maxLength={120}
                />
              </label>
              <div className="set-two">
                <label>
                  <span className="eyebrow">Contact email</span>
                  <input
                    type="email"
                    value={store.contact_email}
                    onChange={(e) => setStore({ ...store, contact_email: e.target.value })}
                    placeholder="hello@valuecity.fj"
                    maxLength={120}
                  />
                </label>
                <label>
                  <span className="eyebrow">Location</span>
                  <input
                    type="text"
                    value={store.location}
                    onChange={(e) => setStore({ ...store, location: e.target.value })}
                    placeholder="Suva, Fiji"
                    maxLength={160}
                  />
                </label>
              </div>
              <button type="submit" className="set-save" disabled={busy}>
                {busy ? 'Saving…' : 'Save store details'}
              </button>
            </form>
          )}

          {section === 'profile' && (
            <form onSubmit={saveProfile} className="set-form">
              <label>
                <span className="eyebrow">Display name</span>
                <input
                  type="text"
                  value={profile.display_name}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  maxLength={80}
                />
              </label>
              <p className="set-note">
                Shown in the sidebar. This is separate from your login name.
              </p>
              <button type="submit" className="set-save" disabled={busy}>
                {busy ? 'Saving…' : 'Save display name'}
              </button>
            </form>
          )}

          {section === 'username' && (
            <form onSubmit={saveUsername} className="set-form">
              <p className="set-note">
                This is the name you type to sign in. It is case-sensitive and cannot contain spaces.
              </p>
              <label>
                <span className="eyebrow">New username</span>
                <input
                  type="text"
                  value={uname.username}
                  onChange={(e) => setUname({ ...uname, username: e.target.value })}
                  maxLength={50}
                  autoComplete="username"
                />
              </label>
              <label>
                <span className="eyebrow">Confirm with your password</span>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={uname.password}
                  onChange={(e) => setUname({ ...uname, password: e.target.value })}
                  autoComplete="current-password"
                />
              </label>
              <label className="set-check">
                <input type="checkbox" checked={showPw} onChange={() => setShowPw(!showPw)} />
                <span>Show password</span>
              </label>
              <button type="submit" className="set-save" disabled={busy}>
                {busy ? 'Saving…' : 'Change username'}
              </button>
              <p className="set-note">
                You will be signed out after this change and will need to sign in with the new name.
              </p>
            </form>
          )}

          {section === 'password' && (
            <form onSubmit={savePassword} className="set-form">
              <label>
                <span className="eyebrow">Current password</span>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pw.currentPassword}
                  onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                  autoComplete="current-password"
                />
              </label>
              <div className="set-two">
                <label>
                  <span className="eyebrow">New password</span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={pw.newPassword}
                    onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                    autoComplete="new-password"
                  />
                </label>
                <label>
                  <span className="eyebrow">Confirm new password</span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={pw.confirmPassword}
                    onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })}
                    autoComplete="new-password"
                  />
                </label>
              </div>
              <label className="set-check">
                <input type="checkbox" checked={showPw} onChange={() => setShowPw(!showPw)} />
                <span>Show passwords</span>
              </label>
              <button type="submit" className="set-save" disabled={busy}>
                {busy ? 'Updating…' : 'Update password'}
              </button>
              <p className="set-note">Must be at least 6 characters.</p>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

export default Settings;