import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authenticate, DASHBOARD_PATH } from '../../auth/users';
import './Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = authenticate(username, password);
    if (!user) {
      setError('Invalid username or password.');
      return;
    }
    localStorage.setItem('nf_auth', JSON.stringify({ username: user.username, role: user.role }));
    window.location.href = DASHBOARD_PATH[user.role];
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          NeuroFi<span className="login-logo-dot">.</span>
        </div>
        <p className="login-tagline">Sign in to your advisory workspace.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-fgroup">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="login-fgroup">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-submit">Sign In</button>
        </form>

        <Link to="/" className="login-back">← Back to home</Link>
      </div>
    </div>
  );
};

export default Login;
