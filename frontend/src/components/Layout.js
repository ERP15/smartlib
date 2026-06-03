import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getUser, clearAuth } from '../utils/auth';
import { logout } from '../services/api';

export default function Layout({ children }) {
  const user = getUser();
  const navigate = useNavigate();
  const [showRolePicker, setShowRolePicker] = useState(false);

  React.useEffect(() => {
    if (showRolePicker) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showRolePicker]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      /* session may already be gone */
    }
    clearAuth();
    navigate('/');
  };

  return (
    <div className="app">
      <header className="nav">
        <Link to="/" className="brand">
          <img src="/pup-logo.png" alt="PUP Logo" className="brand-logo" />
          <span>SmartLib</span>
        </Link>
        <nav className="nav-links">
          {user ? (
            <>
              {(user.role === 'admin' || user.role === 'librarian') && (
                <NavLink to="/admin">Admin Dashboard</NavLink>
              )}
              <NavLink to="/catalog">Books</NavLink>
              <NavLink to="/my-loans">Borrowed</NavLink>
              <NavLink to="/profile">Profile</NavLink>
              <span className="nav-user">{user.name}</span>
              <button type="button" className="btn btn-ghost btn-small" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/">Home</Link>
              <button 
                type="button" 
                className="nav-btn-link"
                onClick={() => setShowRolePicker(true)}
              >
                Login
              </button>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      <main>{children}</main>

      {/* Role Picker Modal Overlay */}
      {showRolePicker && createPortal(
        <div className="role-modal" role="dialog" aria-modal="true" aria-labelledby="role-picker-title">
          <div className="role-modal-card">
            <p className="eyebrow">Choose access</p>
            <h2 id="role-picker-title">Are you a student or admin?</h2>
            <p className="subhead">Students can log in or register. Admins can go straight to the staff login.</p>
            <div className="role-actions">
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => {
                  setShowRolePicker(false);
                  navigate('/login?role=student');
                }}
              >
                Student Login
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => {
                  setShowRolePicker(false);
                  navigate('/login?role=admin');
                }}
              >
                Admin Login
              </button>
              <button type="button" className="role-close" onClick={() => setShowRolePicker(false)}>
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
