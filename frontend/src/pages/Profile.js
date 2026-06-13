import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUser, isStaff, setUser } from '../utils/auth';
import { getMyBorrows, updateProfile } from '../services/api';

export default function Profile() {
  const [profileUser, setProfileUser] = useState(getUser());
  const staff = isStaff();

  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: profileUser?.name || '',
    email: profileUser?.email || '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyBorrows();
        setBorrows(res.data.borrows || []);
      } catch (err) {
        console.error("Failed to load borrows", err);
      } finally {
        setLoading(false);
      }
    };
    if (profileUser) {
      load();
    } else {
      setLoading(false);
    }
  }, [profileUser]);

  useEffect(() => {
    if (isEditing) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isEditing]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
      };
      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }
      const res = await updateProfile(payload);
      setUser(res.data.user);
      setProfileUser(res.data.user);
      setIsEditing(false);
      setMessage('Profile updated successfully.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  if (!profileUser) {
    return null;
  }

  return (
    <div className="page profile-page fade-in">
      {error && !isEditing && <div className="alert">{error}</div>}
      {message && <div className="success">{message}</div>}

      <section className="hero-banner panel cinematic-banner">
        <div className="hero-banner-copy">
          <p className="eyebrow">Account</p>
          <h1>{profileUser.name}</h1>
          <p className="subhead">
            {staff ? 'Staff profile and dashboard access.' : 'Member profile and borrowing overview.'}
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to={staff ? '/admin' : '/catalog'}>
              {staff ? 'Open Dashboard' : 'Browse Books'}
            </Link>
            <Link className="btn btn-ghost" to="/my-loans">
              Borrowed
            </Link>
            <button type="button" className="btn btn-ghost" onClick={() => {
              setEditForm({
                name: profileUser.name,
                email: profileUser.email,
                password: ''
              });
              setIsEditing(true);
            }}>
              Edit Profile
            </button>
          </div>
        </div>
        <div className="hero-spotlight profile-spotlight">
          <div>
            <span className="eyebrow">Role</span>
            <strong>{profileUser.role === 'admin' ? 'Admin' : 'Student'}</strong>
          </div>
          <div>
            <span className="eyebrow">Email</span>
            <strong>{profileUser.email || 'Not available'}</strong>
          </div>
          <div>
            <span className="eyebrow">Username</span>
            <strong>{profileUser.name}</strong>
          </div>
        </div>
      </section>

      <section className="profile-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="profile-card">
          <p className="eyebrow" style={{ color: 'var(--accent)' }}>Recent Borrowing History</p>
          <h2 style={{ marginBottom: '1.25rem' }}>Latest Borrowed Books</h2>
          {loading ? (
            <p className="muted">Loading latest loans...</p>
          ) : borrows.length === 0 ? (
            <p className="muted">You haven't borrowed any books yet. Browse books to get started!</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {borrows.slice(0, 3).map((b) => (
                <div 
                  key={b.id} 
                  style={{ 
                    padding: '1.25rem', 
                    borderRadius: '12px', 
                    background: 'var(--surface-2)', 
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '130px'
                  }}
                >
                  <div>
                    <span className={`status ${b.status === 'overdue' ? 'danger' : b.status === 'returned' ? '' : 'warning'}`} style={{ marginBottom: '0.5rem' }}>
                      {b.status}
                    </span>
                    <h3 style={{ margin: '0.25rem 0 0', fontSize: '1rem', fontWeight: 'bold', color: 'var(--text)' }}>
                      {b.book_title}
                    </h3>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
                      By {b.book_author}
                    </p>
                  </div>
                  <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Due: {new Date(b.due_date).toLocaleDateString()}</span>
                    {b.actual_return_date && (
                      <span style={{ color: 'var(--success)' }}>Returned</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Edit Profile Modal Overlay */}
      {isEditing && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
          <div className="modal-card" style={{ maxWidth: '520px', width: '100%', padding: '1.25rem' }}>
            <button type="button" className="modal-close" onClick={() => setIsEditing(false)} aria-label="Close edit profile dialog">
              ×
            </button>
            <p className="eyebrow">Settings</p>
            <h2 id="edit-profile-title" style={{ margin: '0.15rem 0 0.35rem' }}>Edit Profile</h2>
            <p className="subhead">Update your personal account credentials.</p>
            
            {error && <div className="alert" style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem' }}>{error}</div>}
            
            <form 
              onSubmit={handleUpdateProfile} 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '0.85rem', 
                marginTop: '1.25rem' 
              }}
            >
              <label className="field" style={{ gridColumn: 'span 2' }}>
                <span>Full Name</span>
                <input
                  type="text"
                  className="input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </label>
              <label className="field" style={{ gridColumn: 'span 1' }}>
                <span>Email Address</span>
                <input
                  type="email"
                  className="input"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </label>
              <label className="field" style={{ gridColumn: 'span 1' }}>
                <span>New Password</span>
                <input
                  type="password"
                  className="input"
                  placeholder="Leave blank to keep current"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                />
              </label>

              <div 
                className="hero-actions" 
                style={{ 
                  gridColumn: 'span 2', 
                  marginTop: '0.5rem', 
                  display: 'flex', 
                  gap: '0.75rem', 
                  justifyContent: 'flex-end' 
                }}
              >
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
