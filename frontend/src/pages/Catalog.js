import React, { useEffect, useMemo, useState } from 'react';
import { borrowBook, getBooks, getRecommendations } from '../services/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const DEFAULT_BORROW_DAYS = 14;
const FEATURED_GENRES = ['All', 'Fiction', 'Technical', 'Romance', 'History', 'Dystopian', 'Reference'];

function resolveImageUrl(image) {
  if (!image) return null;
  return image.startsWith('/') ? `${API_BASE_URL}${image}` : image;
}

function normalizeBook(entry) {
  return entry?.book || entry;
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

  // Advanced Filters & Sort State
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState('title-asc');

  // AI Interactive State
  const [aiGenre, setAiGenre] = useState('');
  const [aiAuthor, setAiAuthor] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

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

  const loadRecommendations = async (filters = {}) => {
    setRecommendationLoading(true);
    try {
      const res = await getRecommendations({ limit: 6, ...filters });
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

  // Handle dynamic AI generation
  const handleAskAI = async (e) => {
    e.preventDefault();
    setAiLoading(true);
    setError(null);
    setMessage(null);
    try {
      const filters = {};
      if (aiGenre.trim()) filters.genre = aiGenre.trim();
      if (aiAuthor.trim()) filters.author = aiAuthor.trim();
      
      await loadRecommendations(filters);
      setMessage('SmartLib AI has generated fresh recommendations for you.');
    } catch (err) {
      setError('Failed to compute recommendations');
    } finally {
      setAiLoading(false);
    }
  };

  const handleResetAI = async () => {
    setAiGenre('');
    setAiAuthor('');
    await loadRecommendations();
  };

  const featuredBook = useMemo(() => {
    const recommended = recommendations.map(normalizeBook).find(Boolean);
    return recommended || books[0] || null;
  }, [books, recommendations]);

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

  // Clientside Filtering and Sorting for high performance
  const filteredAndSortedBooks = useMemo(() => {
    let result = [...books];

    // 1. Genre filter
    if (selectedGenre !== 'All') {
      result = result.filter(book => (book.genre || '').toLowerCase() === selectedGenre.toLowerCase());
    }

    // 2. Availability filter
    if (onlyAvailable) {
      result = result.filter(book => book.available_quantity > 0);
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'title-desc') {
        return b.title.localeCompare(a.title);
      } else if (sortBy === 'copies-desc') {
        return b.available_quantity - a.available_quantity;
      }
      return 0;
    });

    return result;
  }, [books, selectedGenre, onlyAvailable, sortBy]);

  // AI confidence match score mapper
  const getMatchScore = (score) => {
    if (score >= 15) return '98% Match';
    if (score >= 10) return '92% Match';
    if (score >= 5) return '85% Match';
    return 'AI Recommended';
  };

  const renderBookCard = (book, extraLabel = null, extraReasons = []) => {
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
          {extraLabel && (
            <span 
              className="status" 
              style={{ 
                position: 'absolute', 
                top: '0.75rem', 
                left: '0.75rem',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                color: '#fff',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
            >
              {extraLabel}
            </span>
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
          {extraReasons.length > 0 && (
            <div className="book-note">
              {extraReasons.slice(0, 2).map((reason, idx) => (
                <div key={idx} style={{ margin: '0.2rem 0' }}>• {reason}</div>
              ))}
            </div>
          )}
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

  return (
    <div className="page catalog-page fade-in">
      {/* Hero Section */}
      <section className="catalog-hero surface-card">
        <div>
          <p className="eyebrow">SmartLib Catalog</p>
          <h1>Browse academic catalog with AI assistance.</h1>
          <p className="subhead">
            Search titles, configure search discovery filters, and borrow books through our highly interactive smart interface.
          </p>
        </div>
        <form className="search-bar catalog-search" onSubmit={handleSearch}>
          <input
            className="input"
            placeholder="Search catalog by title, author, or keyword..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </section>

      {error && <div className="alert">{error}</div>}
      {message && <div className="success">{message}</div>}

      {/* Interactive AI Book Recommendation Panel */}
      <section className="panel" style={{ border: '1px dashed var(--accent)', background: 'rgba(99, 102, 241, 0.03)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'center' }} className="form-row">
          <div>
            <p className="eyebrow" style={{ color: 'var(--accent-secondary)' }}>✨ Interactive AI Recommender</p>
            <h2 style={{ marginTop: '0.25rem' }}>Ask SmartLib AI</h2>
            <p className="subhead" style={{ marginBottom: '1.25rem' }}>
              Specify genre or author preferences to recalculate personalized matching suggestions.
            </p>
            <form onSubmit={handleAskAI} className="form">
              <div className="form-row">
                <label className="field">
                  <span>Preferred Genre</span>
                  <input 
                    className="input" 
                    placeholder="e.g. Fiction, Technical..." 
                    value={aiGenre} 
                    onChange={(e) => setAiGenre(e.target.value)} 
                  />
                </label>
                <label className="field">
                  <span>Preferred Author</span>
                  <input 
                    className="input" 
                    placeholder="e.g. Orwell, Asimov..." 
                    value={aiAuthor} 
                    onChange={(e) => setAiAuthor(e.target.value)} 
                  />
                </label>
              </div>
              <div className="hero-actions" style={{ justifyContent: 'flex-start' }}>
                <button type="submit" className="btn btn-primary" disabled={aiLoading || recommendationLoading}>
                  {aiLoading ? 'AI Thinking...' : 'Compute Matches'}
                </button>
                {(aiGenre || aiAuthor) && (
                  <button type="button" className="btn btn-ghost" onClick={handleResetAI} disabled={aiLoading}>
                    Reset AI Filters
                  </button>
                )}
              </div>
            </form>
          </div>
          <div>
            <p className="eyebrow">AI Recommendation Output</p>
            <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '0.5rem', marginTop: '0.5rem' }}>
              {recommendationLoading || aiLoading ? (
                <div style={{ padding: '2rem 0', textAlign: 'center' }}>
                  <p className="muted">Computing AI relationships...</p>
                </div>
              ) : recommendations.length === 0 ? (
                <p className="muted" style={{ padding: '1rem 0' }}>No personalized recommendations found. Try adjusting parameters or borrow books to build history.</p>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {recommendations.slice(0, 3).map((rec) => {
                    const b = normalizeBook(rec);
                    return (
                      <div 
                        key={b.id} 
                        onClick={() => openBorrowModal(b)}
                        style={{ 
                          display: 'flex', 
                          gap: '1rem', 
                          alignItems: 'center', 
                          padding: '0.75rem', 
                          borderRadius: '12px', 
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'background 0.2s, border-color 0.2s'
                        }}
                        className="aside-list-item"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.06)';
                          e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                          e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                      >
                        {resolveImageUrl(b.image) ? (
                          <img src={resolveImageUrl(b.image)} alt={b.title} style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '6px' }} />
                        ) : (
                          <div style={{ width: '40px', height: '56px', display: 'grid', placeItems: 'center', background: 'var(--surface-3)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>{b.title.slice(0, 1)}</div>
                        )}
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }} className="book-title">{b.title}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 'bold' }}>{getMatchScore(rec.score)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Book Spotlight */}
      {featuredBook && (
        <section className="catalog-feature panel">
          <div className="catalog-feature-copy">
            <p className="eyebrow">Spotlight</p>
            <h2>{featuredBook.title}</h2>
            <p className="subhead">{featuredBook.author}</p>
            <p className="book-description">{featuredBook.description || 'Highlighted title from the SmartLib collection.'}</p>
            <div className="hero-actions" style={{ justifyContent: 'flex-start' }}>
              <button type="button" className="btn btn-primary" onClick={() => openBorrowModal(featuredBook)} disabled={featuredBook.available_quantity < 1}>
                Borrow featured
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

      {/* Advanced Discovery Filters & Sorting Controls */}
      <section className="panel" style={{ padding: '1.25rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          {/* Genre Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {FEATURED_GENRES.map((g) => (
              <button
                key={g}
                type="button"
                className={`tab ${selectedGenre === g ? 'active' : ''}`}
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                onClick={() => setSelectedGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Toggle and Sort */}
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                style={{ accentColor: 'var(--accent)' }}
              />
              <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '500' }}>Available only</span>
            </label>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Sort by</span>
              <select
                className="input"
                style={{ padding: '0.45rem 2rem 0.45rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem', width: 'auto' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="title-asc">Title: A-Z</option>
                <option value="title-desc">Title: Z-A</option>
                <option value="copies-desc">Copies available</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Grid */}
      <section className="catalog-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Collection Grid</p>
            <h2>{selectedGenre === 'All' ? 'Complete Catalog' : `${selectedGenre} Books`}</h2>
          </div>
          <span className="muted">{filteredAndSortedBooks.length} items found</span>
        </div>

        {loading ? (
          <div className="panel" style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p className="muted">Loading books from smart database...</p>
          </div>
        ) : filteredAndSortedBooks.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p className="muted">No books match your selected search query or filters.</p>
          </div>
        ) : (
          <div className="book-grid">
            {filteredAndSortedBooks.map((book) => {
              // Check if this book is in the recommendations list
              const recommendationEntry = recommendations.find(r => normalizeBook(r).id === book.id);
              const label = recommendationEntry ? getMatchScore(recommendationEntry.score) : null;
              const reasons = recommendationEntry ? recommendationEntry.reasons : [];
              return renderBookCard(book, label, reasons);
            })}
          </div>
        )}
      </section>

      {/* Borrow Duration Modal Overlay */}
      {borrowModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="borrow-title">
          <div className="modal-card">
            <button type="button" className="modal-close" onClick={closeBorrowModal} aria-label="Close borrow dialog">
              ×
            </button>
            <p className="eyebrow">Borrow request</p>
            <h2 id="borrow-title">{borrowModal.book.title}</h2>
            <p className="subhead">Choose borrow details prior to confirming.</p>
            <div className="modal-book">
              {resolveImageUrl(borrowModal.book.image) ? (
                <img src={resolveImageUrl(borrowModal.book.image)} alt={borrowModal.book.title} />
              ) : (
                <div className="modal-book-placeholder">{borrowModal.book.title.slice(0, 1).toUpperCase()}</div>
              )}
              <div>
                <p className="book-author" style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold' }}>{borrowModal.book.author}</p>
                <p className="book-description">{borrowModal.book.description || 'Borrow details and duration settings.'}</p>
              </div>
            </div>
            <div className="form-row modal-form-row">
              <label className="field">
                <span>Borrow for</span>
                <input
                  type="number"
                  min="1"
                  max="360"
                  className="input"
                  value={borrowModal.amount}
                  onChange={(event) => setBorrowModal({ ...borrowModal, amount: Number(event.target.value) })}
                />
              </label>
              <label className="field">
                <span>Duration Unit</span>
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
            <div className="hero-actions" style={{ marginTop: '1.5rem' }}>
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

