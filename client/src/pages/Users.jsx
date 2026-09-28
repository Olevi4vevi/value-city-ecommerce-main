import { useState, useEffect } from 'react';
import axios from 'axios';
import './Users.css';

const API = 'http://localhost:5000/api/users';

function authHeaders() {
  return { Authorization: `Bearer ${sessionStorage.getItem('token')}` };
}

function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(API, { headers: authHeaders() })
      .then(res => setUsers(res.data))
      .catch(() => setError('Could not load users. Check that the server is running.'));
  }, []);

  return (
    <div className="usr">
      <header className="usr-head">
        <div>
          <span className="eyebrow">Customers</span>
          <h1>Users</h1>
        </div>
        <span className="usr-count">{users.length} {users.length === 1 ? 'user' : 'users'}</span>
      </header>

      {error && <p className="usr-error">{error}</p>}

      {!error && users.length === 0 ? (
        <div className="usr-empty">No registered users yet.</div>
      ) : !error && (
        <div className="ledger">
          <div className="usr-row usr-row-head">
            <span className="eyebrow">Name</span>
            <span className="eyebrow">Email</span>
            <span className="eyebrow">Phone</span>
            <span className="eyebrow">Joined</span>
            <span className="eyebrow">Orders</span>
            <span className="eyebrow">Spent (FJD)</span>
          </div>

          <div className="ledger-body">
            {users.map((u) => (
              <div key={u.user_id} className="usr-row">
                <span className="usr-name">{u.full_name}</span>
                <span className="usr-cell">{u.email}</span>
                <span className="usr-cell">{u.phone_number || '—'}</span>
                <span className="usr-cell">{new Date(u.created_at).toLocaleDateString()}</span>
                <span className="usr-num">{u.order_count}</span>
                <span className="usr-num">${Number(u.total_spent).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
