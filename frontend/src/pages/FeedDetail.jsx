import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { feedApi } from '../api/feed.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ScalesIcon,
  ShieldIcon,
  LocationIcon,
  CheckIcon,
  ArrowRightIcon,
  ChatIcon,
  BriefcaseIcon,
} from '../components/Icons';
import { ROLES } from '../constants';
import AdvocateAvatar from '../components/AdvocateAvatar';
import './FeedDetail.css';

export const FeedDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Advocate Answer Form State
  const [answerContent, setAnswerContent] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [resolving, setResolving] = useState(false);

  // Fetch question and answers
  const fetchQuestionDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await feedApi.getQuestionById(id);
      const data = res?.question || res?.data?.question || res;
      if (data && data.id) {
        setQuestion(data);
      } else {
        setError('Question not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load question details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuestionDetails();
  }, [fetchQuestionDetails]);

  // Handle Mark Question as Resolved
  const handleResolveQuestion = async () => {
    if (!window.confirm('Are you sure you want to mark this legal query as resolved? This will close the question to new answers.')) {
      return;
    }

    setResolving(true);
    try {
      await feedApi.closeQuestion(id);
      showToast('Question has been successfully marked as resolved!', 'success');
      fetchQuestionDetails();
    } catch (err) {
      showToast(err.message || 'Failed to resolve question', 'error');
    } finally {
      setResolving(false);
    }
  };

  // Handle Advocate Submitting Answer
  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerContent.trim() || answerContent.trim().length < 15) {
      showToast('Please provide a substantive legal opinion or guidance (min 15 characters)', 'warning');
      return;
    }

    setSubmittingAnswer(true);
    try {
      await feedApi.createAnswer(id, { content: answerContent.trim() });
      showToast('Your legal opinion has been published successfully!', 'success');
      setAnswerContent('');
      fetchQuestionDetails();
    } catch (err) {
      showToast(err.message || 'Failed to submit legal opinion', 'error');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  if (loading) {
    return (
      <div className="feed-detail-page">
        <div className="feed-detail-container" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
          <div className="admin-users__spinner" style={{ margin: '0 auto 1.5rem' }} />
          <p style={{ color: '#64748b', fontSize: '1rem' }}>Loading legal enquiry and advocate opinions...</p>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="feed-detail-page">
        <div className="feed-detail-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <ScalesIcon size={48} color="#94a3b8" />
          <h2 style={{ margin: '1rem 0 0.5rem', color: '#0f172a' }}>{error || 'Question Not Found'}</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            The legal enquiry you are trying to view might have been removed or does not exist.
          </p>
          <Link to="/feed" className="feed-btn feed-btn--primary">
            ← Return to Legal Feed
          </Link>
        </div>
      </div>
    );
  }

  const isOpen = question.status === 'open';
  const isOwner = user && user.id === question.clientId;
  const isLawyer = user && user.role === ROLES.LAWYER;
  const answers = question.answers || [];
  const formattedDate = new Date(question.createdAt).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="feed-detail-page">
      <div className="feed-detail-container">
        {/* Breadcrumb Navigation */}
        <nav className="feed-detail__breadcrumbs" aria-label="Breadcrumb">
          <Link to="/feed" className="feed-detail__breadcrumb-link">
            ← Community Legal Feed
          </Link>
          <span className="feed-detail__breadcrumb-sep">/</span>
          <span>{question.practiceArea}</span>
          <span className="feed-detail__breadcrumb-sep">/</span>
          <span style={{ color: '#94a3b8' }}>Enquiry #{question.id.slice(0, 8)}</span>
        </nav>

        {/* Question Card */}
        <article className="feed-detail__question-card">
          <div className="feed-detail__question-meta">
            <span className="feed-card__badge-area">{question.practiceArea}</span>
            <span className="feed-card__badge-city">
              <LocationIcon size={13} color="#64748b" />
              {question.city}
            </span>
            <span
              className={`feed-card__badge-status ${
                isOpen ? 'feed-card__badge-status--open' : 'feed-card__badge-status--closed'
              }`}
            >
              {isOpen ? (
                <>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#059669' }} />
                  Open for Advocate Opinions
                </>
              ) : (
                <>
                  <CheckIcon size={12} color="#475569" />
                  Resolved & Closed
                </>
              )}
            </span>
          </div>

          <h1 className="feed-detail__title">{question.title}</h1>
          <div className="feed-detail__description">{question.content || question.description}</div>

          <div className="feed-detail__author-bar">
            <div className="feed-detail__author">
              <span className="feed-detail__author-avatar">
                {(question.clientName || 'C').charAt(0)}
              </span>
              <div>
                <strong>{question.clientName || 'Anonymous Citizen'}</strong>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Posted on {formattedDate}</div>
              </div>
            </div>

            {/* Owner Actions */}
            {isOwner && isOpen && (
              <button
                type="button"
                className="feed-detail__btn-resolve"
                onClick={handleResolveQuestion}
                disabled={resolving}
              >
                <CheckIcon size={15} />
                <span>{resolving ? 'Closing...' : 'Mark as Resolved'}</span>
              </button>
            )}
          </div>
        </article>

        {/* Answers List Section */}
        <section className="feed-detail__answers-section" aria-label="Advocate Opinions">
          <h2 className="feed-detail__answers-header">
            <ChatIcon size={20} color="#d97706" />
            <span>Advocate Opinions & Legal Advice</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 'normal', color: '#64748b' }}>
              ({answers.length} {answers.length === 1 ? 'Response' : 'Responses'})
            </span>
          </h2>

          {answers.length === 0 ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
              }}
            >
              <ScalesIcon size={36} color="#cbd5e1" />
              <h3 style={{ margin: '0.75rem 0 0.35rem', color: '#334155', fontSize: '1.1rem' }}>
                No Advocate Opinions Yet
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 480, margin: '0 auto' }}>
                Our registered legal community is notified of new enquiries. When an Admin-Reviewed
                advocate responds, their advice and verified chamber profile will appear here.
              </p>
            </div>
          ) : (
            <div className="feed-detail__answers-list">
              {answers.map((ans) => {
                const lawyer = ans.lawyer || {};
                const app = lawyer.application || {};
                const profile = lawyer.profile || {};
                const ansDate = new Date(ans.createdAt).toLocaleDateString('en-PK', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div key={ans.id} className="feed-answer-card">
                    {/* Opinion Content */}
                    <div>
                      <div className="feed-answer-card__body">{ans.content}</div>
                      <div className="feed-answer-card__time">
                        Provided by counsel on {ansDate} PKT
                      </div>
                    </div>

                    {/* Verified Advocate Chamber Card (With Direct Hire CTA) */}
                    <div className="feed-advocate-card">
                      <div className="feed-advocate-card__identity">
                        <AdvocateAvatar
                          name={lawyer.name}
                          courtLevel={lawyer.courtLevel}
                          size={54}
                        />
                        <div className="feed-advocate-card__details">
                          <div className="feed-advocate-card__name-row">
                            <Link
                              to={`/lawyers/${lawyer.id}`}
                              className="feed-advocate-card__name"
                            >
                              {lawyer.name || 'Advocate'}
                            </Link>
                            <span className="feed-advocate-card__verified-badge">
                              <ShieldIcon size={12} color="#059669" />
                              <span>Admin-Reviewed</span>
                            </span>
                          </div>

                          <div className="feed-advocate-card__court-sub">
                            {lawyer.courtLevel || app.courtLevel || 'Advocate'} • {lawyer.barCouncil || app.barCouncil || 'Bar Council'}{' '}
                            {(lawyer.city || app.city) ? `(${lawyer.city || app.city})` : ''}
                          </div>

                          {(lawyer.headline || profile.headline) && (
                            <div className="feed-advocate-card__headline">
                              "{lawyer.headline || profile.headline}"
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Hire / Consult Actions */}
                      <div className="feed-advocate-card__actions">
                        <Link
                          to={`/book/${lawyer.id}`}
                          className="feed-btn-hire"
                        >
                          <BriefcaseIcon size={15} />
                          <span>Consult Advocate</span>
                        </Link>
                        <Link
                          to={`/lawyers/${lawyer.id}`}
                          className="feed-btn-profile"
                        >
                          <span>View Profile</span>
                          <ArrowRightIcon size={13} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Answer Submission Section */}
        {isLawyer ? (
          isOpen ? (
            <section className="feed-answer-form-card" aria-label="Provide Advocate Opinion">
              <h3 className="feed-answer-form__title">Provide Professional Legal Opinion</h3>
              <p className="feed-answer-form__subtitle">
                As an Admin-Reviewed Advocate, share preliminary guidance, relevant statutory
                provisions, or procedural steps for the citizen.
              </p>

              <form onSubmit={handleSubmitAnswer}>
                <textarea
                  className="feed-answer-form__textarea"
                  placeholder="Refer to relevant Pakistani statutory sections (e.g. Land Revenue Act 1967, Family Courts Act 1964, CrPC) and summarize next steps..."
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  required
                  rows={5}
                />

                <div className="feed-answer-form__footer">
                  <div className="feed-answer-form__notice">
                    ⚖️ <strong>Rule 135 & Legal Ethics Compliance:</strong> Preliminary opinions are pro bono educational guidance. Your response must remain professional, factual, and devoid of commercial hyperbole.
                  </div>

                  <button
                    type="submit"
                    className="feed-btn feed-btn--primary"
                    disabled={submittingAnswer}
                  >
                    {submittingAnswer ? 'Publishing...' : 'Submit Legal Opinion'}
                  </button>
                </div>
              </form>
            </section>
          ) : (
            <div className="feed-closed-banner">
              <CheckIcon size={20} color="#059669" />
              <span>This legal enquiry has been marked as resolved by the citizen. Further opinions are closed.</span>
            </div>
          )
        ) : !user ? (
          <div className="feed-guest-banner">
            ⚖️ <strong>Are you a licensed advocate?</strong> <Link to="/login?redirect=/feed">Log in to your account</Link> or{' '}
            <Link to="/register">join as an Advocate</Link> to provide legal guidance on open community enquiries.
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default FeedDetail;
