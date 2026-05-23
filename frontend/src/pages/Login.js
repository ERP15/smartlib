import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { setUser, homePathForRole } from '../utils/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await login({ email, password });
      const { access_token, user } = res.data;
      localStorage.setItem('access_token', access_token);
      setUser(user);
      navigate(homePathForRole(user.role));
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <p className="eyebrow">Member Access</p>
          <h2>Welcome back to SmartLib</h2>
          <p className="subhead">Log in to manage loans, renewals, and recommendations.</p>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Email address</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="input"
            />
          </label>
          {error && <div className="alert">{error}</div>}
          <button type="submit" className="btn btn-primary btn-block">Login</button>
        </form>
        <p className="auth-footer">
          New here? <a href="/register">Create an account</a>
        </p>
      </div>
      <div className="auth-aside">
        <div className="aside-card">
          <h3>Today in the stacks</h3>
          <p>Reserve books, track your loans, and receive due date alerts.</p>
          <div className="aside-highlight">
            <span>15</span>
            <span>Hold requests ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
