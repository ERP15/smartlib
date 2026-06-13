import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getUser, clearAuth } from '../utils/auth';
import { logout, getMyBorrows } from '../services/api';

export default function Layout({ children }) {
  const user = getUser();
  const navigate = useNavigate();
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [overdueBook, setOverdueBook] = useState(null);

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

  React.useEffect(() => {
    if (!user || user.role !== 'student') {
      setOverdueBook(null);
      return;
    }

    const checkOverdue = async () => {
      try {
        const res = await getMyBorrows();
        const borrowsList = res.data.borrows || [];
        const overdue = borrowsList.find(b => b.status === 'overdue');
        setOverdueBook(overdue || null);
      } catch (err) {
        console.error("Failed to check student overdue books", err);
      }
    };

    checkOverdue();
    const interval = setInterval(checkOverdue, 30000);

    return () => clearInterval(interval);
  }, [user]);

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
              {user.role === 'admin' && (
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

      {user && user.role === 'student' && overdueBook && (
        <div 
          className="overdue-student-banner fade-in" 
          style={{
            background: '#fff5f5',
            borderBottom: '1px solid #ffe3e3',
            color: '#c53030',
            padding: '0.75rem 1.5rem',
            textAlign: 'center',
            fontSize: '0.9rem',
            fontWeight: '600',
            boxShadow: 'inset 0 -1px 3px rgba(0,0,0,0.02)'
          }}
        >
          Your borrowed book, <strong>{overdueBook.book_title}</strong>, is overdue. It was due on <strong>{new Date(overdueBook.due_date).toLocaleDateString()}</strong>. Please return it to the library as soon as possible to avoid additional penalties or fines.
        </div>
      )}

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
