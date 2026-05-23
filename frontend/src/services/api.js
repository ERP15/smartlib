import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export const register = (payload) => api.post('/api/auth/register', payload);
export const login = (payload) => api.post('/api/auth/login', payload);
export const logout = () => api.post('/api/auth/logout');
export const getMe = () => api.get('/api/auth/me');

export const getBooks = (q) => api.get('/api/books', { params: q ? { q } : {} });
export const getBook = (id) => api.get(`/api/books/${id}`);
export const createBook = (payload) => api.post('/api/books', payload);
export const updateBook = (id, payload) => api.put(`/api/books/${id}`, payload);
export const deleteBook = (id) => api.delete(`/api/books/${id}`);

export const getBorrows = () => api.get('/api/borrows');
export const getMyBorrows = () => api.get('/api/borrows/mine');
export const getOverdueBorrows = () => api.get('/api/borrows/overdue');
export const borrowBook = (bookId) => api.post('/api/borrows', { book_id: bookId });
export const returnBook = (borrowId) => api.post(`/api/borrows/${borrowId}/return`);

export const getAdminDashboard = () => api.get('/api/admin/dashboard');

export default api;
