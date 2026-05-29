import React, { useEffect, useState } from 'react';
import { getBooks, borrowBook } from '../services/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const DEFAULT_BORROW_DAYS = 14;

function resolveImageUrl(image) {
  if (!image) return null;
  return image.startsWith('/') ? `${API_BASE_URL}${image}` : image;
}

export default function Catalog() {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState('');
  const [borrowPrefs, setBorrowPrefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const loadBooks = async (q = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBooks(q);
      setBooks(res.data.books || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadBooks(query.trim());
  };

  const handleBorrow = async (bookId) => {
    setMessage(null);
    setError(null);
    try {
      const selection = borrowPrefs[bookId] || { amount: DEFAULT_BORROW_DAYS, unit: 'days' };
      await borrowBook(bookId, selection.amount, selection.unit);
      setMessage('Book borrowed successfully!');
      loadBooks(query.trim());
    } catch (err) {
      setError(err.response?.data?.error || 'Could not borrow book');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Books</p>
          <h1>Browse Books</h1>
          <p className="subhead">Search by title, author, or genre.</p>
        </div>
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            className="input"
            placeholder="Search books..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      {error && <div className="alert">{error}</div>}
      {message && <div className="success">{message}</div>}

      {loading ? (
        <p className="muted">Loading books...</p>
      ) : books.length === 0 ? (
        <p className="muted">No books found.</p>
      ) : (
        <div className="book-grid">
          {books.map((book) => (
            <article key={book.id} className="book-card">
              {resolveImageUrl(book.image) ? (
                <img
                  className="book-cover"
                  src={resolveImageUrl(book.image)}
                  alt={book.title}
                />
              ) : (
                <div className="book-cover book-cover-placeholder">
                  <span>{book.title.slice(0, 1).toUpperCase()}</span>
                </div>
              )}
              <div className="book-card-top">
                <span className="pill">{book.genre}</span>
                <span className={`status ${book.available_quantity < 1 ? 'danger' : ''}`}>
                  {book.available_quantity > 0 ? `${book.available_quantity} available` : 'Unavailable'}
                </span>
              </div>
              <h3>{book.title}</h3>
              <p className="book-meta">{book.author}</p>
              {book.description && <p className="book-desc">{book.description}</p>}
              <div className="borrow-controls">
                <label className="field field-inline">
                  <span>Borrow for</span>
                  <input
                    type="number"
                    min="1"
                    max="720"
                    className="input"
                    value={(borrowPrefs[book.id]?.amount) || DEFAULT_BORROW_DAYS}
                    onChange={(e) => setBorrowPrefs({
                      ...borrowPrefs,
                      [book.id]: {
                        amount: Number(e.target.value),
                        unit: borrowPrefs[book.id]?.unit || 'days',
                      },
                    })}
                  />
                </label>
                <label className="field field-inline">
                  <span>&nbsp;</span>
                  <select
                    className="input"
                    value={borrowPrefs[book.id]?.unit || 'days'}
                    onChange={(e) => setBorrowPrefs({
                      ...borrowPrefs,
                      [book.id]: {
                        amount: borrowPrefs[book.id]?.amount || DEFAULT_BORROW_DAYS,
                        unit: e.target.value,
                      },
                    })}
                  >
                    <option value="days">days</option>
                    <option value="hours">hours</option>
                  </select>
                </label>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-block"
                disabled={book.available_quantity < 1}
                onClick={() => handleBorrow(book.id)}
              >
                Borrow
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
