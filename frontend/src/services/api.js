import axios from 'axios';

const getApiUrl = () => {
  let url = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
  if (typeof window !== 'undefined' && 
      window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1' && 
      !window.location.hostname.startsWith('192.168.')) {
    url = 'https://smartlib2.vercel.app';
  } else if (typeof window !== 'undefined') {
    url = `${window.location.protocol}//${window.location.hostname}:5000`;
  }
  return url;
};

export const API_URL = getApiUrl();
export const API_BASE_URL = API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const register = (payload) => api.post('/api/auth/register', payload);
export const login = (payload) => api.post('/api/auth/login', payload);
export const logout = () => api.post('/api/auth/logout');
export const getMe = () => api.get('/api/auth/me');

export const getBooks = (q) => api.get('/api/books', { params: q ? { q } : {} });
export const getBook = (id) => api.get(`/api/books/${id}`);
export const getRecommendations = (params = {}) => api.get('/api/books/recommendations', { params });
export const createBook = (payload) => api.post('/api/books', payload);
export const updateBook = (id, payload) => api.put(`/api/books/${id}`, payload);
export const deleteBook = (id) => api.delete(`/api/books/${id}`);

export const getBorrows = () => api.get('/api/borrows');
export const getMyBorrows = () => api.get('/api/borrows/mine');
export const getOverdueBorrows = () => api.get('/api/borrows/overdue');
export const getPendingReturns = () => api.get('/api/borrows/pending');
export const borrowBook = (bookId, borrowDuration, borrowUnit, dueDate) => api.post('/api/borrows', {
  book_id: bookId,
  borrow_duration: borrowDuration,
  borrow_unit: borrowUnit,
  due_date: dueDate,
});
export const returnBook = (borrowId) => api.post(`/api/borrows/${borrowId}/return`);
export const requestReturnBook = (borrowId) => api.post(`/api/borrows/${borrowId}/return`);
export const confirmReturn = (borrowId) => api.post(`/api/borrows/${borrowId}/confirm-return`);
export const rejectReturn = (borrowId) => api.post(`/api/borrows/${borrowId}/reject-return`);
export const sendDueReminder = (borrowId) => api.post(`/api/borrows/${borrowId}/send-reminder`);
export const getNotifications = () => api.get('/api/borrows/notifications');
export const markNotificationRead = (notificationId) => api.post(`/api/borrows/notifications/${notificationId}/read`);


export const uploadBookImage = (file) => {
  const form = new FormData();
  form.append('image', file);
  return api.post('/api/books/upload-image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getAdminDashboard = () => api.get('/api/admin/dashboard');
export const getAdminReports = () => api.get('/api/admin/reports');
export const getAdminReportsExport = (format = 'excel') => api.get('/api/admin/reports/export', { params: { format }, responseType: 'blob' });
export const getAdminUsers = () => api.get('/api/admin/users');
export const updateAdminUser = (userId, data) => api.put(`/api/admin/users/${userId}`, data);
export const deleteAdminUser = (userId) => api.delete(`/api/admin/users/${userId}`);
export const updateProfile = (data) => api.put('/api/auth/profile', data);
export const backupDatabase = () => api.get('/api/admin/backup', { responseType: 'blob' });

export default api;
