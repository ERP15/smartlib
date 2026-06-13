import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Catalog from './pages/Catalog';
import MyBorrowed from './pages/MyBorrowed';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import { getUser, homePathForRole } from './utils/auth';

function Home() {
  const [showPicker, setShowPicker] = useState(false);
  const navigate = useNavigate();
  const user = getUser();
  if (user) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  return (
    <div className="page landing-page">
      <div className="landing-glow" />
      <section className="landing-shell">
        <div className="landing-copy surface-card">
          <p className="eyebrow">SmartLib Library System</p>
          <h1>A modern academic library experience for students and schools.</h1>
          <p className="subhead">
            Browse a well-organized collection of books, track your borrowed books, and manage library activity with a clean professional interface.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary landing-cta" onClick={() => setShowPicker(true)}>
              Login / Register
            </button>
            <button type="button" className="btn btn-ghost landing-cta" onClick={() => navigate('/catalog')}>
              Browse Books
            </button>
          </div>
          <div className="hero-metrics">
            <div>
              <strong>Clean</strong>
              <span>Academic-first layout</span>
            </div>
            <div>
              <strong>Fast</strong>
              <span>Simple browsing and borrowing</span>
            </div>
            <div>
              <strong>Responsive</strong>
              <span>Works on desktop and mobile</span>
            </div>
          </div>
        </div>

        {showPicker && (
          <div className="role-modal" role="dialog" aria-modal="true" aria-labelledby="role-picker-title">
            <div className="role-modal-card">
              <p className="eyebrow">Choose access</p>
              <h2 id="role-picker-title">Are you a student or admin?</h2>
              <p className="subhead">Students can log in or register. Admins can go straight to the staff login.</p>
              <div className="role-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => navigate('/login?role=student')}
                >
                  Student Login
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-block"
                  onClick={() => navigate('/login?role=admin')}
                >
                  Admin Login
                </button>
                <button type="button" className="role-close" onClick={() => setShowPicker(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route
          path="/my-borrowed"
          element={
            <ProtectedRoute>
              <MyBorrowed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute staffOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;
