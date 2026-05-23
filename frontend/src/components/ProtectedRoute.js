import { Navigate } from 'react-router-dom';
import { getUser, homePathForRole } from '../utils/auth';

export function ProtectedRoute({ children, staffOnly }) {
  const user = getUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (staffOnly && user.role !== 'admin' && user.role !== 'librarian') {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }
  return children;
}
