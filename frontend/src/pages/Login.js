import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { login } from '../services/api';
import { setUser, homePathForRole } from '../utils/auth';

export default function Login() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const role = searchParams.get('role') === 'admin' ? 'admin' : 'student';


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
      setError(
        err.response?.data?.error ||
        (err.message === 'Network Error' ? 'Cannot reach server — is the backend running on port 5000?' : 'Login failed')
      );
    }
  };

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <p className="eyebrow">{role === 'admin' ? 'Admin Access' : 'Member Access'}</p>
          <h2>{role === 'admin' ? 'Admin sign in' : 'Welcome back to SmartLib'}</h2>
          <p className="subhead">
            {role === 'admin'
              ? 'Admin users can log in here to manage books and borrowing.'
              : 'Log in to manage borrowed books, renewals, and recommendations.'}
          </p>
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
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                className="input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </label>
          {error && <div className="alert">{error}</div>}
          <button type="submit" className="btn btn-primary btn-block">
            Login
          </button>
        </form>
        <p className="auth-footer">
          {role === 'admin' ? (
            'Admin users do not register here.'
          ) : (
            <>
              New here? <Link to="/register?role=student">Create an account</Link>
            </>
          )}
        </p>
      </div>
      <div className="auth-aside">
        <div className="aside-card" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          textAlign: 'center',
          padding: '3rem 2rem',
          minHeight: '400px'
        }}>
          <img 
            src="/pup-logo.png" 
            alt="PUP Logo" 
            style={{ 
              width: '150px', 
              height: '150px', 
              objectFit: 'contain',
              marginBottom: '1.5rem',
              filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.15))'
            }} 
          />
          <h2 style={{ 
            fontFamily: 'Outfit, sans-serif', 
            fontWeight: '900', 
            fontSize: '1.8rem', 
            color: 'var(--accent)', 
            margin: 0,
            lineHeight: '1.25'
          }}>
            PUP Library Management System
          </h2>
          <p className="muted" style={{ fontSize: '0.95rem', marginTop: '0.5rem', maxWidth: '280px' }}>
            Discover the Best Books Around
          </p>
        </div>
      </div>
    </div>
  );
}
