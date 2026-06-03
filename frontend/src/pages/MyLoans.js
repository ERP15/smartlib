import React, { useEffect, useState } from 'react';
import { getMyBorrows, requestReturnBook } from '../services/api';

function statusClass(status) {
  if (status === 'overdue') return 'danger';
  if (status === 'returned') return '';
  if (status === 'pending_return') return 'warning';
  return 'warning';
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

export default function MyLoans() {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyBorrows();
      setBorrows(res.data.borrows || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load borrow history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleReturn = async (id) => {
    setMessage(null);
    setError(null);
    try {
      const res = await requestReturnBook(id);
      setMessage(res.data.message || 'Return request submitted. Admin will confirm when the book is received.');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit return request');
    }
  };

  const active = borrows.filter((b) => b.status !== 'returned');
  const history = borrows.filter((b) => b.status === 'returned');

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Your account</p>
          <h1>Borrowed</h1>
          <p className="subhead">Track active loans, due dates, and past returns in one place.</p>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}
      {message && <div className="success">{message}</div>}

      {loading ? (
        <p className="muted">Loading...</p>
      ) : (
        <>
          <section className="panel">
            <h2>Active loans ({active.length})</h2>
            {active.length === 0 ? (
              <p className="muted">No active loans.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Due date</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.book_title}</strong>
                        <br />
                        <span className="book-meta">{b.book_author}</span>
                      </td>
                      <td>{formatDateTime(b.due_date)}</td>
                      <td>
                        <span className={`status ${statusClass(b.status)}`}>{b.status}</span>
                        {b.status === 'pending_return' && b.return_request_date && (
                          <div className="muted" style={{ marginTop: '0.5rem' }}>
                            Requested: {formatDateTime(b.return_request_date)}
                          </div>
                        )}
                      </td>
                      <td>
                        {b.status === 'pending_return' ? (
                          <span className="muted">Pending admin confirmation</span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-small"
                            onClick={() => handleReturn(b.id)}
                          >
                            Request Return
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="panel">
            <h2>Borrow history ({history.length})</h2>
            {history.length === 0 ? (
              <p className="muted">No returned books yet.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Borrowed</th>
                    <th>Returned</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.book_title}</strong>
                        <br />
                        <span className="book-meta">{b.book_author}</span>
                      </td>
                      <td>{formatDateTime(b.borrow_date)}</td>
                      <td>{formatDateTime(b.actual_return_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
