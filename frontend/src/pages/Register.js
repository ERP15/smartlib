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
              pattern="[A-Za-z0-9]{4}-[A-Za-z0-9]{5}-PQ-0"
              title="Format: XXXX-XXXXX-PQ-0"
              className="input"
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
            />
          </label>
          <label className="field">
            <span>Email address</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="samplename@iskolarngbayan.pup.edu.ph"
              pattern="[^@\\s]+@iskolarngbayan\.pup\.edu\.ph"
              title="Use your @iskolarngbayan.pup.edu.ph email"
              className="input"
            />
            <small className="field-hint">Use your @iskolarngbayan.pup.edu.ph email</small>
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              placeholder="At least 8 characters"
              className="input"
            />
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
