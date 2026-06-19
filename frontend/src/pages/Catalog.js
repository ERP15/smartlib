import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { borrowBook, getBooks, getRecommendations, API_BASE_URL } from '../services/api';
import { getUser } from '../utils/auth';
const DEFAULT_BORROW_DAYS = 14;
const FEATURED_GENRES = ['All', 'Fiction', 'Technical', 'Romance', 'History', 'Dystopian', 'Reference'];

function getLocalISOString(date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 19);
}

function resolveImageUrl(image) {
  if (!image) return null;
  return image.startsWith('/') ? `${API_BASE_URL}${image}` : image;
}

function normalizeBook(entry) {
  return entry?.book || entry;
}

// Normalize text to match backend implementation (remove accents/diacritics)
function normalizeText(text) {
  if (!text) return '';
  // Use NFD (same as backend's NFKD for most Latin characters)
  // This removes accents and special characters
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function Catalog() {
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const [books, setBooks] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [borrowModal, setBorrowModal] = useState(null);
  const [showRolePicker, setShowRolePicker] = useState(false);

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
    if (user) {
      loadRecommendations();
    } else {
      setRecommendationLoading(false);
    }
  }, []);

  // Auto-refresh recommendations and books when page becomes visible
  // This ensures newly added books by admin appear on student's catalog
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadBooks(query.trim());
        if (user) {
          loadRecommendations();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, query]);

  // Lock background page scroll when modal is active
  useEffect(() => {
    if (borrowModal || showRolePicker) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [borrowModal, showRolePicker]);

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
    const defaultDueDate = new Date(Date.now() + DEFAULT_BORROW_DAYS * 24 * 60 * 60 * 1000);
    setBorrowModal({
      book,
      dueDate: getLocalISOString(defaultDueDate),
    });
  };

  const closeBorrowModal = () => setBorrowModal(null);

  const handleBorrow = async () => {
    if (!borrowModal) return;

    setMessage(null);
    setError(null);
    try {
      await borrowBook(borrowModal.book.id, null, null, borrowModal.dueDate);
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
      result = result.filter(book => {
        const genreStr = (book.genre || '').toLowerCase();
        const filterStr = selectedGenre.toLowerCase();
        if (filterStr === 'history') {
          return genreStr.includes('history') || genreStr.includes('historical');
        }
        return genreStr.includes(filterStr);
      });
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
          {!user ? (
            <button
              type="button"
              className="btn btn-primary btn-block book-borrow-btn"
              onClick={() => setShowRolePicker(true)}
              style={{ background: 'var(--accent-secondary)' }}
            >
              Login/Register to borrow
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-block book-borrow-btn"
              onClick={() => openBorrowModal(book)}
              disabled={book.available_quantity < 1}
            >
              Borrow
            </button>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="page catalog-page fade-in">
      {/* Hero Section */}
      <section className="catalog-hero surface-card" style={{
        background: 'linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.65)), url("/library_hero_bg.png") center/100% 100% no-repeat',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        height: '500px',
        padding: '1.25rem 1.5rem',
        borderRadius: '16px',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        <div style={{ maxWidth: '850px', marginBottom: '0.75rem', flex: 'none' }}>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 5.5vw, 3.2rem)', 
            fontWeight: '900', 
            color: '#fff', 
            marginBottom: '0.3rem', 
            fontFamily: 'Outfit, sans-serif',
            lineHeight: '1.2'
          }}>
            PUP Library Management System
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', color: 'rgba(255,255,255,0.9)', margin: 0 }}>
            Discover the Best Books Around
          </p>
        </div>
        <form className="search-bar catalog-search" onSubmit={handleSearch} style={{ maxWidth: '380px', width: '100%', margin: '0 auto', flex: 'none' }}>
          <input
            className="input"
            style={{ 
              borderRadius: '99px', 
              padding: '0.5rem 1.25rem', 
              background: '#fff', 
              color: 'var(--text)', 
              border: 'none',
              fontSize: '0.85rem',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
            placeholder="search book by title..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>
      </section>

      {error && <div className="alert">{error}</div>}
      {message && <div className="success">{message}</div>}

      {/* Interactive AI Book Recommendation Panel */}
      {user && (
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
                  <button type="button" className="btn btn-ghost" onClick={handleResetAI} disabled={aiLoading || recommendationLoading}>
                    Reset AI Filters
                  </button>
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
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {/* Matches Section */}
                    {(aiAuthor.trim() !== '' || aiGenre.trim() !== '') && (() => {
                      const filterAuthorNorm = normalizeText(aiAuthor);
                      const filterGenreNorm = normalizeText(aiGenre);

                      const isAuthorMatch = (b) => {
                        if (!filterAuthorNorm) return false;
                        const bookAuthorNorm = normalizeText(b.author);
                        return bookAuthorNorm.includes(filterAuthorNorm) || filterAuthorNorm.includes(bookAuthorNorm);
                      };

                      const isGenreMatch = (b) => {
                        if (!filterGenreNorm) return false;
                        const bookGenreNorm = normalizeText(b.genre);
                        if (filterGenreNorm === 'history' && bookGenreNorm.includes('historical')) return true;
                        if (filterGenreNorm === 'historical' && bookGenreNorm.includes('history')) return true;
                        return bookGenreNorm.includes(filterGenreNorm) || filterGenreNorm.includes(bookGenreNorm);
                      };

                      const isBookMatch = (b) => {
                        if (filterAuthorNorm && filterGenreNorm) {
                          return isAuthorMatch(b) || isGenreMatch(b);
                        }
                        if (filterAuthorNorm) return isAuthorMatch(b);
                        if (filterGenreNorm) return isGenreMatch(b);
                        return false;
                      };

                      const matches = recommendations.filter(rec => isBookMatch(normalizeBook(rec)));

                      let heading = '✓ Matches';
                      if (aiAuthor.trim() !== '' && aiGenre.trim() === '') heading = '✓ Author Matches';
                      if (aiAuthor.trim() === '' && aiGenre.trim() !== '') heading = '✓ Genre Matches';

                      let noMatchesMsg = 'No books found matching your criteria.';
                      if (aiAuthor.trim() !== '' && aiGenre.trim() === '') noMatchesMsg = 'No books found by this author.';
                      if (aiAuthor.trim() === '' && aiGenre.trim() !== '') noMatchesMsg = 'No books found in this genre.';

                      return (
                        <div>
                          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {heading}
                          </h4>
                          {matches.length === 0 ? (
                            <p className="muted" style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}>{noMatchesMsg}</p>
                          ) : (
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                              {matches.map(rec => {
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
                                      <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)' }} className="book-title">{b.title}</h4>
                                      <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 'bold' }}>100% Match</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Related Books Section */}
                    <div>
                      <h4 style={{ margin: '0.5rem 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        📚 Related Books You May Like
                      </h4>
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {recommendations
                          .filter(rec => {
                            if (aiAuthor.trim() === '' && aiGenre.trim() === '') return true;
                            const b = normalizeBook(rec);
                            const filterAuthorNorm = normalizeText(aiAuthor);
                            const filterGenreNorm = normalizeText(aiGenre);

                            const isAuthorMatch = () => {
                              if (!filterAuthorNorm) return false;
                              const bookAuthorNorm = normalizeText(b.author);
                              return bookAuthorNorm.includes(filterAuthorNorm) || filterAuthorNorm.includes(bookAuthorNorm);
                            };

                            const isGenreMatch = () => {
                              if (!filterGenreNorm) return false;
                              const bookGenreNorm = normalizeText(b.genre);
                              if (filterGenreNorm === 'history' && bookGenreNorm.includes('historical')) return true;
                              if (filterGenreNorm === 'historical' && bookGenreNorm.includes('history')) return true;
                              return bookGenreNorm.includes(filterGenreNorm) || filterGenreNorm.includes(bookGenreNorm);
                            };

                            const isBookMatch = () => {
                              if (filterAuthorNorm && filterGenreNorm) {
                                return isAuthorMatch() || isGenreMatch();
                              }
                              if (filterAuthorNorm) return isAuthorMatch();
                              if (filterGenreNorm) return isGenreMatch();
                              return false;
                            };

                            return !isBookMatch();
                          })
                          .slice(0, 3)
                          .map(rec => {
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
                                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)' }} className="book-title">{b.title}</h4>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
              <span style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: '500' }}>Available only</span>
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
            <h2>{selectedGenre === 'All' ? 'All Books' : `${selectedGenre} Books`}</h2>
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
      {borrowModal && createPortal(
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
                <p className="book-author" style={{ fontSize: '1rem', color: 'var(--accent)', fontWeight: 'bold', marginBottom: '0.35rem' }}>{borrowModal.book.author}</p>
                <p className="book-description">{borrowModal.book.description || 'Borrow details and duration settings.'}</p>
              </div>
            </div>
            <div className="form-row modal-form-row" style={{ gridTemplateColumns: '1fr' }}>
              <label className="field">
                <span>Select Due Date & Time</span>
                <input
                  type="datetime-local"
                  step="1"
                  className="input"
                  value={borrowModal.dueDate}
                  onChange={(event) => setBorrowModal({ ...borrowModal, dueDate: event.target.value })}
                  required
                />
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
        </div>,
        document.body
      )}

      {/* Role Picker Modal Overlay for Guests */}
      {showRolePicker && createPortal(
        <div className="role-modal" role="dialog" aria-modal="true" aria-labelledby="role-picker-title">
          <div className="role-modal-card">
            <p className="eyebrow">Choose access</p>
            <h2 id="role-picker-title">Are you a student or admin?</h2>
            <p className="subhead">Students can log in or register. Admins can go straight to the staff login.</p>
            <div className="role-actions">
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => {
                  setShowRolePicker(false);
                  navigate('/login?role=student');
                }}
              >
                Student Login
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => {
                  setShowRolePicker(false);
                  navigate('/login?role=admin');
                }}
              >
                Admin Login
              </button>
              <button type="button" className="role-close" onClick={() => setShowRolePicker(false)}>
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

