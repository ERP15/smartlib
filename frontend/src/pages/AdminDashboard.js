import React, { useEffect, useState } from 'react';
import {
  getAdminDashboard,
  getBooks,
  createBook,
  updateBook,
  deleteBook,
  getBorrows,
  getOverdueBorrows,
  returnBook,
} from '../services/api';

const emptyBook = {
  title: '',
  author: '',
  genre: '',
  isbn: '',
  quantity: 1,
  available_quantity: 1,
  description: '',
};

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [books, setBooks] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [bookForm, setBookForm] = useState(emptyBook);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    const res = await getAdminDashboard();
    setStats(res.data.stats);
    setRecent(res.data.recent_borrows || []);
    setOverdue(res.data.overdue_loans || []);
  };

  const loadBooks = async (q = '') => {
    const res = await getBooks(q);
    setBooks(res.data.books || []);
  };

  const loadBorrows = async () => {
    const res = await getBorrows();
    setBorrows(res.data.borrows || []);
  };

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadDashboard(), loadBooks(), loadBorrows()]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      if (editingId) {
        await updateBook(editingId, bookForm);
        setMessage('Book updated.');
      } else {
        await createBook(bookForm);
        setMessage('Book created.');
      }
      setBookForm(emptyBook);
      setEditingId(null);
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save book');
    }
  };

  const startEdit = (book) => {
    setEditingId(book.id);
    setBookForm({
      title: book.title,
      author: book.author,
      genre: book.genre,
      isbn: book.isbn || '',
      quantity: book.quantity,
      available_quantity: book.available_quantity,
      description: book.description || '',
    });
    setTab('books');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await deleteBook(id);
      setMessage('Book deleted.');
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete book');
    }
  };

  const handleReturn = async (borrowId) => {
    try {
      await returnBook(borrowId);
      setMessage('Loan marked as returned.');
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not return');
    }
  };

  const refreshOverdue = async () => {
    try {
      const res = await getOverdueBorrows();
      setOverdue(res.data.borrows || []);
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to refresh overdue');
    }
  };

  if (loading && !stats) {
    return (
      <div className="page">
        <p className="muted">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="page admin-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Staff portal</p>
          <h1>Admin dashboard</h1>
          <p className="subhead">Manage books, loans, and overdue items.</p>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}
      {message && <div className="success">{message}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-number">{stats.total_books}</span>
            <span className="stat-label">Books in catalog</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.available_copies}</span>
            <span className="stat-label">Copies available</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.active_borrows}</span>
            <span className="stat-label">Active loans</span>
          </div>
          <div className="stat-card highlight">
            <span className="stat-number">{stats.overdue_count}</span>
            <span className="stat-label">Overdue</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.total_users}</span>
            <span className="stat-label">Registered users</span>
          </div>
        </div>
      )}

      <div className="tabs">
        {['overview', 'books', 'borrows', 'overdue'].map((t) => (
          <button
            key={t}
            type="button"
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="admin-grid">
          <section className="panel">
            <h2>Recent activity</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Book</th>
                  <th>Status</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((b) => (
                  <tr key={b.id}>
                    <td>{b.user_name}</td>
                    <td>{b.book_title}</td>
                    <td><span className={`status ${b.status === 'overdue' ? 'danger' : ''}`}>{b.status}</span></td>
                    <td>{b.due_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>Overdue loans</h2>
              <button type="button" className="btn btn-ghost btn-small" onClick={refreshOverdue}>
                Refresh
              </button>
            </div>
            {overdue.length === 0 ? (
              <p className="muted">No overdue loans.</p>
            ) : (
              <ul className="book-list">
                {overdue.map((b) => (
                  <li key={b.id}>
                    <div>
                      <p className="book-title">{b.book_title}</p>
                      <p className="book-meta">{b.user_name} · due {b.due_date}</p>
                    </div>
                    <button type="button" className="btn btn-primary btn-small" onClick={() => handleReturn(b.id)}>
                      Return
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === 'books' && (
        <div className="admin-grid">
          <section className="panel">
            <h2>{editingId ? 'Edit book' : 'Add book'}</h2>
            <form className="form" onSubmit={handleBookSubmit}>
              <label className="field">
                <span>Title</span>
                <input className="input" required value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} />
              </label>
              <label className="field">
                <span>Author</span>
                <input className="input" required value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} />
              </label>
              <label className="field">
                <span>Genre</span>
                <input className="input" required value={bookForm.genre} onChange={(e) => setBookForm({ ...bookForm, genre: e.target.value })} />
              </label>
              <label className="field">
                <span>ISBN</span>
                <input className="input" value={bookForm.isbn} onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })} />
              </label>
              <div className="form-row">
                <label className="field">
                  <span>Quantity</span>
                  <input type="number" min="0" className="input" value={bookForm.quantity} onChange={(e) => setBookForm({ ...bookForm, quantity: Number(e.target.value) })} />
                </label>
                <label className="field">
                  <span>Available</span>
                  <input type="number" min="0" className="input" value={bookForm.available_quantity} onChange={(e) => setBookForm({ ...bookForm, available_quantity: Number(e.target.value) })} />
                </label>
              </div>
              <label className="field">
                <span>Description</span>
                <textarea className="input" rows={3} value={bookForm.description} onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })} />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Create'}</button>
                {editingId && (
                  <button type="button" className="btn btn-ghost" onClick={() => { setEditingId(null); setBookForm(emptyBook); }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>
          <section className="panel">
            <form className="search-bar" onSubmit={(e) => { e.preventDefault(); loadBooks(search); }}>
              <input className="input" placeholder="Search catalog..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <button type="submit" className="btn btn-primary btn-small">Search</button>
            </form>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Avail.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id}>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.available_quantity}/{book.quantity}</td>
                    <td className="table-actions">
                      <button type="button" className="btn btn-ghost btn-small" onClick={() => startEdit(book)}>Edit</button>
                      <button type="button" className="btn btn-ghost btn-small" onClick={() => handleDelete(book.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {tab === 'borrows' && (
        <section className="panel">
          <h2>All borrow records</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Book</th>
                <th>Due</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {borrows.map((b) => (
                <tr key={b.id}>
                  <td>{b.user_name}<br /><span className="book-meta">{b.user_email}</span></td>
                  <td>{b.book_title}</td>
                  <td>{b.due_date}</td>
                  <td><span className={`status ${b.status === 'overdue' ? 'danger' : ''}`}>{b.status}</span></td>
                  <td>
                    {b.status !== 'returned' && (
                      <button type="button" className="btn btn-primary btn-small" onClick={() => handleReturn(b.id)}>Return</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === 'overdue' && (
        <section className="panel">
          <div className="panel-head">
            <h2>Overdue detection</h2>
            <button type="button" className="btn btn-ghost btn-small" onClick={refreshOverdue}>Run check</button>
          </div>
          <p className="subhead">Loans past due date are marked overdue automatically when you load this page.</p>
          {overdue.length === 0 ? (
            <p className="muted">No overdue loans right now.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Book</th>
                  <th>Due date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((b) => (
                  <tr key={b.id}>
                    <td>{b.user_name} ({b.student_id})</td>
                    <td>{b.book_title}</td>
                    <td>{b.due_date}</td>
                    <td>
                      <button type="button" className="btn btn-primary btn-small" onClick={() => handleReturn(b.id)}>Return</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}
