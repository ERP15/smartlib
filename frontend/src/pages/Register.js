import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/api';

export default function Register() {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const res = await register({
        student_id: studentId,
        name,
        email,
        password,
      });
      setSuccess('Registered successfully. You can now login.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(
        err.response?.data?.error
          || err.response?.data?.message
          || (err.message === 'Network Error' ? 'Cannot reach server — is the backend running on port 5000?' : 'Registration failed')
      );
    }
  };

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <p className="eyebrow">Library Access</p>
          <h2>Create your SmartLib account</h2>
          <p className="subhead">Use your student ID to unlock borrowing, holds, and alerts.</p>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Student ID</span>
            <input
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="STU001"
              className="input"
            />
          </label>
          <label className="field">
            <span>Full name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="input"
            />
          </label>
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
          {success && <div className="success">{success}</div>}
          <button type="submit" className="btn btn-primary btn-block">Create account</button>
        </form>
        <p className="auth-footer">
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </div>
      <div className="auth-aside">
        <div className="aside-card">
          <h3>Why join SmartLib?</h3>
          <ul className="aside-list">
            <li>Instant access to availability updates.</li>
            <li>One-tap renewals from any device.</li>
            <li>Personalized holds and alerts.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
