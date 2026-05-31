import { Link, useNavigate } from 'react-router-dom';
import { getUser, clearAuth } from '../utils/auth';
import { logout } from '../services/api';

export default function Layout({ children }) {
  const user = getUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      /* session may already be gone */
    }
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="app">
      <header className="nav">
        <Link to={user ? '/catalog' : '/'} className="brand">
          <img src="/pup-logo.png" alt="PUP Logo" className="brand-logo" />
          <span>SmartLib</span>
        </Link>
        <nav className="nav-links">
          {user ? (
            <>
              <Link to="/catalog">Catalog</Link>
              <Link to="/my-loans">My Loans</Link>
              <Link to="/profile">Profile</Link>
              <span className="nav-user">{user.name}</span>
              <button type="button" className="btn btn-ghost btn-small" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/">Home</Link>
              <Link to="/login">Login</Link>
              <Link className="btn btn-primary btn-small" to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
