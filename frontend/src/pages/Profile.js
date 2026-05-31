import React from 'react';
import { Link } from 'react-router-dom';
import { getUser, isStaff } from '../utils/auth';

export default function Profile() {
  const user = getUser();
  const staff = isStaff();

  if (!user) {
    return null;
  }

  return (
    <div className="page profile-page fade-in">
      <section className="hero-banner panel cinematic-banner">
        <div className="hero-banner-copy">
          <p className="eyebrow">Account</p>
          <h1>{user.name}</h1>
          <p className="subhead">
            {staff ? 'Staff profile and dashboard access.' : 'Member profile and borrowing overview.'}
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to={staff ? '/admin' : '/catalog'}>
              {staff ? 'Open Dashboard' : 'Browse Catalog'}
            </Link>
            <Link className="btn btn-ghost" to="/my-loans">
              My Loans
            </Link>
          </div>
        </div>
        <div className="hero-spotlight profile-spotlight">
          <div>
            <span className="eyebrow">Role</span>
            <strong>{staff ? 'Staff' : 'Student'}</strong>
          </div>
          <div>
            <span className="eyebrow">Email</span>
            <strong>{user.email || 'Not available'}</strong>
          </div>
          <div>
            <span className="eyebrow">Username</span>
            <strong>{user.username || user.student_id || 'SmartLib user'}</strong>
          </div>
        </div>
      </section>

      <section className="profile-grid">
        <div className="profile-card">
          <p className="eyebrow">Quick actions</p>
          <ul className="aside-list">
            <li>Continue browsing the catalog.</li>
            <li>Check active loans and due dates.</li>
            <li>Review personalized recommendations.</li>
          </ul>
        </div>
        <div className="profile-card profile-card-accent">
          <p className="eyebrow">SmartLib status</p>
          <h2>Professional library workspace</h2>
          <p className="subhead">
            Clear navigation, consistent spacing, and a borrowing flow designed for students and school staff.
          </p>
        </div>
      </section>
    </div>
  );
}
