import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Catalog from './pages/Catalog';
import MyLoans from './pages/MyLoans';
import AdminDashboard from './pages/AdminDashboard';
import { getUser, homePathForRole } from './utils/auth';

function Home() {
  const user = getUser();
  if (user) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">SmartLib Library System</p>
          <h1>Find, borrow, and track your next read in one place.</h1>
          <p className="subhead">
            Browse the catalog, borrow books, track due dates, and manage the library from the admin dashboard.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/register">Get Started</Link>
            <Link className="btn btn-ghost" to="/login">Member Login</Link>
          </div>
        </div>
        <div className="hero-card">
          <div className="card-header">
            <span>Phase 6 features</span>
            <span className="pill">Live</span>
          </div>
          <ul className="aside-list">
            <li>Book catalog with search</li>
            <li>Borrow & return system</li>
            <li>Borrow history & overdue alerts</li>
            <li>Admin dashboard & book CRUD</li>
          </ul>
        </div>
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
