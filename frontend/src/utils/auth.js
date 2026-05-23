export function getUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('user');
  localStorage.removeItem('access_token');
}

export function isLoggedIn() {
  return !!getUser();
}

export function isStaff() {
  const user = getUser();
  return user && (user.role === 'admin' || user.role === 'librarian');
}

export function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}

export function homePathForRole(role) {
  if (role === 'admin' || role === 'librarian') return '/admin';
  return '/catalog';
}
