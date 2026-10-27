import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import caseApi from '../api/case.api';
import StatusChip from '../components/StatusChip';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  CourtIcon,
  CalendarIcon,
  ClockIcon,
} from '../components/Icons';
import {
  ROLES,
  CASE_STATUSES,
  CASE_STATUS_LABELS,
  CASE_STAGES,
  CASE_STAGE_LABELS,
} from '../constants';
import CaseEntriesTab from '../components/CaseEntriesTab';
import CaseHearingsTab from '../components/CaseHearingsTab';
import CaseDocumentsTab from '../components/CaseDocumentsTab';
import CaseFeesTab from '../components/CaseFeesTab';
import CaseTimelineTab from '../components/CaseTimelineTab';
import CaseMessagesTab from '../components/CaseMessagesTab';
import './CaseDetail.css';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'entries', label: 'Entries (Diary)' },
  { id: 'hearings', label: 'Hearings' },
  { id: 'documents', label: 'Documents' },
  { id: 'fees', label: 'Fees & Ledger' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'messages', label: 'Messages' },
];

export const CaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isLawyer = user?.role === ROLES.LAWYER;

  // Case Data State
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab State
  const [activeTab, setActiveTab] = useState('overview');

  // Status/Stage Transition State (Lawyer only)
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateMessage, setUpdateMessage] = useState(null);
  const [updateError, setUpdateError] = useState(null);

  const fetchCase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await caseApi.getCaseById(id);
      const data = res?.data;
      setCaseData(data);
      if (data) {
        setSelectedStatus(data.status || 'Prospect');
        setSelectedStage(data.stage || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve case file. You may not have permission to view this file.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  const handleStatusStageSubmit = (e) => {
    e.preventDefault();
    setUpdateMessage(null);
    setUpdateError(null);

    // If no changes, ignore
    if (selectedStatus === caseData?.status && selectedStage === (caseData?.stage || '')) {
      setUpdateMessage('No changes detected in status or stage.');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmStatusChange = async () => {
    setUpdatingStatus(true);
    setUpdateError(null);
    setUpdateMessage(null);

    try {
      const payload = {
        status: selectedStatus,
        stage: selectedStage || null,
      };
      const res = await caseApi.updateCase(id, payload);
      const updated = res?.data;
      setCaseData(updated);
      setSelectedStatus(updated?.status || selectedStatus);
      setSelectedStage(updated?.stage || selectedStage);
      setUpdateMessage('Case procedural status and stage successfully updated.');
    } catch (err) {
      setUpdateError(err.message || 'Failed to update case status. Please try again.');
    } finally {
      setUpdatingStatus(false);
      setShowConfirmModal(false);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'Not recorded';
    try {
      return new Date(isoStr).toLocaleDateString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return 'Not scheduled';
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

  if (loading) {
    return (
      <div className="case-detail-page">
        <div style={{ textAlign: 'center', padding: 'var(--spacing-16)', color: 'var(--color-text-muted)' }}>
          Loading confidential case file (*Basta*)...
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="case-detail-page">
        <Link to="/cases" className="case-detail-back">
          ← Back to Cases List
        </Link>
        <div
          style={{
            backgroundColor: 'var(--color-danger-light, #fee2e2)',
            border: '1px solid var(--color-danger, #ef4444)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-6)',
            color: 'var(--color-danger-dark, #991b1b)',
            marginTop: 'var(--spacing-4)',
          }}
        >
          <h2 style={{ margin: '0 0 var(--spacing-2) 0', fontSize: 'var(--font-size-lg)' }}>
            Unable to Access Case File
          </h2>
          <p style={{ margin: '0 0 var(--spacing-4) 0', fontSize: 'var(--font-size-sm)' }}>
            {error || 'The requested case file was not found or is restricted.'}
          </p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/cases')}>
            Return to Cases
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="case-detail-page">
      {/* Navigation Breadcrumb */}
      <Link to="/cases" className="case-detail-back">
        ← Back to Cases List
      </Link>

      {/* Case Header Banner */}
      <header className="case-banner">
        <div className="case-banner__top">
          <div className="case-banner__title-group">
            <h1 className="case-banner__title">{caseData.title}</h1>
            <div className="case-banner__badges">
              <StatusChip status={caseData.status} />
              <span className="case-banner__pill">{caseData.practiceArea}</span>
              {caseData.stage && (
                <span className="case-banner__pill">
                  Stage: <strong>{caseData.stage}</strong>
                </span>
              )}
            </div>
          </div>

          {caseData.nextHearing && (
            <div className="case-banner__next-hearing-card">
              <ClockIcon size={18} />
              <div>
                <div style={{ fontWeight: 'var(--font-weight-bold)' }}>
                  Next Hearing: {formatDateTime(caseData.nextHearing.scheduledAt)}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.9 }}>
                  {caseData.nextHearing.court || caseData.court} {caseData.nextHearing.bench ? `(${caseData.nextHearing.bench})` : ''}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="case-banner__meta-row">
          <div className="case-banner__meta-item">
            <CourtIcon size={16} color="var(--color-primary)" />
            <span>{caseData.court}</span>
          </div>

          {caseData.caseOrFirNumber && (
            <div className="case-banner__meta-item">
              <span>Suit / FIR: <strong>{caseData.caseOrFirNumber}</strong></span>
            </div>
          )}

          {caseData.filingDate && (
            <div className="case-banner__meta-item">
              <CalendarIcon size={16} />
              <span>Filing Date: {formatDate(caseData.filingDate)}</span>
            </div>
          )}

          {isLawyer && caseData.client && (
            <div className="case-banner__meta-item">
              <span>Client: <strong>{caseData.client.name}</strong></span>
            </div>
          )}
        </div>
      </header>

      {/* Case Workspace Navigation Tabs */}
      <nav className="case-tabs" aria-label="Case navigation tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`case-tab-btn ${activeTab === tab.id ? 'case-tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.label}</span>
            {tab.badge && <span className="case-tab-btn__badge">{tab.badge}</span>}
          </button>
        ))}
      </nav>

      {/* Tab Panels */}
      <div className="case-tab-content">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="case-overview-grid">
            {/* Left Column: Case Record Details & Parties */}
            <div className="case-overview-col">
              {/* Detailed Matter Information */}
              <div className="case-card-panel">
                <h2 className="case-card-panel__title">Case Record Details</h2>
                <div className="case-detail-fields-list">
                  <div className="case-detail-field-item">
                    <span className="case-detail-field-label">Litigation Title</span>
                    <span className="case-detail-field-val">{caseData.title}</span>
                  </div>

                  <div className="case-detail-field-item">
                    <span className="case-detail-field-label">Practice Area</span>
                    <span className="case-detail-field-val">{caseData.practiceArea}</span>
                  </div>

                  <div className="case-detail-field-item">
                    <span className="case-detail-field-label">Judicial Forum</span>
                    <span className="case-detail-field-val">{caseData.court}</span>
                  </div>

                  <div className="case-detail-field-item">
                    <span className="case-detail-field-label">Case / FIR Number</span>
                    <span className="case-detail-field-val">{caseData.caseOrFirNumber || 'None recorded'}</span>
                  </div>

                  <div className="case-detail-field-item">
                    <span className="case-detail-field-label">Date of Filing</span>
                    <span className="case-detail-field-val">{formatDate(caseData.filingDate)}</span>
                  </div>

                  <div className="case-detail-field-item">
                    <span className="case-detail-field-label">Current Status</span>
                    <span className="case-detail-field-val">
                      {CASE_STATUS_LABELS[caseData.status] || caseData.status}
                    </span>
                  </div>

                  <div className="case-detail-field-item">
                    <span className="case-detail-field-label">Current Stage</span>
                    <span className="case-detail-field-val">
                      {CASE_STAGE_LABELS[caseData.stage] || caseData.stage || 'Not assigned'}
                    </span>
                  </div>

                  <div className="case-detail-field-item">
                    <span className="case-detail-field-label">Record Created</span>
                    <span className="case-detail-field-val">{formatDate(caseData.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Litigant Parties */}
              <div className="case-card-panel">
                <h2 className="case-card-panel__title">
                  <span>Litigant Parties</span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)', fontWeight: 'normal' }}>
                    {caseData.parties?.length || 0} registered
                  </span>
                </h2>

                {Array.isArray(caseData.parties) && caseData.parties.length > 0 ? (
                  <div className="case-parties-list">
                    {caseData.parties.map((p, pIdx) => (
                      <div key={p.id || pIdx} className="case-party-item">
                        <span className="case-party-name">{p.name}</span>
                        <span className="case-party-role">{p.roleLabel}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--color-text-subtle)', fontStyle: 'italic', margin: 0, fontSize: 'var(--font-size-sm)' }}>
                    No specific litigant parties recorded for this matter.
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Status / Stage Editor (Lawyer) & Audit History */}
            <div className="case-overview-col">
              {/* Status & Stage Editor (Lawyer Only) */}
              {isLawyer && (
                <div className="case-card-panel">
                  <h2 className="case-card-panel__title">Procedural Status Transition</h2>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
                    Update the case status or procedural stage. Any change automatically records an immutable audit log.
                  </p>

                  {updateMessage && (
                    <div
                      style={{
                        backgroundColor: 'var(--color-success-light, #dcfce7)',
                        border: '1px solid var(--color-success, #22c55e)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--spacing-2) var(--spacing-3)',
                        color: 'var(--color-success-dark, #15803d)',
                        fontSize: 'var(--font-size-xs)',
                      }}
                    >
                      {updateMessage}
                    </div>
                  )}

                  {updateError && (
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
                      {updateError}
                    </div>
                  )}

                  <form className="case-status-editor" onSubmit={handleStatusStageSubmit}>
                    <div className="new-case-field">
                      <label htmlFor="edit-status">Case Status</label>
                      <select
                        id="edit-status"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                      >
                        {CASE_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {CASE_STATUS_LABELS[st] || st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="new-case-field">
                      <label htmlFor="edit-stage">Procedural Stage</label>
                      <select
                        id="edit-stage"
                        value={selectedStage}
                        onChange={(e) => setSelectedStage(e.target.value)}
                      >
                        <option value="">No Stage Assigned</option>
                        {CASE_STAGES.map((stg) => (
                          <option key={stg} value={stg}>
                            {CASE_STAGE_LABELS[stg] || stg}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={updatingStatus}
                      style={{ marginTop: 'var(--spacing-2)' }}
                    >
                      {updatingStatus ? 'Recording Transition...' : 'Update Status & Stage'}
                    </button>
                  </form>
                </div>
              )}

              {/* Status Audit Log (Lawyer Only) */}
              {isLawyer && Array.isArray(caseData.statusEvents) && caseData.statusEvents.length > 0 && (
                <div className="case-card-panel">
                  <h2 className="case-card-panel__title">Procedural Audit History</h2>
                  <div className="case-audit-timeline">
                    {caseData.statusEvents.map((event) => (
                      <div key={event.id} className="case-audit-item">
                        <span className="case-audit-header">
                          Status: {event.fromStatus ? `${event.fromStatus} → ` : ''}
                          <strong>{event.toStatus}</strong>
                          {event.toStage ? ` (${event.toStage})` : ''}
                        </span>
                        <span className="case-audit-time">{formatDateTime(event.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Client Portal Disclaimer (Client View Only) */}
              {!isLawyer && (
                <div className="case-card-panel">
                  <h2 className="case-card-panel__title">Client Notice</h2>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                    This case record is maintained by your assigned advocate. Any upcoming hearing dates, procedural stage updates, and shared documents are reflected here in real time.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ENTRIES (DIARY) */}
        {activeTab === 'entries' && (
          <CaseEntriesTab caseId={caseData.id} isLawyer={isLawyer} />
        )}

        {/* TAB 3: HEARINGS */}
        {activeTab === 'hearings' && (
          <CaseHearingsTab
            caseData={caseData}
            isLawyer={isLawyer}
            onHearingUpdated={fetchCase}
          />
        )}

        {/* TAB 4: DOCUMENTS */}
        {activeTab === 'documents' && (
          <CaseDocumentsTab
            caseId={caseData.id}
            isLawyer={isLawyer}
          />
        )}

        {/* TAB 5: FEES & LEDGER */}
        {activeTab === 'fees' && (
          <CaseFeesTab
            caseId={caseData.id}
            isLawyer={isLawyer}
          />
        )}

        {/* TAB 6: TIMELINE */}
        {activeTab === 'timeline' && (
          <CaseTimelineTab
            caseId={caseData.id}
            isLawyer={isLawyer}
          />
        )}

        {/* TAB 7: MESSAGES */}
        {activeTab === 'messages' && (
          <CaseMessagesTab
            caseId={caseData.id}
            isLawyer={isLawyer}
          />
        )}
      </div>

      {/* Confirmation Dialog for Status & Stage Transition */}
      <ConfirmDialog
        isOpen={showConfirmModal}
        title="Confirm Procedural Status Transition"
        message={`Are you sure you want to transition this case file to Status: '${selectedStatus}' and Stage: '${selectedStage || 'None'}'? An immutable audit log entry will be created in the case history.`}
        confirmText="Confirm Transition"
        cancelText="Cancel"
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
};

export default CaseDetail;
