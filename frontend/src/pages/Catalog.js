import React, { useEffect, useMemo, useState } from 'react';
import { borrowBook, getBooks, getRecommendations } from '../services/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const DEFAULT_BORROW_DAYS = 14;
const FEATURED_GENRES = ['Fiction', 'Technical', 'Romance', 'History', 'Dystopian', 'Reference'];

function resolveImageUrl(image) {
  if (!image) return null;
  return image.startsWith('/') ? `${API_BASE_URL}${image}` : image;
}

function normalizeBook(entry) {
  return entry?.book || entry;
}

function groupBooksByGenre(books) {
  const groups = new Map();

  books.forEach((book) => {
    const genre = book.genre || 'Other';
    if (!groups.has(genre)) {
      groups.set(genre, []);
    }
    groups.get(genre).push(book);
  });

  const orderedGenres = [
    ...FEATURED_GENRES.filter((genre) => groups.has(genre)),
    ...Array.from(groups.keys())
      .filter((genre) => !FEATURED_GENRES.includes(genre))
      .sort((a, b) => a.localeCompare(b)),
  ];

  return orderedGenres.map((genre) => ({
    genre,
    books: groups.get(genre) || [],
  }));
}

export default function Catalog() {
  const [books, setBooks] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [borrowModal, setBorrowModal] = useState(null);

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

  const loadRecommendations = async () => {
    setRecommendationLoading(true);
    try {
      const res = await getRecommendations({ limit: 6 });
      setRecommendations(res.data.recommendations || []);
    } catch {
      setRecommendations([]);
    } finally {
      setRecommendationLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
    loadRecommendations();
  }, []);

  const featuredBook = useMemo(() => {
    const recommended = recommendations.map(normalizeBook).find(Boolean);
    return recommended || books[0] || null;
  }, [books, recommendations]);

  const genreGroups = useMemo(() => groupBooksByGenre(books), [books]);

  const handleSearch = (event) => {
    event.preventDefault();
    loadBooks(query.trim());
  };

  const openBorrowModal = (book) => {
    setBorrowModal({
      book,
      amount: DEFAULT_BORROW_DAYS,
      unit: 'days',
    });
  };

  const closeBorrowModal = () => setBorrowModal(null);

  const handleBorrow = async () => {
    if (!borrowModal) return;

    setMessage(null);
    setError(null);
    try {
      await borrowBook(borrowModal.book.id, borrowModal.amount, borrowModal.unit);
      setMessage('Borrow request submitted successfully.');
      closeBorrowModal();
      loadBooks(query.trim());
    } catch (err) {
      setError(err.response?.data?.error || 'Could not borrow book');
    }
  };

  const renderBookCard = (book, reasons = []) => {
    const image = resolveImageUrl(book.image);
    return (
      <article key={book.id} className="book-card">
        <div className="book-media">
          {image ? (
            <img src={image} alt={book.title} className="book-cover" />
          ) : (
            <div className="book-cover book-cover-placeholder">
              <span>{book.title.slice(0, 1).toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="book-card-body">
          <div className="book-card-head">
            <span className="pill">{book.genre || 'General'}</span>
            <span className={`status ${book.available_quantity < 1 ? 'danger' : ''}`}>
              {book.available_quantity > 0 ? `${book.available_quantity} available` : 'Unavailable'}
            </span>
          </div>
          <h3 className="book-title">{book.title}</h3>
          <p className="book-author">{book.author}</p>
          {reasons.length > 0 && <p className="book-description book-note">{reasons.join(' · ')}</p>}
          {book.description && <p className="book-description">{book.description}</p>}
          <button
            type="button"
            className="btn btn-primary btn-block book-borrow-btn"
            onClick={() => openBorrowModal(book)}
            disabled={book.available_quantity < 1}
          >
            Borrow
          </button>
        </div>
      </article>
    );
  };

  const sections = [
    ...(!recommendationLoading && recommendations.length > 0
      ? [{ title: 'Recommended for you', books: recommendations.map((entry) => normalizeBook(entry)) }]
      : []),
    ...genreGroups.map((group) => ({ title: group.genre, books: group.books })),
  ];

  return (
    <div className="page catalog-page fade-in">
      <section className="catalog-hero surface-card">
        <div>
          <p className="eyebrow">SmartLib Catalog</p>
          <h1>Browse the library with clarity and structure.</h1>
          <p className="subhead">
            Search titles, explore categories, and borrow from a clean grid-based catalog designed for students and schools.
          </p>
        </div>
        <form className="search-bar catalog-search" onSubmit={handleSearch}>
          <input
            className="input"
            placeholder="Search by title, author, or genre"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </section>

      {error && <div className="alert">{error}</div>}
      {message && <div className="success">{message}</div>}

      {featuredBook && (
        <section className="catalog-feature panel">
          <div className="catalog-feature-copy">
            <p className="eyebrow">Featured</p>
            <h2>{featuredBook.title}</h2>
            <p className="subhead">{featuredBook.author}</p>
            <p className="book-description">{featuredBook.description || 'Highlighted title from the SmartLib collection.'}</p>
            <div className="hero-actions">
              <button type="button" className="btn btn-primary" onClick={() => openBorrowModal(featuredBook)}>
                Borrow featured
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => loadBooks('')}>
                Reset search
              </button>
            </div>
          </div>
          <div className="catalog-feature-cover">
            {resolveImageUrl(featuredBook.image) ? (
              <img src={resolveImageUrl(featuredBook.image)} alt={featuredBook.title} className="featured-image" />
            ) : (
              <div className="featured-image featured-placeholder">{featuredBook.title.slice(0, 1).toUpperCase()}</div>
            )}
          </div>
        </section>
      )}

      {loading ? (
        <section className="panel">
          <p className="muted">Loading books...</p>
        </section>
      ) : sections.length === 0 ? (
        <section className="panel">
          <p className="muted">No books found. Try a different search.</p>
        </section>
      ) : (
        sections.map((section) => (
          <section key={section.title} className="catalog-section">
            <div className="section-head">
              <div>
                <p className="eyebrow">Collection</p>
                <h2>{section.title}</h2>
              </div>
              <span className="muted">{section.books.length} titles</span>
            </div>
            <div className="book-grid">
              {section.books.map((book) => renderBookCard(book))}
            </div>
          </section>
        ))
      )}

      {borrowModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="borrow-title">
          <div className="modal-card">
            <button type="button" className="modal-close" onClick={closeBorrowModal} aria-label="Close borrow dialog">
              ×
            </button>
            <p className="eyebrow">Borrow book</p>
            <h2 id="borrow-title">{borrowModal.book.title}</h2>
            <p className="subhead">Choose a borrowing duration before confirming.</p>
            <div className="modal-book">
              {resolveImageUrl(borrowModal.book.image) ? (
                <img src={resolveImageUrl(borrowModal.book.image)} alt={borrowModal.book.title} />
              ) : (
                <div className="modal-book-placeholder">{borrowModal.book.title.slice(0, 1).toUpperCase()}</div>
              )}
              <div>
                <p className="book-author">{borrowModal.book.author}</p>
                <p className="book-description">{borrowModal.book.description || 'Borrow details and duration settings.'}</p>
              </div>
            </div>
            <div className="form-row modal-form-row">
              <label className="field">
                <span>Borrow for</span>
                <input
                  type="number"
                  min="1"
                  max="720"
                  className="input"
                  value={borrowModal.amount}
                  onChange={(event) => setBorrowModal({ ...borrowModal, amount: Number(event.target.value) })}
                />
              </label>
              <label className="field">
                <span>Unit</span>
                <select
                  className="input"
                  value={borrowModal.unit}
                  onChange={(event) => setBorrowModal({ ...borrowModal, unit: event.target.value })}
                >
                  <option value="days">Days</option>
                  <option value="hours">Hours</option>
                </select>
              </label>
            </div>
            <div className="hero-actions">
              <button type="button" className="btn btn-primary" onClick={handleBorrow}>
                Confirm borrow
              </button>
              <button type="button" className="btn btn-ghost" onClick={closeBorrowModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
