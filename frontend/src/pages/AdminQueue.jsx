import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/admin.api';
import StatusBadge from '../components/StatusBadge';
import { APPLICATION_STATUS } from '../constants';

export const AdminQueue = () => {
  const [activeTab, setActiveTab] = useState(APPLICATION_STATUS.PENDING);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Reject Modal State
  const [rejectingApp, setRejectingApp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState(null);

  // Fetch applications matching active tab filter
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const response = await adminApi.getApplications(
        activeTab === 'all' ? undefined : activeTab
      );
      if (response && response.data && response.data.applications) {
        setApplications(response.data.applications);
      } else {
        setApplications([]);
      }
    } catch (error) {
      setFeedback({ type: 'danger', message: error.message || 'Failed to load applications' });
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Handle 1-click Approval
  const handleApprove = async (id, advocateName) => {
    if (!window.confirm(`Are you sure you want to approve Advocate ${advocateName}? This will publish their profile to the public directory.`)) {
      return;
    }

    setActionLoadingId(id);
    setFeedback(null);
    try {
      await adminApi.approveApplication(id);
      setFeedback({
        type: 'success',
        message: `Advocate ${advocateName} has been approved and published to the public directory.`,
      });
      // Refresh queue
      await fetchApplications();
    } catch (error) {
      setFeedback({
        type: 'danger',
        message: error.message || 'Failed to approve application',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open rejection modal
  const openRejectModal = (app) => {
    setRejectingApp(app);
    setRejectionReason('');
    setRejectError(null);
  };

  const closeRejectModal = () => {
    setRejectingApp(null);
    setRejectionReason('');
    setRejectError(null);
  };

  // Submit Rejection with >= 10 character explanation
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (rejectionReason.trim().length < 10) {
      setRejectError('Rejection reason must be at least 10 characters long to provide constructive guidance.');
      return;
    }

    setActionLoadingId(rejectingApp.id);
    setRejectError(null);
    try {
      await adminApi.rejectApplication(rejectingApp.id, rejectionReason.trim());
      setFeedback({
        type: 'warning',
        message: `Application for ${rejectingApp.user?.name || 'Advocate'} has been rejected with notice.`,
      });
      closeRejectModal();
      await fetchApplications();
    } catch (error) {
      setRejectError(error.message || 'Failed to reject application');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          <span style={{ fontSize: '1.75rem' }}>🛡️</span>
          <h1>Court Administrator Scrutiny Queue</h1>
        </div>
        <p>Audit and verify provincial Bar Council license claims before publishing to the public registry.</p>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type}`} role="alert">
          {feedback.message}
        </div>
      )}

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-2)',
          marginBottom: 'var(--spacing-6)',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 'var(--spacing-2)',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setActiveTab(APPLICATION_STATUS.PENDING)}
          className={`btn btn-sm ${activeTab === APPLICATION_STATUS.PENDING ? 'btn-primary' : 'btn-secondary'}`}
        >
          ⏳ Pending Scrutiny
        </button>
        <button
          onClick={() => setActiveTab(APPLICATION_STATUS.APPROVED)}
          className={`btn btn-sm ${activeTab === APPLICATION_STATUS.APPROVED ? 'btn-primary' : 'btn-secondary'}`}
        >
          ✅ Approved Advocates
        </button>
        <button
          onClick={() => setActiveTab(APPLICATION_STATUS.REJECTED)}
          className={`btn btn-sm ${activeTab === APPLICATION_STATUS.REJECTED ? 'btn-primary' : 'btn-secondary'}`}
        >
          ❌ Rejected Submissions
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
        >
          All Applications
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner spinner-primary" style={{ width: '2.5rem', height: '2.5rem' }} />
          <p>Loading application queue...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-2)' }}>📋</div>
          <h3>No Applications in This Category</h3>
          <p style={{ marginTop: 'var(--spacing-1)' }}>
            There are currently no advocate applications with status &ldquo;{activeTab}&rdquo;.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          {applications.map((app) => (
            <div key={app.id} className="card" style={{ borderLeft: `4px solid ${app.status === 'approved' ? 'var(--color-success)' : app.status === 'rejected' ? 'var(--color-danger)' : 'var(--color-warning)'}` }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 'var(--spacing-3)',
                  marginBottom: 'var(--spacing-3)',
                  borderBottom: '1px solid var(--color-border)',
                  paddingBottom: 'var(--spacing-3)',
                }}
              >
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text)' }}>
                    {app.user?.name || 'Advocate Applicant'}
                  </h3>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)' }}>
                    Email: {app.user?.email} • Applied: {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                  <StatusBadge status={app.status} />
                  {app.status === APPLICATION_STATUS.PENDING && (
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                      <button
                        onClick={() => handleApprove(app.id, app.user?.name || 'Advocate')}
                        disabled={actionLoadingId === app.id}
                        className="btn btn-primary btn-sm"
                        style={{ backgroundColor: 'var(--color-success)' }}
                      >
                        {actionLoadingId === app.id ? <span className="spinner" /> : '✓ Approve'}
                      </button>
                      <button
                        onClick={() => openRejectModal(app)}
                        disabled={actionLoadingId === app.id}
                        className="btn btn-danger btn-sm"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Application Details Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 'var(--spacing-3)',
                  fontSize: 'var(--font-size-xs)',
                  marginBottom: 'var(--spacing-3)',
                }}
              >
                <div>
                  <span style={{ color: 'var(--color-text-subtle)', display: 'block' }}>Bar Council:</span>
                  <strong>{app.barCouncil}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-subtle)', display: 'block' }}>Enrolment License #:</span>
                  <code style={{ fontSize: 'var(--font-size-xs)' }}>{app.enrolmentNo}</code>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-subtle)', display: 'block' }}>Practicing City:</span>
                  <strong>{app.city}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-subtle)', display: 'block' }}>Court Jurisdiction:</span>
                  <strong>{app.courtLevel}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-subtle)', display: 'block' }}>Experience:</span>
                  <strong>{app.experienceYears} Years</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-subtle)', display: 'block' }}>Chamber Location:</span>
                  <span>{app.chamberAddress}</span>
                </div>
              </div>

              {/* Practice Areas */}
              <div style={{ display: 'flex', gap: 'var(--spacing-1)', flexWrap: 'wrap', marginBottom: 'var(--spacing-2)' }}>
                {app.practiceAreas?.map((area) => (
                  <span
                    key={area}
                    style={{
                      backgroundColor: 'var(--color-surface-hover)',
                      border: '1px solid var(--color-border)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    {area}
                  </span>
                ))}
              </div>

              {/* Bio */}
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-2)' }}>
                <strong>Bio:</strong> {app.bio}
              </p>

              {/* Audit Stamps if approved/rejected */}
              {app.reviewedAt && (
                <div
                  style={{
                    marginTop: 'var(--spacing-3)',
                    paddingTop: 'var(--spacing-2)',
                    borderTop: '1px solid var(--color-border)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-subtle)',
                  }}
                >
                  Reviewed on {new Date(app.reviewedAt).toLocaleString()} by Admin (ID: <code>{app.reviewedBy}</code>)
                  {app.rejectionReason && (
                    <div style={{ color: 'var(--color-danger)', marginTop: 'var(--spacing-1)' }}>
                      <strong>Rejection Note:</strong> &ldquo;{app.rejectionReason}&rdquo;
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal Overlay */}
      {rejectingApp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 'var(--spacing-4)',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: 'var(--color-surface)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ marginBottom: 'var(--spacing-4)' }}>
              <h3 style={{ color: 'var(--color-danger)' }}>Reject Advocate Application</h3>
              <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-1)' }}>
                Applicant: <strong>{rejectingApp.user?.name}</strong> ({rejectingApp.enrolmentNo})
              </p>
            </div>

            {rejectError && (
              <div className="alert alert-danger" style={{ fontSize: 'var(--font-size-xs)' }}>
                {rejectError}
              </div>
            )}

            <form onSubmit={handleConfirmReject}>
              <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <label
                  htmlFor="rejectionReason"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: 'var(--spacing-1)',
                  }}
                >
                  <span>
                    Reason for Rejection <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: rejectionReason.trim().length >= 10 ? 'var(--color-success)' : 'var(--color-text-subtle)',
                    }}
                  >
                    {rejectionReason.trim().length} / 10 min characters
                  </span>
                </label>
                <textarea
                  id="rejectionReason"
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this application cannot be approved (e.g. Enrolment number does not match Punjab Bar Council records, or chamber address is incomplete)..."
                  required
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)' }}>
                  This reason will be visible to the advocate so they can rectify their application.
                </span>
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeRejectModal}
                  className="btn btn-secondary"
                  disabled={actionLoadingId === rejectingApp.id}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={actionLoadingId === rejectingApp.id || rejectionReason.trim().length < 10}
                >
                  {actionLoadingId === rejectingApp.id ? (
                    <>
                      <span className="spinner" /> Rejecting...
                    </>
                  ) : (
                    'Confirm Rejection'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQueue;
