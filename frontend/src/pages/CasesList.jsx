import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import caseApi from '../api/case.api';
import StatusChip from '../components/StatusChip';
import EmptyState from '../components/EmptyState';
import {
  CourtIcon,
  PlusIcon,
  BriefcaseIcon,
  ClockIcon,
} from '../components/Icons';
import {
  ROLES,
  CASE_STATUSES,
  CASE_STATUS_LABELS,
  COURTS,
  PRACTICE_AREAS,
} from '../constants';
import './CasesList.css';

export const CasesList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isLawyer = user?.role === ROLES.LAWYER;

  // Query & Filter State
  const [statusFilter, setStatusFilter] = useState('');
  const [courtFilter, setCourtFilter] = useState('');
  const [practiceAreaFilter, setPracticeAreaFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Data & Request State
  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: 10,
      };
      if (statusFilter) params.status = statusFilter;
      if (courtFilter) params.court = courtFilter;
      if (practiceAreaFilter) params.practiceArea = practiceAreaFilter;

      const res = await caseApi.getCases(params);
      const data = res?.data || {};
      setCases(data.items || data.cases || []);
      setPagination({
        total: data.total || 0,
        totalPages: data.totalPages || 1,
        limit: data.limit || 10,
      });
    } catch (err) {
      setError(err.message || 'Failed to retrieve cases. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, courtFilter, practiceAreaFilter]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleResetFilters = () => {
    setStatusFilter('');
    setCourtFilter('');
    setPracticeAreaFilter('');
    setCurrentPage(1);
  };

  const formatHearingDate = (isoStr) => {
    if (!isoStr) return null;
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="cases-page">
      {/* Page Header */}
      <div className="cases-header">
        <div className="cases-header__info">
          <h1>{isLawyer ? 'Case Files & Chamber Diary' : 'My Case Files'}</h1>
          <p>
            {isLawyer
              ? 'Maintain your active briefs, court hearing calendar, and client disclosures in accordance with Bar Council rules.'
              : 'Review your ongoing litigation matters, upcoming court hearing dates, and case progress.'}
          </p>
        </div>

        {isLawyer && (
          <Link to="/cases/new" className="btn btn-primary">
            <PlusIcon size={16} />
            <span>Open New Case File</span>
          </Link>
        )}
      </div>

      {/* Filter Controls Bar */}
      <div className="cases-filters-bar">
        <div className="cases-filters-group">
          <label htmlFor="filter-status">Status</label>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Statuses</option>
            {CASE_STATUSES.map((st) => (
              <option key={st} value={st}>
                {CASE_STATUS_LABELS[st] || st}
              </option>
            ))}
          </select>
        </div>

        <div className="cases-filters-group">
          <label htmlFor="filter-court">Court Forum</label>
          <select
            id="filter-court"
            value={courtFilter}
            onChange={(e) => {
              setCourtFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Courts</option>
            {COURTS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="cases-filters-group">
          <label htmlFor="filter-area">Practice Area</label>
          <select
            id="filter-area"
            value={practiceAreaFilter}
            onChange={(e) => {
              setPracticeAreaFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Practice Areas</option>
            {PRACTICE_AREAS.map((pa) => (
              <option key={pa} value={pa}>
                {pa}
              </option>
            ))}
          </select>
        </div>

        {(statusFilter || courtFilter || practiceAreaFilter) && (
          <button
            type="button"
            className="btn btn-secondary btn-sm cases-filters-reset-btn"
            onClick={handleResetFilters}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Error State Banner */}
      {error && (
        <div
          style={{
            backgroundColor: 'var(--color-danger-light, #fee2e2)',
            border: '1px solid var(--color-danger, #ef4444)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-4)',
            color: 'var(--color-danger-dark, #991b1b)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchCases}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--spacing-12)',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-size-base)',
          }}
        >
          Loading chamber case records...
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && cases.length === 0 && (
        <EmptyState
          icon={<BriefcaseIcon size={40} />}
          title={isLawyer ? 'No case files registered' : 'No cases linked'}
          message={
            isLawyer
              ? 'You have not opened any case files yet. Open a new case file to record hearing dates, diary entries, and legal documents.'
              : 'You do not have any litigation case files linked to your account yet. When your advocate opens a case linked to your consultation, it will appear here.'
          }
          actionLabel={isLawyer ? 'Open New Case File' : null}
          onAction={isLawyer ? () => navigate('/cases/new') : null}
        />
      )}

      {/* Case Cards Grid */}
      {!loading && !error && cases.length > 0 && (
        <>
          <div className="cases-grid">
            {cases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="case-card"
                onClick={() => navigate(`/cases/${caseItem.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/cases/${caseItem.id}`);
                  }
                }}
              >
                <div className="case-card__header">
                  <h2 className="case-card__title">{caseItem.title}</h2>
                  <StatusChip status={caseItem.status} />
                </div>

                <div className="case-card__badges">
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      fontWeight: 'var(--font-weight-semibold)',
                    }}
                  >
                    {caseItem.practiceArea}
                  </span>

                  {caseItem.stage && (
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      Stage: {caseItem.stage}
                    </span>
                  )}
                </div>

                <div className="case-card__meta-row">
                  <div className="case-card__meta-item case-card__meta-item--court">
                    <CourtIcon size={14} color="var(--color-primary)" />
                    <span>{caseItem.court}</span>
                  </div>

                  {caseItem.caseOrFirNumber && (
                    <div className="case-card__meta-item">
                      <span>No: <strong>{caseItem.caseOrFirNumber}</strong></span>
                    </div>
                  )}

                  {isLawyer && caseItem.client && (
                    <div className="case-card__meta-item">
                      <span>Client: <strong>{caseItem.client.name}</strong></span>
                    </div>
                  )}
                </div>

                {Array.isArray(caseItem.parties) && caseItem.parties.length > 0 && (
                  <div className="case-card__parties">
                    {caseItem.parties.slice(0, 3).map((p, idx) => (
                      <span key={p.id || idx} className="case-card__party-pill">
                        {p.name} ({p.roleLabel})
                      </span>
                    ))}
                    {caseItem.parties.length > 3 && (
                      <span className="case-card__party-pill">
                        +{caseItem.parties.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {caseItem.nextHearing ? (
                  <div className="case-card__next-hearing">
                    <ClockIcon size={14} />
                    <span>Next Hearing: {formatHearingDate(caseItem.nextHearing.scheduledAt)}</span>
                  </div>
                ) : (
                  <div className="case-card__no-hearing">
                    No future court hearing scheduled
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="cases-pagination">
              <span className="cases-pagination__info">
                Page {pagination.page || currentPage} of {pagination.totalPages} (Total {pagination.total} cases)
              </span>

              <div className="cases-pagination__actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage >= pagination.totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CasesList;
