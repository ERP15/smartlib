import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Catalog from './pages/Catalog';
import MyLoans from './pages/MyLoans';
import AdminDashboard from './pages/AdminDashboard';
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
      <div className="landing-backdrop" />
      <div className="landing-overlay" />
      <section className="landing-shell">
        <div className="landing-copy">
          <p className="eyebrow">SmartLib Library System</p>
          <h1>Discover, borrow, and manage with a calmer library experience.</h1>
          <p className="subhead">
            Student access stays simple. Admin access stays separate. Choose the path that fits you.
          </p>
          <button type="button" className="btn btn-primary landing-cta" onClick={() => setShowPicker(true)}>
            Login / Register
          </button>
        </div>

        {showPicker && (
          <div className="role-modal" role="dialog" aria-modal="true" aria-labelledby="role-picker-title">
            <div className="role-modal-card">
              <p className="eyebrow">Choose your path</p>
              <h2 id="role-picker-title">Are you a student or admin?</h2>
              <p className="subhead">Students can log in and register. Admins go straight to the admin login.</p>
              <div className="role-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => navigate('/login?role=student')}
                >
                  Student
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-block"
                  onClick={() => navigate('/login?role=admin')}
                >
                  Admin
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
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/catalog"
          element={
            <ProtectedRoute>
              <Catalog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-loans"
          element={
            <ProtectedRoute>
              <MyLoans />
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
