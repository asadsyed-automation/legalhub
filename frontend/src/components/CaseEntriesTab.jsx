import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import caseApi from '../api/case.api';
import EmptyState from './EmptyState';
import {
  PlusIcon,
  DocumentIcon,
  CloseIcon,
  CalendarIcon,
} from './Icons';
import {
  CASE_ENTRY_TYPES,
  CASE_ENTRY_TYPE_LABELS,
} from '../constants';
import './CaseEntriesTab.css';

export const CaseEntriesTab = ({ caseId, isLawyer }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [typeFilter, setTypeFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // Form State
  const [formEntryDate, setFormEntryDate] = useState('');
  const [formEntryType, setFormEntryType] = useState('note');
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formVisibility, setFormVisibility] = useState('private');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
      };
      if (typeFilter) params.entryType = typeFilter;
      if (visibilityFilter) params.visibility = visibilityFilter;

      const res = await caseApi.getEntries(caseId, params);
      const data = res?.data || {};
      setEntries(data.items || data.entries || []);
      setPagination({
        total: data.total || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (err) {
      setError(err.message || 'Failed to load case diary entries.');
    } finally {
      setLoading(false);
    }
  }, [caseId, page, typeFilter, visibilityFilter]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const getTodayDateStr = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const handleOpenCreateModal = () => {
    setEditingEntry(null);
    setFormEntryDate(getTodayDateStr());
    setFormEntryType('note');
    setFormTitle('');
    setFormBody('');
    setFormVisibility('private');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entry) => {
    setEditingEntry(entry);
    setFormEntryDate(entry.entryDate || getTodayDateStr());
    setFormEntryType(entry.entryType || 'note');
    setFormTitle(entry.title || '');
    setFormBody(entry.body || '');
    setFormVisibility(entry.visibility || 'private');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
    setFormError(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle.trim() || formTitle.trim().length < 2) {
      setFormError('Title must be at least 2 characters.');
      return;
    }
    if (!formBody.trim()) {
      setFormError('Entry content body is required.');
      return;
    }
    if (!formEntryDate) {
      setFormError('Entry date is required.');
      return;
    }

    const payload = {
      entryDate: formEntryDate,
      entryType: formEntryType,
      title: formTitle.trim(),
      body: formBody.trim(),
      visibility: formVisibility,
    };

    setFormSubmitting(true);
    try {
      if (editingEntry) {
        await caseApi.updateEntry(caseId, editingEntry.id, payload);
      } else {
        await caseApi.createEntry(caseId, payload);
      }
      setIsModalOpen(false);
      fetchEntries();
    } catch (err) {
      setFormError(err.message || 'Failed to save diary entry. Please verify inputs.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="entries-tab">
      {/* Top Filter and Actions Bar */}
      <div className="entries-tab__top">
        <div className="entries-tab__filters">
          <select
            className="entries-tab__filter-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by entry type"
          >
            <option value="">All Entry Types</option>
            {CASE_ENTRY_TYPES.map((t) => (
              <option key={t} value={t}>
                {CASE_ENTRY_TYPE_LABELS[t] || t}
              </option>
            ))}
          </select>

          {isLawyer && (
            <select
              className="entries-tab__filter-select"
              value={visibilityFilter}
              onChange={(e) => {
                setVisibilityFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by visibility"
            >
              <option value="">All Visibility</option>
              <option value="private">Private (Chamber)</option>
              <option value="shared">Shared (Client)</option>
            </select>
          )}
        </div>

        {isLawyer && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleOpenCreateModal}
          >
            <PlusIcon size={14} />
            <span>Add Diary Entry</span>
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            backgroundColor: 'var(--color-danger-light, #fee2e2)',
            border: '1px solid var(--color-danger, #ef4444)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-3) var(--spacing-4)',
            color: 'var(--color-danger-dark, #991b1b)',
            fontSize: 'var(--font-size-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchEntries}>
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-10)', color: 'var(--color-text-muted)' }}>
          Loading case diary entries...
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && entries.length === 0 && (
        <EmptyState
          icon={<DocumentIcon size={40} />}
          title={isLawyer ? 'No diary entries recorded' : 'No shared diary entries'}
          message={
            isLawyer
              ? 'Record pleadings, court orders, or private chamber strategy notes to track the procedural history of this brief.'
              : 'Your advocate has not shared any diary entries for this case file yet. Pleadings and orders will appear here once shared.'
          }
          actionLabel={isLawyer ? 'Add First Entry' : null}
          onAction={isLawyer ? handleOpenCreateModal : null}
        />
      )}

      {/* Entries List */}
      {!loading && !error && entries.length > 0 && (
        <div className="entries-list">
          {entries.map((entry) => (
            <article key={entry.id} className="entry-card">
              <div className="entry-card__header">
                <div className="entry-card__title-row">
                  <h3 className="entry-card__title">{entry.title}</h3>
                  <span className={`entry-badge entry-badge--${entry.entryType || 'note'}`}>
                    {CASE_ENTRY_TYPE_LABELS[entry.entryType] || entry.entryType}
                  </span>
                  {isLawyer && (
                    <span
                      className={`entry-visibility-pill entry-visibility-pill--${entry.visibility}`}
                    >
                      {entry.visibility === 'shared' ? 'Shared with Client' : 'Private (Chamber Only)'}
                    </span>
                  )}
                </div>

                <div className="entry-card__date">
                  <CalendarIcon size={14} />
                  <span>{formatDate(entry.entryDate)}</span>
                </div>
              </div>

              <div className="entry-card__body">{entry.body}</div>

              {isLawyer && (
                <div className="entry-card__footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenEditModal(entry)}
                  >
                    Edit Entry
                  </button>
                </div>
              )}
            </article>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 'var(--spacing-4)',
                borderTop: '1px solid var(--color-border)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              <span>
                Page {page} of {pagination.totalPages} ({pagination.total} total entries)
              </span>
              <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Entry Modal */}
      {isModalOpen && (
        <div className="entry-modal-overlay" role="dialog" aria-modal="true">
          <div className="entry-modal">
            <div className="entry-modal__header">
              <h2>{editingEntry ? 'Edit Diary Entry' : 'Record New Diary Entry (*Roznamcha*)'}</h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCloseModal}
                aria-label="Close dialog"
                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="entry-modal__body">
                {formError && (
                  <div
                    style={{
                      backgroundColor: 'var(--color-danger-light, #fee2e2)',
                      border: '1px solid var(--color-danger, #ef4444)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--spacing-2) var(--spacing-3)',
                      color: 'var(--color-danger-dark, #991b1b)',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    {formError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                  <div className="new-case-field">
                    <label htmlFor="modal-entry-date">Entry Date *</label>
                    <input
                      id="modal-entry-date"
                      type="date"
                      value={formEntryDate}
                      onChange={(e) => setFormEntryDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="new-case-field">
                    <label htmlFor="modal-entry-type">Document / Entry Type *</label>
                    <select
                      id="modal-entry-type"
                      value={formEntryType}
                      onChange={(e) => setFormEntryType(e.target.value)}
                    >
                      {CASE_ENTRY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {CASE_ENTRY_TYPE_LABELS[t] || t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="new-case-field">
                  <label htmlFor="modal-entry-title">Title / Heading *</label>
                  <input
                    id="modal-entry-title"
                    type="text"
                    placeholder="e.g. Interim Injunction Application Filed under Order 39"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    maxLength={150}
                    required
                  />
                </div>

                <div className="new-case-field">
                  <label htmlFor="modal-entry-body">Content / Notes *</label>
                  <textarea
                    id="modal-entry-body"
                    rows={6}
                    placeholder="Record petition grounds, verbatim judge remarks, or chamber strategy..."
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    maxLength={5000}
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)', alignSelf: 'flex-end' }}>
                    {formBody.length} / 5000 characters
                  </span>
                </div>

                <div className="new-case-field">
                  <label>Client Visibility *</label>
                  <div className="entry-visibility-group">
                    <label
                      className={`entry-visibility-option ${
                        formVisibility === 'private' ? 'entry-visibility-option--selected' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="entry-visibility"
                        value="private"
                        checked={formVisibility === 'private'}
                        onChange={() => setFormVisibility('private')}
                      />
                      <div>
                        <strong>Private (Chamber Only)</strong>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          Shielded from client view. Suitable for attorney strategy and notes.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`entry-visibility-option ${
                        formVisibility === 'shared' ? 'entry-visibility-option--selected' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="entry-visibility"
                        value="shared"
                        checked={formVisibility === 'shared'}
                        onChange={() => setFormVisibility('shared')}
                      />
                      <div>
                        <strong>Shared with Client</strong>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          Visible on the client portal. Suitable for pleadings and court orders.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="entry-modal__actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCloseModal}
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Saving...' : editingEntry ? 'Save Changes' : 'Record Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

CaseEntriesTab.propTypes = {
  caseId: PropTypes.string.isRequired,
  isLawyer: PropTypes.bool.isRequired,
};

export default CaseEntriesTab;
