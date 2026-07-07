import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { agentLogin, AgentLoginError } from '../../auth/api';
import { dashboardPathForRole } from '../../auth/users';
import './Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const agent = await agentLogin(username.trim(), password);

      const dashboardPath = dashboardPathForRole(agent.role);
      if (!dashboardPath) {
        setError(`No portal is configured for the "${agent.role}" role.`);
        return;
      }

      localStorage.setItem(
        'nf_auth',
        JSON.stringify({
          agentId: agent.agentId,
          username: agent.username,
          role: agent.role.toLowerCase(),
        }),
      );
      window.location.href = dashboardPath;
    } catch (err) {
      if (err instanceof AgentLoginError) {
        setError(err.message);
      } else {
        setError('Could not reach the server. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
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

          <button type="submit" className="login-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing In…' : 'Sign In'}
          </button>
        </form>

        <Link to="/" className="login-back">← Back to home</Link>
      </div>
    </div>
  );
};

export default Login;
