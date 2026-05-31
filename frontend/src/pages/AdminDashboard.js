import React, { useEffect, useState } from 'react';
import {
  getAdminDashboard,
  getAdminReports,
  getAdminReportsExport,
  getBooks,
  createBook,
  updateBook,
  deleteBook,
  getBorrows,
  getOverdueBorrows,
  getPendingReturns,
  confirmReturn,
  rejectReturn,
  uploadBookImage,
} from '../services/api';
import { saveAs } from 'file-saver';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const emptyBook = {
  title: '',
  author: '',
  quantity: 1,
  available_quantity: 1,
  description: '',
  image: '',
};

function resolveImageUrl(image) {
  if (!image) return null;
  return image.startsWith('/') ? `${API_BASE_URL}${image}` : image;
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState(null);
  const [recent, setRecent] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [pendingReturns, setPendingReturns] = useState([]);
  const [books, setBooks] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [bookForm, setBookForm] = useState(emptyBook);
  const [bookImageFile, setBookImageFile] = useState(null);
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

  const loadReports = async () => {
    const res = await getAdminReports();
    setReports(res.data);
  };

  const loadBooks = async (q = '') => {
    const res = await getBooks(q);
    setBooks(res.data.books || []);
  };

  const loadBorrows = async () => {
    const res = await getBorrows();
    setBorrows(res.data.borrows || []);
  };

  const loadPendingReturns = async () => {
    const res = await getPendingReturns();
    setPendingReturns(res.data.borrows || []);
  };

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadDashboard(), loadReports(), loadBooks(), loadBorrows(), loadPendingReturns()]);
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
      const payload = { ...bookForm };
      if (bookImageFile) {
        const imageRes = await uploadBookImage(bookImageFile);
        payload.image = imageRes.data.image;
      }
      if (editingId) {
        await updateBook(editingId, payload);
        setMessage('Book updated.');
      } else {
        await createBook(payload);
        setMessage('Book created.');
      }
      setBookForm(emptyBook);
      setBookImageFile(null);
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
      quantity: book.quantity,
      available_quantity: book.available_quantity,
      description: book.description || '',
      image: book.image || '',
    });
    setBookImageFile(null);
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

  const handleConfirmReturn = async (borrowId) => {
    try {
      await confirmReturn(borrowId);
      setMessage('Return request confirmed.');
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not confirm return');
    }
  };

  const handleRejectReturn = async (borrowId) => {
    try {
      await rejectReturn(borrowId);
      setMessage('Return request rejected.');
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reject return');
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

  const handleExport = async (format) => {
    try {
      const res = await getAdminReportsExport(format);
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
      const cd = res.headers['content-disposition'] || '';
      let filename = `library-reports.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      const m = cd.match(/filename\*=UTF-8''(.+)$|filename="?([^";]+)"?/);
      if (m) filename = decodeURIComponent(m[1] || m[2]);
      saveAs(blob, filename);
    } catch (err) {
      setError('Failed to generate export');
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="stat-number">{stats.total_books}</span>
                <span className="stat-label">Total Books</span>
              </div>
              <span style={{ fontSize: '1.75rem' }}>📚</span>
            </div>
          </div>
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="stat-number">{stats.available_copies}</span>
                <span className="stat-label">Copies Available</span>
              </div>
              <span style={{ fontSize: '1.75rem', color: 'var(--success)' }}>🟢</span>
            </div>
          </div>
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="stat-number">{stats.active_borrows}</span>
                <span className="stat-label">Active Loans</span>
              </div>
              <span style={{ fontSize: '1.75rem', color: 'var(--accent)' }}>📖</span>
            </div>
          </div>
          <div className="stat-card highlight">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="stat-number" style={{ color: 'var(--danger)' }}>{stats.overdue_count}</span>
                <span className="stat-label">Overdue Borrowed</span>
              </div>
              <span style={{ fontSize: '1.75rem', color: 'var(--danger)' }}>🔴</span>
            </div>
          </div>
          {stats.pending_returns !== undefined && (
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="stat-number" style={{ color: 'var(--warning)' }}>{stats.pending_returns}</span>
                  <span className="stat-label">Pending Returns</span>
                </div>
                <span style={{ fontSize: '1.75rem', color: 'var(--warning)' }}>⏳</span>
              </div>
            </div>
          )}
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="stat-number">{stats.total_users}</span>
                <span className="stat-label">Registered Members</span>
              </div>
              <span style={{ fontSize: '1.75rem' }}>👥</span>
            </div>
          </div>
        </div>
      )}

      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {['overview', 'books', 'borrows', 'pending', 'overdue', 'analytics', 'reports'].map((t) => (
          <button
            key={t}
            type="button"
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'pending' ? 'Pending' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="admin-grid">
          <section className="panel" style={{ flex: 1.5 }}>
            <h2>Recent Activity Logs</h2>
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Book Title</th>
                    <th>Status</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="muted" style={{ textAlign: 'center' }}>No recent activity.</td>
                    </tr>
                  ) : (
                    recent.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <strong>{b.user_name}</strong>
                          <div className="muted" style={{ fontSize: '0.75rem' }}>Student</div>
                        </td>
                        <td>{b.book_title}</td>
                        <td>
                          <span className={`status ${b.status === 'overdue' ? 'danger' : b.status === 'returned' ? '' : 'warning'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td>{formatDateTime(b.due_date)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel" style={{ flex: 1 }}>
            <div className="panel-head">
              <h2>Overdue Alert</h2>
              <button type="button" className="btn btn-ghost btn-small" onClick={refreshOverdue}>
                Refresh Check
              </button>
            </div>
            {overdue.length === 0 ? (
              <p className="muted" style={{ padding: '1rem 0' }}>No overdue borrowed books detected.</p>
            ) : (
              <ul className="book-list">
                {overdue.slice(0, 5).map((b) => (
                  <li key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p className="book-title" style={{ margin: 0, fontSize: '0.95rem' }}>{b.book_title}</p>
                      <p className="subhead" style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                        {b.user_name} · due {formatDateTime(b.due_date)}
                      </p>
                    </div>
                    <span className="status danger" style={{ fontSize: '0.7rem' }}>Overdue</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === 'books' && (
        <div className="admin-grid">
          <section className="panel" style={{ flex: 1 }}>
            <h2>{editingId ? '✏️ Edit Collection Title' : '📚 Add Book to Catalog'}</h2>
            <form className="form" onSubmit={handleBookSubmit} style={{ marginTop: '1.25rem' }}>
              <label className="field">
                <span>Book Title</span>
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
                <span>Cover Image File</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  className="input"
                  onChange={(e) => setBookImageFile(e.target.files?.[0] || null)}
                />
              </label>
              {bookForm.image && !bookImageFile && resolveImageUrl(bookForm.image) && (
                <div style={{ margin: '0.5rem 0' }}>
                  <img className="book-cover-preview" src={resolveImageUrl(bookForm.image)} alt={bookForm.title || 'Book cover'} />
                </div>
              )}
              <div className="form-row">
                <label className="field">
                  <span>Total Copies</span>
                  <input type="number" min="0" className="input" value={bookForm.quantity} onChange={(e) => setBookForm({ ...bookForm, quantity: Number(e.target.value) })} />
                </label>
                <label className="field">
                  <span>Available Copies</span>
                  <input type="number" min="0" className="input" value={bookForm.available_quantity} onChange={(e) => setBookForm({ ...bookForm, available_quantity: Number(e.target.value) })} />
                </label>
              </div>
              <label className="field">
                <span>Description Summary</span>
                <textarea className="input" rows={3} value={bookForm.description} onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })} />
              </label>
              <div className="hero-actions" style={{ justifyContent: 'flex-start', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Create Record'}</button>
                {editingId && (
                  <button type="button" className="btn btn-ghost" onClick={() => { setEditingId(null); setBookForm(emptyBook); }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="panel" style={{ flex: 1.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <h2>Manage Database Inventory</h2>
              <form className="search-bar" onSubmit={(e) => { e.preventDefault(); loadBooks(search); }} style={{ width: 'auto' }}>
                <input className="input" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <button type="submit" className="btn btn-primary btn-small">Go</button>
              </form>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Thumbnail</th>
                    <th>Book Details</th>
                    <th>In Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="muted" style={{ textAlign: 'center' }}>No books matching parameters.</td>
                    </tr>
                  ) : (
                    books.map((book) => (
                      <tr key={book.id}>
                        <td>
                          {resolveImageUrl(book.image) ? (
                            <img className="book-thumb" src={resolveImageUrl(book.image)} alt={book.title} />
                          ) : (
                            <div className="book-thumb book-thumb-placeholder">None</div>
                          )}
                        </td>
                        <td>
                          <strong>{book.title}</strong>
                          <div className="muted" style={{ fontSize: '0.8rem' }}>{book.author} · <span className="pill" style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}>{book.genre}</span></div>
                        </td>
                        <td>{book.available_quantity}/{book.quantity}</td>
                        <td className="table-actions">
                          <button type="button" className="btn btn-ghost btn-small" onClick={() => startEdit(book)}>Edit</button>
                          <button type="button" className="btn btn-ghost btn-small" onClick={() => handleDelete(book.id)}>Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {tab === 'borrows' && (
        <section className="panel">
          <h2>All Circulation Records</h2>
          <div style={{ overflowX: 'auto', marginTop: '1.25rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Borrower</th>
                  <th>Book Borrowed</th>
                  <th>Due Date</th>
                  <th>Loan Status</th>
                </tr>
              </thead>
              <tbody>
                {borrows.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="muted" style={{ textAlign: 'center' }}>No loans records in database.</td>
                  </tr>
                ) : (
                  borrows.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.user_name}</strong>
                        <div className="muted" style={{ fontSize: '0.8rem' }}>{b.user_email}</div>
                      </td>
                      <td>{b.book_title}</td>
                      <td>{formatDateTime(b.due_date)}</td>
                      <td>
                        <span className={`status ${b.status === 'overdue' ? 'danger' : b.status === 'returned' ? '' : 'warning'}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'pending' && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Pending Return Verifications</h2>
              <p className="subhead" style={{ marginTop: '0.25rem' }}>
                Confirm book physical reception or reject request.
              </p>
            </div>
          </div>
          {pendingReturns.length === 0 ? (
            <p className="muted" style={{ padding: '2rem 0', textAlign: 'center' }}>No return validations awaiting attention.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Details</th>
                    <th>Book Details</th>
                    <th>Requested On</th>
                    <th>Verification Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingReturns.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.user_name}</strong>
                        <div className="muted" style={{ fontSize: '0.8rem' }}>{b.user_email}</div>
                      </td>
                      <td>{b.book_title}</td>
                      <td>{formatDateTime(b.return_request_date)}</td>
                      <td className="table-actions">
                        <button type="button" className="btn btn-primary btn-small" onClick={() => handleConfirmReturn(b.id)}>
                          Confirm Receipt
                        </button>
                        <button type="button" className="btn btn-ghost btn-small" onClick={() => handleRejectReturn(b.id)}>
                          Reject Request
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'overdue' && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Active Overdue Tracking</h2>
              <p className="subhead" style={{ marginTop: '0.25rem' }}>
                System marks loans overdue automatically based on time matrix.
              </p>
            </div>
            <button type="button" className="btn btn-ghost btn-small" onClick={refreshOverdue}>Execute Run-Check</button>
          </div>
          {overdue.length === 0 ? (
            <p className="muted" style={{ padding: '2rem 0', textAlign: 'center' }}>No overdue loans currently recorded.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Borrower Student</th>
                    <th>Overdue Title</th>
                    <th>Official Due Date</th>
                    <th>Status Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {overdue.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.user_name}</strong>
                        <div className="muted" style={{ fontSize: '0.8rem' }}>ID: {b.student_id}</div>
                      </td>
                      <td>{b.book_title}</td>
                      <td>{formatDateTime(b.due_date)}</td>
                      <td className="muted">Validation handled in Returns Flow</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'analytics' && reports && (
        <div className="admin-grid">
          {/* Custom Visual Configurations for High Fidelity Charts */}
          {(() => {
            const chartPlugins = {
              legend: {
                labels: {
                  color: '#9ca3af',
                  font: { family: 'Inter', size: 12, weight: '500' }
                }
              },
              tooltip: {
                backgroundColor: '#0c101a',
                titleFont: { family: 'Outfit', size: 13, weight: 'bold' },
                bodyFont: { family: 'Inter', size: 12 },
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8
              }
            };
            const chartScales = {
              x: {
                grid: { color: 'rgba(255, 255, 255, 0.04)' },
                ticks: { color: '#9ca3af', font: { family: 'Inter', size: 11 } }
              },
              y: {
                grid: { color: 'rgba(255, 255, 255, 0.04)' },
                ticks: { color: '#9ca3af', font: { family: 'Inter', size: 11 } }
              }
            };

            return (
              <>
                <section className="panel" style={{ gridColumn: 'span 2' }}>
                  <h2>Circulation Borrow Trends (Last 30 Days)</h2>
                  <div style={{ height: '340px', marginTop: '1.5rem', position: 'relative' }}>
                    <Line
                      data={{
                        labels: reports.time_series.map((d) => d.date),
                        datasets: [{
                          label: 'Daily Borrows',
                          data: reports.time_series.map((d) => d.borrows),
                          borderColor: '#6366f1',
                          backgroundColor: 'rgba(99, 102, 241, 0.15)',
                          fill: true,
                          tension: 0.35,
                          borderWidth: 3,
                          pointBackgroundColor: '#6366f1',
                          pointHoverRadius: 7
                        }],
                      }}
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: chartPlugins,
                        scales: chartScales
                      }}
                    />
                  </div>
                </section>

                <section className="panel">
                  <h2>Overdue Trends (Time Dimension)</h2>
                  <div style={{ height: '280px', marginTop: '1.25rem', position: 'relative' }}>
                    <Line
                      data={{
                        labels: reports.overdue_trend.map((d) => d.date),
                        datasets: [{
                          label: 'Overdue Logs',
                          data: reports.overdue_trend.map((d) => d.overdue),
                          borderColor: '#ef4444',
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          fill: true,
                          tension: 0.3,
                          borderWidth: 2,
                          pointBackgroundColor: '#ef4444'
                        }],
                      }}
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: chartPlugins,
                        scales: chartScales
                      }}
                    />
                  </div>
                </section>

                <section className="panel">
                  <h2>Circulation Popularity by Genre</h2>
                  <div style={{ height: '280px', marginTop: '1.25rem', position: 'relative' }}>
                    <Bar
                      data={{
                        labels: reports.borrow_by_genre.map((g) => g.genre),
                        datasets: [{
                          label: 'Borrow Count',
                          data: reports.borrow_by_genre.map((g) => g.count),
                          backgroundColor: 'rgba(6, 182, 212, 0.65)',
                          borderColor: '#06b6d4',
                          borderWidth: 1,
                          borderRadius: 6
                        }],
                      }}
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: chartPlugins,
                        scales: chartScales
                      }}
                    />
                  </div>
                </section>
              </>
            );
          })()}
        </div>
      )}

      {tab === 'reports' && reports && (
        <div className="admin-page">
          <section className="panel">
            <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
              <div>
                <h2>Interactive Synthesis Summary</h2>
                <p className="subhead" style={{ marginTop: '0.25rem' }}>Download official reports format spreadsheet or document.</p>
              </div>
              <div className="hero-actions" style={{ margin: 0 }}>
                <button type="button" className="btn btn-ghost btn-small" onClick={() => handleExport('excel')}>Export MS Excel</button>
                <button type="button" className="btn btn-primary btn-small" onClick={() => handleExport('pdf')}>Export PDF Doc</button>
              </div>
            </div>
            
            <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
              <div className="stat-card">
                <span className="stat-number">{reports.summary.total_borrows}</span>
                <span className="stat-label">Total Borrows Accumulated</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{reports.summary.unique_borrowers}</span>
                <span className="stat-label">Unique Active Users</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{reports.summary.active_borrowers}</span>
                <span className="stat-label">Active Borrowers Now</span>
              </div>
              <div className="stat-card highlight">
                <span className="stat-number">{reports.summary.average_borrows_per_user}</span>
                <span className="stat-label">Average Borrows / User</span>
              </div>
            </div>
          </section>

          <div className="admin-grid">
            <section className="panel" style={{ flex: 1.2 }}>
              <h2>Most Borrowed Collection Books</h2>
              {reports.most_borrowed_books.length === 0 ? (
                <p className="muted" style={{ padding: '1rem 0' }}>No borrow data generated yet.</p>
              ) : (
                <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Book Title</th>
                        <th>Genre</th>
                        <th>Borrows</th>
                        <th>Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.most_borrowed_books.map((book) => (
                        <tr key={book.book_id}>
                          <td>
                            <strong>{book.title}</strong>
                            <div className="muted" style={{ fontSize: '0.8rem' }}>by {book.author}</div>
                          </td>
                          <td><span className="pill">{book.genre}</span></td>
                          <td><strong>{book.borrow_count}</strong></td>
                          <td>{book.active_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="panel" style={{ flex: 1 }}>
              <div className="panel-head">
                <h2>Active Overdue Register</h2>
                <span className="status danger" style={{ fontSize: '0.75rem' }}>{reports.summary.overdue_count} Overdue</span>
              </div>
              {reports.overdue_reports.length === 0 ? (
                <p className="muted" style={{ padding: '1rem 0' }}>No overdue loans currently active.</p>
              ) : (
                <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Member Details</th>
                        <th>Book Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.overdue_reports.map((loan) => (
                        <tr key={loan.id}>
                          <td>
                            <strong>{loan.user_name}</strong>
                            <div className="muted" style={{ fontSize: '0.75rem' }}>ID: {loan.student_id}</div>
                          </td>
                          <td>
                            {loan.book_title}
                            <div className="muted" style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Due: {formatDateTime(loan.due_date)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="panel" style={{ gridColumn: 'span 2' }}>
              <div className="panel-head">
                <h2>User Engagement Leaderboard</h2>
                <span className="pill" style={{ color: 'var(--accent-secondary)' }}>
                  {reports.user_statistics.student_users} students · {reports.user_statistics.staff_users} staff
                </span>
              </div>
              {reports.user_statistics.top_borrowers.length === 0 ? (
                <p className="muted" style={{ padding: '1.25rem 0' }}>No member telemetry in database.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Role</th>
                        <th>Lifetime Borrows</th>
                        <th>Currently Borrowed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.user_statistics.top_borrowers.map((user) => (
                        <tr key={user.user_id}>
                          <td>
                            <strong>{user.name}</strong>
                            <div className="muted" style={{ fontSize: '0.8rem' }}>{user.email}</div>
                          </td>
                          <td>
                            <span className={`status ${user.role === 'admin' ? 'warning' : ''}`}>
                              {user.role}
                            </span>
                          </td>
                          <td><strong>{user.borrow_count}</strong></td>
                          <td>{user.active_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

