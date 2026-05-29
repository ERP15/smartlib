import React, { useEffect, useState } from 'react';
import { getBooks, borrowBook } from '../services/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Catalog() {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState('');
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
      await borrowBook(bookId);
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
          <p className="subhead">Search by title, author, genre, or ISBN.</p>
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
              {book.image && (
                <img
                  className="book-cover"
                  src={book.image.startsWith('/') ? `${API_BASE_URL}${book.image}` : book.image}
                  alt={book.title}
                />
              )}
              <div className="book-card-top">
                <span className="pill">{book.genre}</span>
                <span className={`status ${book.available_quantity < 1 ? 'danger' : ''}`}>
                  {book.available_quantity > 0 ? `${book.available_quantity} available` : 'Unavailable'}
                </span>
              </div>
              <h3>{book.title}</h3>
              <p className="book-meta">{book.author}</p>
              {book.isbn && <p className="book-meta">ISBN {book.isbn}</p>}
              {book.description && <p className="book-desc">{book.description}</p>}
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
