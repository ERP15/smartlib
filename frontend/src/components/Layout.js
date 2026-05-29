import { Link, useNavigate } from 'react-router-dom';
import { getUser, clearAuth, isStaff } from '../utils/auth';
import { logout } from '../services/api';

export default function Layout({ children }) {
  const user = getUser();
  const navigate = useNavigate();
  const staff = isStaff();

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
        <Link to={staff ? '/admin' : '/catalog'} className="brand">
          <span className="brand-mark">SL</span>
          <span>SmartLib</span>
        </Link>
        <nav className="nav-links">
          {user ? (
            <>
              {staff ? (
                <Link to="/admin">Admin</Link>
              ) : (
                <>
                  <Link to="/catalog">Books</Link>
                  <Link to="/my-loans">My Borrowed</Link>
                </>
              )}
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
