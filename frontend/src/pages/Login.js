import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { login, verifyOtp } from '../services/api';
import { setUser, homePathForRole } from '../utils/auth';

export default function Login() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const role = searchParams.get('role') === 'admin' ? 'admin' : 'student';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (otpMode) {
        const res = await verifyOtp(otp);
        const { access_token, user } = res.data;
        localStorage.setItem('access_token', access_token);
        setUser(user);
        navigate(homePathForRole(user.role));
        return;
      }

      const res = await login({ email, password });
      if (res.data.otp_required) {
        setOtpMode(true);
        setOtpMessage(res.data.message || 'Enter the OTP sent to your email.');
        return;
      }

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
          <p className="eyebrow">{role === 'admin' ? 'Admin Access' : 'Member Access'}</p>
          <h2>{role === 'admin' ? 'Admin sign in' : 'Welcome back to SmartLib'}</h2>
          <p className="subhead">
            {role === 'admin'
              ? 'Admin users can log in here to manage books and borrowing.'
              : 'Log in to manage loans, renewals, and recommendations.'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="form">
          {!otpMode && (
            <>
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
            </>
          )}
          {otpMode && (
            <>
              <p className="notice">{otpMessage}</p>
              <label className="field">
                <span>One-time password</span>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="input"
                />
              </label>
            </>
          )}
          {error && <div className="alert">{error}</div>}
          <button type="submit" className="btn btn-primary btn-block">
            {otpMode ? 'Verify OTP' : 'Login'}
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
