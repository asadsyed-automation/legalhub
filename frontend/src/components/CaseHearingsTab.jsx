import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import caseApi from '../api/case.api';
import EmptyState from './EmptyState';
import {
  CalendarIcon,
  ClockIcon,
  CourtIcon,
  PlusIcon,
  CloseIcon,
} from './Icons';
import {
  COURTS,
  CASE_STAGES,
  CASE_STAGE_LABELS,
} from '../constants';
import './CaseHearingsTab.css';

export const CaseHearingsTab = ({ caseData, isLawyer, onHearingUpdated }) => {
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isQuickOutcomeModalOpen, setIsQuickOutcomeModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [targetHearing, setTargetHearing] = useState(null);

  // Quick Outcome Form
  const [quickOutcome, setQuickOutcome] = useState('');
  const [quickNextDate, setQuickNextDate] = useState('');
  const [quickAdjournmentReason, setQuickAdjournmentReason] = useState('');
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickError, setQuickError] = useState(null);

  // Full Schedule / Edit Form
  const [formScheduledAt, setFormScheduledAt] = useState('');
  const [formCourt, setFormCourt] = useState('');
  const [formBench, setFormBench] = useState('');
  const [formStage, setFormStage] = useState('');
  const [formOutcome, setFormOutcome] = useState('');
  const [formNextDate, setFormNextDate] = useState('');
  const [formAdjournmentReason, setFormAdjournmentReason] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formClientExplanation, setFormClientExplanation] = useState('');
  const [formVisibility, setFormVisibility] = useState('shared');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchHearings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await caseApi.getHearings(caseData.id);
      const list = Array.isArray(res?.data) ? res.data : [];
      setHearings(list);
    } catch (err) {
      setError(err.message || 'Failed to retrieve hearing schedule.');
    } finally {
      setLoading(false);
    }
  }, [caseData.id]);

  useEffect(() => {
    fetchHearings();
  }, [fetchHearings]);

  // Convert Date to datetime-local format (YYYY-MM-DDTHH:mm)
  const toDateTimeLocalStr = (isoDate) => {
    if (!isoDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow.toISOString().slice(0, 16);
    }
    const d = new Date(isoDate);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleOpenScheduleModal = () => {
    setFormScheduledAt(toDateTimeLocalStr());
    setFormCourt(caseData.court || COURTS[0]);
    setFormBench('');
    setFormStage(caseData.stage || CASE_STAGES[0]);
    setFormOutcome('');
    setFormNextDate('');
    setFormAdjournmentReason('');
    setFormNote('');
    setFormClientExplanation('');
    setFormVisibility('shared');
    setFormError(null);
    setIsScheduleModalOpen(true);
  };

  const handleOpenEditModal = (h) => {
    setTargetHearing(h);
    setFormScheduledAt(toDateTimeLocalStr(h.scheduledAt));
    setFormCourt(h.court || caseData.court);
    setFormBench(h.bench || '');
    setFormStage(h.stage || '');
    setFormOutcome(h.outcome || '');
    setFormNextDate(h.nextDate || '');
    setFormAdjournmentReason(h.adjournmentReason || '');
    setFormNote(h.note || '');
    setFormClientExplanation(h.clientExplanation || '');
    setFormVisibility(h.visibility || 'shared');
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenQuickOutcome = (h) => {
    setTargetHearing(h);
    setQuickOutcome(h.outcome || '');
    setQuickNextDate(h.nextDate || '');
    setQuickAdjournmentReason(h.adjournmentReason || '');
    setQuickError(null);
    setIsQuickOutcomeModalOpen(true);
  };

  const handleQuickOutcomeSubmit = async (e) => {
    e.preventDefault();
    if (!quickOutcome.trim()) {
      setQuickError('Outcome is required.');
      return;
    }

    setQuickSubmitting(true);
    setQuickError(null);

    try {
      const payload = {
        outcome: quickOutcome.trim(),
        nextDate: quickNextDate || null,
        adjournmentReason: quickAdjournmentReason.trim() || null,
      };

      await caseApi.recordQuickOutcome(targetHearing.id, payload);
      setIsQuickOutcomeModalOpen(false);
      fetchHearings();
      if (onHearingUpdated) onHearingUpdated();
    } catch (err) {
      setQuickError(err.message || 'Failed to record outcome. Please try again.');
    } finally {
      setQuickSubmitting(false);
    }
  };

  const handleFullFormSubmit = async (e) => {
    e.preventDefault();
    if (!formScheduledAt) {
      setFormError('Scheduled hearing date and time is required.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    const payload = {
      scheduledAt: new Date(formScheduledAt).toISOString(),
      court: formCourt || caseData.court,
      bench: formBench.trim() || null,
      stage: formStage || null,
      outcome: formOutcome.trim() || null,
      nextDate: formNextDate || null,
      adjournmentReason: formAdjournmentReason.trim() || null,
      note: formNote.trim() || null,
      clientExplanation: formClientExplanation.trim() || null,
      visibility: formVisibility,
    };

    try {
      if (isEditModalOpen && targetHearing) {
        await caseApi.updateHearing(caseData.id, targetHearing.id, payload);
      } else {
        await caseApi.createHearing(caseData.id, payload);
      }
      setIsScheduleModalOpen(false);
      setIsEditModalOpen(false);
      fetchHearings();
      if (onHearingUpdated) onHearingUpdated();
    } catch (err) {
      setFormError(err.message || 'Failed to save hearing details. Please verify inputs.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleDateString('en-PK', {
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

  const isUpcoming = (scheduledAt) => {
    if (!scheduledAt) return false;
    return new Date(scheduledAt) >= new Date();
  };

  return (
    <div className="hearings-tab">
      {/* Top Action Bar */}
      <div className="hearings-tab__top">
        <div>
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)' }}>
            Court Cause List & Hearing Schedule (*Peshian*)
          </h2>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            {hearings.length} court appearances recorded for this brief
          </span>
        </div>

        {isLawyer && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleOpenScheduleModal}
          >
            <PlusIcon size={14} />
            <span>Schedule Court Hearing</span>
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
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchHearings}>
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-10)', color: 'var(--color-text-muted)' }}>
          Loading court hearing schedule...
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && hearings.length === 0 && (
        <EmptyState
          icon={<CalendarIcon size={40} />}
          title={isLawyer ? 'No court hearings scheduled' : 'No upcoming hearings'}
          message={
            isLawyer
              ? 'Schedule the next hearing date (*Peshi*) to track courtroom appearances, bench outcomes, and plain-language client explanations.'
              : 'There are no court hearing dates scheduled for this case at this time.'
          }
          actionLabel={isLawyer ? 'Schedule First Hearing' : null}
          onAction={isLawyer ? handleOpenScheduleModal : null}
        />
      )}

      {/* Hearings List */}
      {!loading && !error && hearings.length > 0 && (
        <div className="hearings-list">
          {hearings.map((h) => {
            const upcoming = isUpcoming(h.scheduledAt);
            return (
              <article
                key={h.id}
                className={`hearing-card ${upcoming ? 'hearing-card--upcoming' : 'hearing-card--past'}`}
              >
                <div className="hearing-card__header">
                  <div className="hearing-card__time-badge">
                    <ClockIcon size={16} color={upcoming ? 'var(--color-primary)' : 'var(--color-text-subtle)'} />
                    <span>{formatDateTime(h.scheduledAt)}</span>
                  </div>

                  <div className="hearing-card__badges">
                    <span className={`hearing-pill ${upcoming ? 'hearing-pill--upcoming' : 'hearing-pill--past'}`}>
                      {upcoming ? 'Upcoming Hearing' : 'Past Appearance'}
                    </span>

                    {h.stage && (
                      <span className="case-banner__pill">
                        Stage: <strong>{CASE_STAGE_LABELS[h.stage] || h.stage}</strong>
                      </span>
                    )}

                    {isLawyer && (
                      <span className={`entry-visibility-pill entry-visibility-pill--${h.visibility}`}>
                        {h.visibility === 'shared' ? 'Shared with Client' : 'Private Chamber'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="hearing-card__details">
                  <div className="hearing-detail-item">
                    <span className="hearing-detail-label">Court Forum</span>
                    <span className="hearing-detail-val">
                      <CourtIcon size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      {h.court || caseData.court}
                    </span>
                  </div>

                  <div className="hearing-detail-item">
                    <span className="hearing-detail-label">Presiding Bench</span>
                    <span className="hearing-detail-val">{h.bench || 'Regular Bench'}</span>
                  </div>

                  {h.nextDate && (
                    <div className="hearing-detail-item">
                      <span className="hearing-detail-label">Next Adjourned Date</span>
                      <span className="hearing-detail-val" style={{ color: 'var(--color-primary-dark)' }}>
                        {formatDate(h.nextDate)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Outcome Banner */}
                {h.outcome && (
                  <div className="hearing-outcome-box">
                    <span className="hearing-outcome-box__title">
                      Bench Outcome / Order
                      {h.adjournmentReason ? ` (Adjourned: ${h.adjournmentReason})` : ''}
                    </span>
                    <span className="hearing-outcome-box__text">{h.outcome}</span>
                  </div>
                )}

                {/* Explanations & Strategy Notes */}
                {(h.clientExplanation || (isLawyer && h.note)) && (
                  <div className="hearing-notes-grid">
                    {h.clientExplanation && (
                      <div className="hearing-note-box hearing-note-box--client">
                        <strong style={{ color: 'var(--color-text-main)' }}>Client Explanation:</strong>
                        <span>{h.clientExplanation}</span>
                      </div>
                    )}

                    {isLawyer && h.note && (
                      <div className="hearing-note-box hearing-note-box--private">
                        <strong style={{ color: '#854d0e' }}>Lawyer Strategy Note (Private):</strong>
                        <span>{h.note}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Advocate Action Buttons */}
                {isLawyer && (
                  <div className="hearing-card__actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenQuickOutcome(h)}
                      title="Quick Outcome usable on mobile"
                    >
                      Record Quick Outcome
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEditModal(h)}
                    >
                      Full Edit
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* QUICK OUTCOME MODAL (Mobile-optimized for phone in corridor) */}
      {isQuickOutcomeModalOpen && (
        <div className="entry-modal-overlay" role="dialog" aria-modal="true">
          <div className="quick-outcome-modal">
            <div className="entry-modal__header">
              <h2>Quick Bench Outcome (*Peshi*)</h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsQuickOutcomeModalOpen(false)}
                aria-label="Close"
                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleQuickOutcomeSubmit}>
              <div className="entry-modal__body">
                {quickError && (
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
                    {quickError}
                  </div>
                )}

                <div className="new-case-field">
                  <label htmlFor="quick-outcome-text">Bench Outcome / Order Summary *</label>
                  <textarea
                    id="quick-outcome-text"
                    rows={3}
                    placeholder="e.g. Arguments heard in part. Adjourned for cross-examination of Plaintiff witness."
                    value={quickOutcome}
                    onChange={(e) => setQuickOutcome(e.target.value)}
                    maxLength={300}
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)', alignSelf: 'flex-end' }}>
                    {quickOutcome.length} / 300 characters
                  </span>
                </div>

                <div className="new-case-field">
                  <label htmlFor="quick-next-date">Next Hearing Date (*Agli Tareekh*)</label>
                  <input
                    id="quick-next-date"
                    type="date"
                    value={quickNextDate}
                    onChange={(e) => setQuickNextDate(e.target.value)}
                  />
                </div>

                <div className="new-case-field">
                  <label htmlFor="quick-adjournment-reason">Reason for Adjournment (Optional)</label>
                  <input
                    id="quick-adjournment-reason"
                    type="text"
                    placeholder="e.g. Non-availability of presiding judge or state request"
                    value={quickAdjournmentReason}
                    onChange={(e) => setQuickAdjournmentReason(e.target.value)}
                    maxLength={300}
                  />
                </div>
              </div>

              <div className="entry-modal__actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsQuickOutcomeModalOpen(false)}
                  disabled={quickSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={quickSubmitting}
                >
                  {quickSubmitting ? 'Recording...' : 'Save Outcome'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL SCHEDULE / EDIT MODAL */}
      {(isScheduleModalOpen || isEditModalOpen) && (
        <div className="entry-modal-overlay" role="dialog" aria-modal="true">
          <div className="entry-modal">
            <div className="entry-modal__header">
              <h2>{isEditModalOpen ? 'Edit Hearing Details' : 'Schedule Court Hearing (*Peshi*)'}</h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                aria-label="Close"
                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleFullFormSubmit}>
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
                    <label htmlFor="form-hearing-time">Scheduled Hearing Date & Time *</label>
                    <input
                      id="form-hearing-time"
                      type="datetime-local"
                      value={formScheduledAt}
                      onChange={(e) => setFormScheduledAt(e.target.value)}
                      required
                    />
                  </div>

                  <div className="new-case-field">
                    <label htmlFor="form-hearing-stage">Procedural Stage</label>
                    <select
                      id="form-hearing-stage"
                      value={formStage}
                      onChange={(e) => setFormStage(e.target.value)}
                    >
                      <option value="">No Stage Selected</option>
                      {CASE_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {CASE_STAGE_LABELS[s] || s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                  <div className="new-case-field">
                    <label htmlFor="form-hearing-court">Court Forum</label>
                    <select
                      id="form-hearing-court"
                      value={formCourt}
                      onChange={(e) => setFormCourt(e.target.value)}
                    >
                      {COURTS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="new-case-field">
                    <label htmlFor="form-hearing-bench">Presiding Bench (Optional)</label>
                    <input
                      id="form-hearing-bench"
                      type="text"
                      placeholder="e.g. Single Bench III or DB 1"
                      value={formBench}
                      onChange={(e) => setFormBench(e.target.value)}
                      maxLength={120}
                    />
                  </div>
                </div>

                <div className="new-case-field">
                  <label htmlFor="form-hearing-explanation">Client Plain-Language Explanation (Shared)</label>
                  <textarea
                    id="form-hearing-explanation"
                    rows={2}
                    placeholder="Explain to your client in simple language what will happen at this hearing..."
                    value={formClientExplanation}
                    onChange={(e) => setFormClientExplanation(e.target.value)}
                    maxLength={1000}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)', alignSelf: 'flex-end' }}>
                    {formClientExplanation.length} / 1000 characters
                  </span>
                </div>

                <div className="new-case-field">
                  <label htmlFor="form-hearing-note">Chamber Strategy Note (Strictly Private)</label>
                  <textarea
                    id="form-hearing-note"
                    rows={3}
                    placeholder="Internal cross-examination cues, precedents to cite, or witness prep notes (never sent to client)..."
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    maxLength={2000}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)', alignSelf: 'flex-end' }}>
                    {formNote.length} / 2000 characters
                  </span>
                </div>

                <div className="new-case-field">
                  <label>Client Visibility</label>
                  <div className="entry-visibility-group">
                    <label
                      className={`entry-visibility-option ${
                        formVisibility === 'shared' ? 'entry-visibility-option--selected' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="hearing-visibility"
                        value="shared"
                        checked={formVisibility === 'shared'}
                        onChange={() => setFormVisibility('shared')}
                      />
                      <div>
                        <strong>Shared with Client (Recommended)</strong>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          Appears on client portal with explanation. Strategy note stays private.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`entry-visibility-option ${
                        formVisibility === 'private' ? 'entry-visibility-option--selected' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="hearing-visibility"
                        value="private"
                        checked={formVisibility === 'private'}
                        onChange={() => setFormVisibility('private')}
                      />
                      <div>
                        <strong>Private (Chamber Only)</strong>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          Hidden from client portal completely.
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
                  onClick={() => {
                    setIsScheduleModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Saving...' : isEditModalOpen ? 'Save Changes' : 'Schedule Hearing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

CaseHearingsTab.propTypes = {
  caseData: PropTypes.object.isRequired,
  isLawyer: PropTypes.bool.isRequired,
  onHearingUpdated: PropTypes.func,
};

export default CaseHearingsTab;
