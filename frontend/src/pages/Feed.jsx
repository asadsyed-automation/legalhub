import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { feedApi } from '../api/feed.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ScalesIcon,
  SearchIcon,
  FilterIcon,
  LocationIcon,
  ChatIcon,
  ArrowRightIcon,
  CheckIcon,
} from '../components/Icons';
import EmptyState from '../components/EmptyState';
import { CITIES, PRACTICE_AREAS, ROLES } from '../constants';
import './Feed.css';

export const Feed = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter state from URL
  const currentSearch = searchParams.get('q') || '';
  const currentPracticeArea = searchParams.get('practiceArea') || '';
  const currentCity = searchParams.get('city') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Component state
  const [questions, setQuestions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState(currentSearch);

  // Modal State for Asking a Question
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    description: '',
    practiceArea: PRACTICE_AREAS[0] || 'Civil',
    city: CITIES[0] || 'Multan',
  });

  // Sync keyword input with URL
  useEffect(() => {
    setSearchKeyword(currentSearch);
  }, [currentSearch]);

  // Fetch Questions
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        q: currentSearch || undefined,
        practiceArea: currentPracticeArea || undefined,
        city: currentCity || undefined,
        status: currentStatus || undefined,
      };

      const res = await feedApi.getQuestions(params);
      const items = res?.items || res?.questions || res?.data?.items || [];
      setQuestions(items);
      setPagination({
        total: res?.total ?? items.length,
        page: res?.page ?? currentPage,
        totalPages: res?.totalPages ?? 1,
        limit: res?.limit ?? 10,
      });
    } catch (err) {
      showToast(err.message || 'Failed to load community legal feed', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentSearch, currentPracticeArea, currentCity, currentStatus, showToast]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Update query params helper
  const updateFilters = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        updated.set(key, val);
      } else {
        updated.delete(key);
      }
    });
    // Reset to page 1 on filter changes unless changing page
    if (!('page' in newParams)) {
      updated.set('page', '1');
    }
    setSearchParams(updated);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ q: searchKeyword.trim() });
  };

  // Open Ask Question Handler
  const handleOpenAskModal = () => {
    if (!user) {
      showToast('Please sign in as a citizen to ask a legal question', 'info');
      navigate('/login?redirect=/feed');
      return;
    }
    if (user.role === ROLES.LAWYER || user.role === ROLES.LAW_FIRM) {
      showToast('Advocates and Law Firms can provide legal opinions on open questions below', 'info');
      return;
    }
    setIsModalOpen(true);
  };

  // Submit Question Handler
  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.title.trim() || newQuestion.title.trim().length < 5) {
      showToast('Please enter a descriptive question title (min 5 characters)', 'warning');
      return;
    }
    if (!newQuestion.description.trim() || newQuestion.description.trim().length < 15) {
      showToast('Please provide context or details for the lawyers (min 15 characters)', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await feedApi.createQuestion({
        title: newQuestion.title.trim(),
        content: newQuestion.description.trim(),
        practiceArea: newQuestion.practiceArea,
        city: newQuestion.city,
      });
      showToast('Legal enquiry posted successfully! Advocates will review it shortly.', 'success');
      setIsModalOpen(false);
      setNewQuestion({
        title: '',
        description: '',
        practiceArea: PRACTICE_AREAS[0] || 'Civil',
        city: CITIES[0] || 'Multan',
      });
      fetchQuestions();
    } catch (err) {
      showToast(err.message || 'Failed to submit enquiry', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feed-page">
      {/* Hero Banner */}
      <section className="feed-hero">
        <div className="feed-hero__container">
          <div className="feed-hero__badge">
            <ScalesIcon size={16} color="#f59e0b" />
            <span>Pro Bono Public Legal Aid & Advisory Feed</span>
          </div>
          <h1 className="feed-hero__title">
            Ask Legal Questions. <span className="feed-hero__title-accent">Get Verified Advocate Guidance.</span>
          </h1>
          <p className="feed-hero__subtitle">
            A public community platform where Pakistani citizens seek preliminary legal opinions from
            Admin-Reviewed advocates, explore precedents, and connect directly with counsel across all courts.
          </p>
          <div className="feed-hero__actions">
            <button
              type="button"
              className="feed-btn feed-btn--primary"
              onClick={handleOpenAskModal}
            >
              <ChatIcon size={18} />
              <span>Ask a Legal Question</span>
            </button>
            <Link to="/lawyers" className="feed-btn feed-btn--outline">
              <ScalesIcon size={18} />
              <span>Browse All Advocates</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="feed-content">
        {/* Search & Filter Toolbar */}
        <section className="feed-toolbar" aria-label="Feed Filters">
          <form onSubmit={handleSearchSubmit} className="feed-toolbar__search-row">
            <div className="feed-search-input">
              <span className="feed-search-input__icon">
                <SearchIcon size={18} />
              </span>
              <input
                type="search"
                placeholder="Search questions by legal topic, keyword, or statute..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>

            <div className="feed-select-group">
              <select
                className="feed-select"
                value={currentCity}
                onChange={(e) => updateFilters({ city: e.target.value })}
                aria-label="Filter by City"
              >
                <option value="">All Cities (Pakistan)</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                className="feed-select"
                value={currentStatus}
                onChange={(e) => updateFilters({ status: e.target.value })}
                aria-label="Filter by Status"
              >
                <option value="">All Statuses</option>
                <option value="open">Open for Answers</option>
                <option value="closed">Resolved & Closed</option>
              </select>
            </div>
          </form>

          {/* Practice Area Chips Bar */}
          <div className="feed-chips-bar" role="tablist" aria-label="Practice Area Quick Filter">
            <button
              type="button"
              className={`feed-chip ${!currentPracticeArea ? 'feed-chip--active' : ''}`}
              onClick={() => updateFilters({ practiceArea: '' })}
            >
              All Practice Areas
            </button>
            {PRACTICE_AREAS.map((pa) => (
              <button
                key={pa}
                type="button"
                className={`feed-chip ${currentPracticeArea === pa ? 'feed-chip--active' : ''}`}
                onClick={() => updateFilters({ practiceArea: pa })}
              >
                {pa}
              </button>
            ))}
          </div>
        </section>

        {/* Feed List Header */}
        <div className="feed-list-header">
          <h2 className="feed-list-title">
            <FilterIcon size={18} color="#d97706" />
            <span>Community Enquiries</span>
            <span className="feed-list-count">
              ({pagination.total} {pagination.total === 1 ? 'Question' : 'Questions'} Found)
            </span>
          </h2>
          {currentPracticeArea || currentCity || currentSearch || currentStatus ? (
            <button
              type="button"
              className="feed-chip"
              onClick={() => setSearchParams({})}
            >
              ✕ Clear All Filters
            </button>
          ) : null}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <div className="admin-users__spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Loading community legal enquiries...</p>
          </div>
        ) : questions.length === 0 ? (
          <EmptyState
            title="No Legal Enquiries Found"
            message="No public questions matched your filter criteria. Be the first to post a query or try broadening your search."
            actionLabel="Ask a Legal Question"
            onAction={handleOpenAskModal}
          />
        ) : (
          /* Question Cards List */
          <div className="feed-cards-grid">
            {questions.map((q) => {
              const isOpen = q.status === 'open';
              const answersCount = q.answersCount || 0;
              const formattedDate = new Date(q.createdAt).toLocaleDateString('en-PK', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              return (
                <article key={q.id} className="feed-card">
                  <div className="feed-card__meta-top">
                    <span className="feed-card__badge-area">{q.practiceArea}</span>
                    <span className="feed-card__badge-city">
                      <LocationIcon size={12} color="#64748b" />
                      {q.city}
                    </span>
                    <span
                      className={`feed-card__badge-status ${
                        isOpen ? 'feed-card__badge-status--open' : 'feed-card__badge-status--closed'
                      }`}
                    >
                      {isOpen ? (
                        <>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#059669' }} />
                          Open for Opinions
                        </>
                      ) : (
                        <>
                          <CheckIcon size={12} color="#475569" />
                          Resolved
                        </>
                      )}
                    </span>
                  </div>

                  <Link to={`/feed/${q.id}`} className="feed-card__title">
                    {q.title}
                  </Link>

                  <p className="feed-card__description">{q.content || q.description}</p>

                  <div className="feed-card__footer">
                    <div className="feed-card__author-info">
                      <span className="feed-card__author-avatar">
                        {(q.clientName || 'C').charAt(0)}
                      </span>
                      <span>{q.clientName || 'Anonymous Citizen'}</span>
                      <span>•</span>
                      <time dateTime={q.createdAt}>{formattedDate}</time>
                    </div>

                    <span
                      className={`feed-card__answers-badge ${
                        answersCount === 0 ? 'feed-card__answers-badge--zero' : ''
                      }`}
                    >
                      <ChatIcon size={14} />
                      {answersCount} {answersCount === 1 ? 'Legal Opinion' : 'Legal Opinions'}
                    </span>

                    <Link to={`/feed/${q.id}`} className="feed-card__read-cta">
                      <span>View Discussion</span>
                      <ArrowRightIcon size={14} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <nav className="feed-pagination" aria-label="Pagination">
            <button
              type="button"
              className="feed-pagination__btn"
              disabled={pagination.page <= 1}
              onClick={() => updateFilters({ page: pagination.page - 1 })}
            >
              ← Previous
            </button>
            <span className="feed-pagination__info">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              className="feed-pagination__btn"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => updateFilters({ page: pagination.page + 1 })}
            >
              Next →
            </button>
          </nav>
        )}
      </main>

      {/* Modal: Ask a Legal Question */}
      {isModalOpen && (
        <div
          className="feed-modal-backdrop"
          onClick={() => !submitting && setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="feed-modal" onClick={(e) => e.stopPropagation()}>
            <div className="feed-modal__header">
              <h3 className="feed-modal__title">Post a Public Legal Enquiry</h3>
              <button
                type="button"
                className="feed-modal__close"
                onClick={() => !submitting && setIsModalOpen(false)}
                aria-label="Close Modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitQuestion}>
              <div className="feed-modal__body">
                <div className="feed-modal__field">
                  <label className="feed-modal__label" htmlFor="question-title">
                    Question Title / Subject *
                  </label>
                  <input
                    id="question-title"
                    type="text"
                    required
                    placeholder="e.g. Inheritance distribution under Islamic law in Punjab"
                    className="feed-modal__input"
                    value={newQuestion.title}
                    onChange={(e) =>
                      setNewQuestion((prev) => ({ ...prev, title: e.target.value }))
                    }
                    maxLength={200}
                  />
                </div>

                <div className="feed-modal__field">
                  <label className="feed-modal__label" htmlFor="question-desc">
                    Situation Details / Context *
                  </label>
                  <textarea
                    id="question-desc"
                    required
                    rows={4}
                    placeholder="Provide details of your query without mentioning sensitive phone numbers or national identity numbers..."
                    className="feed-modal__textarea"
                    value={newQuestion.description}
                    onChange={(e) =>
                      setNewQuestion((prev) => ({ ...prev, description: e.target.value }))
                    }
                    maxLength={3000}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="feed-modal__field">
                    <label className="feed-modal__label" htmlFor="question-area">
                      Practice Area *
                    </label>
                    <select
                      id="question-area"
                      className="feed-modal__select"
                      value={newQuestion.practiceArea}
                      onChange={(e) =>
                        setNewQuestion((prev) => ({ ...prev, practiceArea: e.target.value }))
                      }
                    >
                      {PRACTICE_AREAS.map((pa) => (
                        <option key={pa} value={pa}>
                          {pa}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="feed-modal__field">
                    <label className="feed-modal__label" htmlFor="question-city">
                      City / Jurisdiction *
                    </label>
                    <select
                      id="question-city"
                      className="feed-modal__select"
                      value={newQuestion.city}
                      onChange={(e) =>
                        setNewQuestion((prev) => ({ ...prev, city: e.target.value }))
                      }
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="feed-modal__disclaimer">
                  🔒 <strong>Privacy & Legal Ethics Note:</strong> Your full name is masked automatically (e.g. <em>A. K*** (Citizen)</em>) to protect your privacy. Public replies are preliminary guidance and do not constitute a formal lawyer-client retainer until you formally consult and engage an advocate.
                </div>
              </div>

              <div className="feed-modal__footer">
                <button
                  type="button"
                  className="feed-btn feed-btn--outline"
                  style={{ color: '#475569', borderColor: '#cbd5e1' }}
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="feed-btn feed-btn--primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Post Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
