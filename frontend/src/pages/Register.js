import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { register } from '../services/api';

const EMAIL_PATTERN = /^[^@\s]+@iskolarngbayan\.pup\.edu\.ph$/i;
const STUDENT_ID_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{5}-PQ-0$/i;

function getClientError(studentId, email, password) {
  if (!STUDENT_ID_PATTERN.test(studentId)) {
    return 'Student ID must match XXXX-XXXXX-PQ-0';
  }

  if (!EMAIL_PATTERN.test(email)) {
    return 'Use an @iskolarngbayan.pup.edu.ph email address';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one special character';
  }

  return null;
}

export default function Register() {
  const [searchParams] = useSearchParams();
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');


  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const clientError = getClientError(studentId.trim(), email.trim(), password);
    if (clientError) {
      setError(clientError);
      return;
    }

    try {
      const res = await register({
        student_id: studentId.trim(),
        name,
        email: email.trim(),
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
          <h2>Create your SmartLib student account</h2>
          <p className="subhead">Use your school email and student ID to unlock borrowing, holds, and alerts.</p>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Student ID</span>
            <input
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="1234-ABCDE-PQ-0"
              className="input"
              required
            />
            <small className="field-hint">Format: XXXX-XXXXX-PQ-0</small>
          </label>
          <label className="field">
            <span>Full name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="input"
              required
            />
          </label>
          <label className="field">
            <span>Email address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="samplename@iskolarngbayan.pup.edu.ph"
              className="input"
              required
            />
            <small className="field-hint">Use your @iskolarngbayan.pup.edu.ph email</small>
          </label>
          <label className="field">
            <span>Password</span>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                placeholder="At least 8 characters"
                className="input"
                required
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
            <small className="field-hint">
              Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
            </small>
          </label>
          {error && <div className="alert">{error}</div>}
          {success && <div className="success">{success}</div>}
          <button type="submit" className="btn btn-primary btn-block">Create account</button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to={`/login?role=${searchParams.get('role') || 'student'}`}>Sign in</Link>
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
