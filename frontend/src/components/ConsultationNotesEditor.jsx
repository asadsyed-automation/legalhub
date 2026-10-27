import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import bookingApi from '../api/booking.api';
import { useToast } from '../context/ToastContext';
import {
  DocumentIcon,
  CheckIcon,
  CloseIcon,
  ShieldIcon,
} from './Icons';
import './ConsultationNotesEditor.css';

export const ConsultationNotesEditor = ({ booking, isLawyer, onNotesSaved }) => {
  const { showToast } = useToast();

  const existingNote = booking?.consultationNote || null;

  // Form State for Advocate
  const [summary, setSummary] = useState('');
  const [actionItems, setActionItems] = useState(['']);
  const [privateNotes, setPrivateNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (existingNote) {
      setSummary(existingNote.summary || '');
      setActionItems(
        Array.isArray(existingNote.actionItems) && existingNote.actionItems.length > 0
          ? existingNote.actionItems
          : ['']
      );
      setPrivateNotes(existingNote.privateNotes || '');
    }
  }, [existingNote]);

  // Action Items Management
  const handleActionItemChange = (index, value) => {
    setActionItems((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleAddActionItem = () => {
    if (actionItems.length >= 20) {
      showToast('Maximum 20 action items allowed', 'warning');
      return;
    }
    setActionItems((prev) => [...prev, '']);
  };

  const handleRemoveActionItem = (index) => {
    setActionItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Save notes
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanItems = actionItems.map((item) => item.trim()).filter(Boolean);
      const payload = {
        summary: summary.trim() || null,
        actionItems: cleanItems,
        privateNotes: privateNotes.trim() || null,
      };

      const res = await bookingApi.upsertNotes(booking.id, payload);
      showToast('Consultation notes saved successfully!', 'success');
      setIsEditing(false);
      if (onNotesSaved) {
        onNotesSaved(res?.note || res?.data || res);
      }
    } catch (err) {
      showToast(err.message || 'Failed to save consultation notes', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // CLIENT READ-ONLY VIEW
  // ---------------------------------------------------------------------------
  if (!isLawyer) {
    if (!existingNote || (!existingNote.summary && (!existingNote.actionItems || existingNote.actionItems.length === 0))) {
      return (
        <div className="cne-card">
          <div className="cne-header">
            <h3 className="cne-title">
              <DocumentIcon size={18} color="var(--color-primary)" />
              Advocate Consultation Summary &amp; Next Steps
            </h3>
            <span className="cne-badge">Pending Advocate Record</span>
          </div>
          <p style={{ color: 'var(--color-text-subtle)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
            Following the consultation session, your advocate will record a legal matter summary and recommended procedural steps here.
          </p>
        </div>
      );
    }

    return (
      <div className="cne-card">
        <div className="cne-header">
          <h3 className="cne-title">
            <DocumentIcon size={18} color="var(--color-primary)" />
            Legal Summary &amp; Recommended Next Steps
          </h3>
          <span className="cne-badge">Advocate Verified</span>
        </div>

        {/* Shared Summary */}
        {existingNote.summary && (
          <div className="cne-section">
            <span className="cne-label">Consultation Matter Summary</span>
            <div className="cne-readonly-summary">{existingNote.summary}</div>
          </div>
        )}

        {/* Action Items / Next Steps */}
        {Array.isArray(existingNote.actionItems) && existingNote.actionItems.length > 0 && (
          <div className="cne-section">
            <span className="cne-label">Client Action Items &amp; Procedural Roadmap</span>
            <ul className="cne-checklist">
              {existingNote.actionItems.map((item, idx) => (
                <li key={idx} className="cne-checklist-item">
                  <CheckIcon size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // ADVOCATE VIEW (EDITOR / READ-ONLY WITH EDIT TOGGLE)
  // ---------------------------------------------------------------------------
  const hasExistingNotes = Boolean(
    existingNote && (existingNote.summary || existingNote.privateNotes || (existingNote.actionItems && existingNote.actionItems.length > 0))
  );

  return (
    <div className="cne-card">
      <div className="cne-header">
        <h3 className="cne-title">
          <DocumentIcon size={18} color="var(--color-primary)" />
          Consultation Notes &amp; Legal Roadmap Editor
        </h3>
        {hasExistingNotes && !isEditing && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsEditing(true)}
          >
            Edit Notes
          </button>
        )}
      </div>

      {!isEditing && hasExistingNotes ? (
        <div>
          {/* Summary Preview */}
          {existingNote.summary && (
            <div className="cne-section">
              <span className="cne-label">Shared Legal Summary (Visible to Client)</span>
              <div className="cne-readonly-summary">{existingNote.summary}</div>
            </div>
          )}

          {/* Action Items Preview */}
          {Array.isArray(existingNote.actionItems) && existingNote.actionItems.length > 0 && (
            <div className="cne-section">
              <span className="cne-label">Shared Next Steps &amp; Action Items</span>
              <ul className="cne-checklist">
                {existingNote.actionItems.map((item, idx) => (
                  <li key={idx} className="cne-checklist-item">
                    <CheckIcon size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Private Notes Preview */}
          {existingNote.privateNotes && (
            <div className="cne-private-box" style={{ marginTop: 'var(--spacing-4)' }}>
              <div className="cne-private-header">
                <ShieldIcon size={14} />
                <span>Confidential Chamber Remarks (Lawyer-Only)</span>
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', whiteSpace: 'pre-wrap', color: 'var(--color-text)' }}>
                {existingNote.privateNotes}
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSave}>
          {/* Shared Summary */}
          <div className="cne-section">
            <label htmlFor="cneSummary" className="cne-label">
              <span>Shared Legal Summary</span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)' }}>
                {summary.length} / 2000
              </span>
            </label>
            <span className="cne-hint">
              This summary is shared with the client upon completion to provide a clear record of advice given.
            </span>
            <textarea
              id="cneSummary"
              rows={4}
              maxLength={2000}
              placeholder="Record legal advice, statutory citations (e.g. Partition Act 1893, CPC Order 39), and findings..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="cne-textarea"
            />
          </div>

          {/* Action Items */}
          <div className="cne-section">
            <label className="cne-label">
              <span>Action Items &amp; Next Steps for Client</span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-subtle)' }}>
                {actionItems.filter((i) => i.trim()).length} / 20 items
              </span>
            </label>
            <span className="cne-hint">
              Concrete steps for the client (e.g., procure certified registry from sub-registrar, produce death certificate).
            </span>

            <div className="cne-action-list">
              {actionItems.map((item, idx) => (
                <div key={idx} className="cne-action-row">
                  <input
                    type="text"
                    maxLength={300}
                    placeholder={`Action step #${idx + 1}`}
                    value={item}
                    onChange={(e) => handleActionItemChange(idx, e.target.value)}
                    className="cne-action-input"
                  />
                  {actionItems.length > 1 && (
                    <button
                      type="button"
                      className="cne-remove-btn"
                      onClick={() => handleRemoveActionItem(idx)}
                      title="Remove action step"
                      aria-label="Remove item"
                    >
                      <CloseIcon size={16} />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="btn btn-secondary btn-sm cne-add-btn"
                onClick={handleAddActionItem}
              >
                + Add Another Action Step
              </button>
            </div>
          </div>

          {/* Private Notes */}
          <div className="cne-private-box">
            <div className="cne-private-header">
              <ShieldIcon size={14} />
              <span>Chamber Private Notes (Strictly Confidential)</span>
            </div>
            <span className="cne-hint" style={{ display: 'block', marginBottom: 'var(--spacing-2)' }}>
              These private thoughts and strategy notes are NEVER visible to the client or counterparty.
            </span>
            <textarea
              id="cnePrivateNotes"
              rows={3}
              maxLength={5000}
              placeholder="Private trial strategy, limitation risks, witness credibility assessments..."
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
              className="cne-textarea"
              style={{ backgroundColor: '#ffffff' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-5)' }}>
            {hasExistingNotes && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving}
            >
              {saving ? 'Saving Notes...' : 'Save Consultation Notes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

ConsultationNotesEditor.propTypes = {
  booking: PropTypes.object.isRequired,
  isLawyer: PropTypes.bool.isRequired,
  onNotesSaved: PropTypes.func,
};

export default ConsultationNotesEditor;
