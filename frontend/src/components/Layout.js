import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { getUser, clearAuth } from '../utils/auth';
import { logout, getMyBorrows, getNotifications, markNotificationRead, getOverdueBorrows } from '../services/api';


export default function Layout({ children }) {
  const user = getUser();
  const navigate = useNavigate();
  const userId = user?.id;
  const userRole = user?.role;
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'analytics';
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [overdueBook, setOverdueBook] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [adminOverdueCount, setAdminOverdueCount] = useState(0);


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
  }, [userId, userRole]);

  React.useEffect(() => {
    if (!user || user.role !== 'student') {
      setNotifications([]);
      setShowNotificationPopup(false);
      return;
    }

    const checkNotifications = async () => {
      try {
        const res = await getNotifications();
        const activeNotifs = res.data.notifications || [];
        setNotifications(activeNotifs);
        if (activeNotifs.length > 0) {
          setShowNotificationPopup(true);
        } else {
          setShowNotificationPopup(false);
        }
      } catch (err) {
        console.error("Failed to check student notifications", err);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);

    return () => clearInterval(interval);
  }, [userId, userRole]);

  React.useEffect(() => {
    if (!user || user.role !== 'admin') {
      setAdminOverdueCount(0);
      return;
    }

    const checkAdminOverdue = async () => {
      try {
        const res = await getOverdueBorrows();
        const overdueList = res.data.borrows || [];
        setAdminOverdueCount(overdueList.length);
      } catch (err) {
        console.error("Failed to check admin overdue borrows", err);
      }
    };

    checkAdminOverdue();
    const interval = setInterval(checkAdminOverdue, 30000);

    return () => clearInterval(interval);
  }, [userId, userRole]);

  const handleDismissNotification = async (notifId) => {
    try {
      await markNotificationRead(notifId);
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== notifId);
        if (updated.length === 0) {
          setShowNotificationPopup(false);
        }
        return updated;
      });
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };


  React.useEffect(() => {
    if (!userId) return;

    let idleTimeout;

    const resetTimer = () => {
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(async () => {
        try {
          await logout();
        } catch {
          /* session already dead */
        }
        clearAuth();
        navigate('/');
        window.location.reload();
      }, 25 * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(idleTimeout);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [userId, navigate]);

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
                <>
                  {['analytics', 'books', 'borrows', 'pending', 'overdue'].map((t) => {
                    const label = t === 'analytics' ? 'Admin Dashboard' : t === 'pending' ? 'Pending' : t.charAt(0).toUpperCase() + t.slice(1);
                    const isActive = location.pathname === '/admin' && activeTab === t;
                    return (
                      <Link
                        key={t}
                        to={`/admin?tab=${t}`}
                        className={isActive ? 'active' : ''}
                        style={{ position: 'relative' }}
                      >
                        {label}
                        {t === 'overdue' && adminOverdueCount > 0 && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '-12px',
                              background: 'var(--danger)',
                              color: 'white',
                              borderRadius: '10px',
                              padding: '2px 6px',
                              fontSize: '0.7rem',
                              fontWeight: 'bold',
                              lineHeight: 1,
                              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                              border: '1px solid white'
                            }}
                          >
                            {adminOverdueCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </>
              )}
              {user.role === 'student' && (
                <NavLink to="/catalog">Books</NavLink>
              )}
              {user.role === 'student' && (
                <NavLink to="/my-borrowed">Borrowed</NavLink>
              )}
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

      {user && user.role === 'student' && showNotificationPopup && notifications.length > 0 && createPortal(
        <div 
          className="notification-popup-container fade-in" 
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '380px',
            maxHeight: '400px',
            backgroundColor: 'var(--surface)',
            border: '2px solid var(--primary)',
            borderRadius: '16px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div style={{
            backgroundColor: 'var(--primary)',
            color: 'black',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 'bold'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔔</span> Book Due Reminder ({notifications.length})
            </span>
            <button 
              type="button" 
              onClick={async () => {
                const notifsToDismiss = [...notifications];
                for (const n of notifsToDismiss) {
                  await handleDismissNotification(n.id);
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'black',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '0 0.25rem',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
          <div style={{
            padding: '1rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {notifications.map(n => {
              const message = n.message;
              return (
                <div 
                  key={n.id} 
                  style={{
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '0.75rem',
                    fontSize: '0.85rem',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: 'var(--text)', marginBottom: '0.25rem' }}>
                    {n.title}
                  </div>
                  <div style={{ color: 'var(--text)', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                    {message}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-small"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={() => handleDismissNotification(n.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
