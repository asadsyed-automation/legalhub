import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import caseApi from '../api/case.api';
import EmptyState from './EmptyState';
import {
  ClockIcon,
  CalendarIcon,
  DocumentIcon,
  CourtIcon,
  ShieldIcon,
} from './Icons';
import {
  TIMELINE_EVENT_KINDS,
  TIMELINE_EVENT_LABELS,
} from '../constants';
import './CaseTimelineTab.css';

export const CaseTimelineTab = ({ caseId, isLawyer }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [activeKind, setActiveKind] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 25,
      };
      if (activeKind !== 'all') {
        params.kind = activeKind;
      }

      const res = await caseApi.getTimeline(caseId, params);
      const data = res?.data || res || {};

      setItems(Array.isArray(data.items) ? data.items : []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Failed to load case timeline:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load case journey timeline. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [caseId, activeKind, page]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const handleKindChange = (kind) => {
    setActiveKind(kind);
    setPage(1); // Reset to page 1 on filter switch
  };

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const renderEventIcon = (kind) => {
    switch (kind) {
      case 'hearing':
        return <CalendarIcon size={14} />;
      case 'document':
        return <DocumentIcon size={14} />;
      case 'status_change':
        return <CourtIcon size={14} />;
      case 'entry':
      default:
        return <ClockIcon size={14} />;
    }
  };

  return (
    <div className="timeline-tab">
      {/* ===================================================================
          1. FILTER PILLS BAR
          =================================================================== */}
      <div className="timeline-filters">
        {TIMELINE_EVENT_KINDS.map((kindKey) => {
          const isActive = activeKind === kindKey;
          return (
            <button
              key={kindKey}
              type="button"
              className={`timeline-filter-btn ${
                isActive ? 'timeline-filter-btn--active' : ''
              }`}
              onClick={() => handleKindChange(kindKey)}
            >
              {TIMELINE_EVENT_LABELS[kindKey] || kindKey}
              {isActive && (
                <span className="timeline-filter-btn__count">
                  {totalCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert alert--danger" style={{ margin: 0 }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto var(--spacing-3)' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Retrieving chronological case timeline...
          </p>
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={<ClockIcon size={44} color="var(--color-text-muted)" />}
          title="No Timeline Events Found"
          message={
            activeKind !== 'all'
              ? `No ${TIMELINE_EVENT_LABELS[activeKind] || activeKind} events recorded for this case file yet.`
              : 'The chronological case journey is currently empty. Events will populate as court dates, diary entries, documents, and status shifts are recorded.'
          }
        />
      ) : (
        /* ===================================================================
            2. VERTICAL TIMELINE STREAM
            =================================================================== */
        <div className="timeline-stream">
          {items.map((item, index) => {
            const nodeClass =
              item.kind === 'hearing'
                ? 'timeline-item__node--hearing'
                : item.kind === 'document'
                ? 'timeline-item__node--document'
                : item.kind === 'status_change'
                ? 'timeline-item__node--status_change'
                : 'timeline-item__node--entry';

            const badgeClass =
              item.kind === 'hearing'
                ? 'timeline-kind-badge--hearing'
                : item.kind === 'document'
                ? 'timeline-kind-badge--document'
                : item.kind === 'status_change'
                ? 'timeline-kind-badge--status_change'
                : 'timeline-kind-badge--entry';

            return (
              <div key={item.refId ? `${item.kind}-${item.refId}-${index}` : index} className="timeline-item">
                {/* Node icon on spine */}
                <div className={`timeline-item__node ${nodeClass}`}>
                  {renderEventIcon(item.kind)}
                </div>

                {/* Event Card */}
                <div className="timeline-item__card">
                  <div className="timeline-item__header">
                    <div className="timeline-item__badges-group">
                      <span className={`timeline-kind-badge ${badgeClass}`}>
                        {item.kind === 'hearing'
                          ? 'Court Hearing'
                          : item.kind === 'document'
                          ? 'Document Vault'
                          : item.kind === 'status_change'
                          ? 'Status Shift'
                          : 'Diary Entry'}
                      </span>

                      {/* Lawyer Visibility Marker */}
                      {isLawyer && item.visibility && (
                        <span
                          className={`timeline-visibility-pill ${
                            item.visibility === 'shared'
                              ? 'timeline-visibility-pill--shared'
                              : 'timeline-visibility-pill--private'
                          }`}
                        >
                          {item.visibility === 'shared' ? 'Shared with Client' : 'Private (Chamber)'}
                        </span>
                      )}
                    </div>

                    <span className="timeline-item__timestamp">
                      {formatTimestamp(item.date)}
                    </span>
                  </div>

                  <h4 className="timeline-item__title">{item.title}</h4>

                  {item.summary && (
                    <p className="timeline-item__summary">{item.summary}</p>
                  )}

                  {/* Hearing-Specific Details */}
                  {item.kind === 'hearing' && (item.court || item.stage || item.outcome) && (
                    <div className="timeline-metadata-box">
                      {item.court && (
                        <div className="timeline-metadata-row">
                          <CourtIcon size={14} />
                          <span>Forum: <strong>{item.court}</strong></span>
                        </div>
                      )}
                      {item.stage && (
                        <div className="timeline-metadata-row">
                          <ShieldIcon size={14} />
                          <span>Procedural Stage: <strong>{item.stage}</strong></span>
                        </div>
                      )}
                      {item.outcome && (
                        <div className="timeline-outcome-pill">
                          <strong>Bench Outcome:</strong> {item.outcome}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================
          3. PAGINATION CONTROLS
          =================================================================== */}
      {totalPages > 1 && (
        <div className="timeline-pagination">
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page <= 1 || loading}
          >
            Previous
          </button>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Page {page} of {totalPages} ({totalCount} total events)
          </span>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page >= totalPages || loading}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

CaseTimelineTab.propTypes = {
  caseId: PropTypes.string.isRequired,
  isLawyer: PropTypes.bool.isRequired,
};

export default CaseTimelineTab;
