import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import EmptyState from '../components/EmptyState';
import { DocumentIcon, BriefcaseIcon, SearchIcon, ShieldIcon, ClockIcon } from '../components/Icons';
import lawyerApi from '../api/lawyer.api';
import bookingApi from '../api/booking.api';
import engagementApi from '../api/engagement.api';
import caseApi from '../api/case.api';
import notificationApi from '../api/notification.api';
import { ROLES, APPLICATION_STATUS } from '../constants';

export const Dashboard = () => {
  const { user } = useAuth();

  // Lawyer Application real data state
  const [application, setApplication] = useState(null);
  const [appLoading, setAppLoading] = useState(false);
  const [appError, setAppError] = useState(null);

  // Appointments & Engagements real metrics data state
  const [appointments, setAppointments] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Case & Hearing real metrics
  const [caseMetrics, setCaseMetrics] = useState({
    totalCases: 0,
    upcomingHearings: 0,
    unreadNotifications: 0,
  });

  useEffect(() => {
    let isMounted = true;

    if (user?.role === ROLES.LAWYER) {
      setAppLoading(true);
      setAppError(null);

      lawyerApi
        .getApplication()
        .then((res) => {
          if (isMounted) {
            setApplication(res?.application || res?.data?.application || res || null);
          }
        })
        .catch((err) => {
          if (isMounted) {
            // 404 means the lawyer hasn't submitted an application yet
            if (err.status === 404 || err.response?.status === 404) {
              setApplication(null);
            } else {
              setAppError(err.message || 'Failed to fetch application status.');
            }
          }
        })
        .finally(() => {
          if (isMounted) setAppLoading(false);
        });

      // Load appointments and engagements for advocate
      setLoadingAppointments(true);
      Promise.allSettled([
        bookingApi.getLawyerAppointments({ page: 1, limit: 100 }),
        engagementApi.getEngagements({ page: 1, limit: 100 }),
      ]).then(([aptsRes, engsRes]) => {
        if (!isMounted) return;
        if (aptsRes.status === 'fulfilled') {
          const val = aptsRes.value;
          const list =
            val?.items ||
            val?.bookings ||
            val?.data?.items ||
            val?.data?.bookings ||
            (Array.isArray(val) ? val : []);
          setAppointments(Array.isArray(list) ? list : []);
        }
        if (engsRes.status === 'fulfilled') {
          const val = engsRes.value;
          const list =
            val?.engagements ||
            val?.items ||
            val?.data?.engagements ||
            val?.data?.items ||
            (Array.isArray(val) ? val : []);
          setEngagements(Array.isArray(list) ? list : []);
        }
        setLoadingAppointments(false);
      });
    } else if (user?.role === ROLES.CLIENT) {
      // Load appointments and engagements for citizen client
      setLoadingAppointments(true);
      Promise.allSettled([
        bookingApi.getClientBookings({ page: 1, limit: 100 }),
        engagementApi.getEngagements({ page: 1, limit: 100 }),
      ]).then(([aptsRes, engsRes]) => {
        if (!isMounted) return;
        if (aptsRes.status === 'fulfilled') {
          const val = aptsRes.value;
          const list =
            val?.items ||
            val?.bookings ||
            val?.data?.items ||
            val?.data?.bookings ||
            (Array.isArray(val) ? val : []);
          setAppointments(Array.isArray(list) ? list : []);
        }
        if (engsRes.status === 'fulfilled') {
          const val = engsRes.value;
          const list =
            val?.engagements ||
            val?.items ||
            val?.data?.engagements ||
            val?.data?.items ||
            (Array.isArray(val) ? val : []);
          setEngagements(Array.isArray(list) ? list : []);
        }
        setLoadingAppointments(false);
      });
    }

    // Load Phase 3 Case & Hearing statistics for authenticated advocate or client
    if (user?.role === ROLES.LAWYER || user?.role === ROLES.CLIENT) {
      Promise.allSettled([
        caseApi.listCases({ page: 1, limit: 1 }),
        caseApi.listHearingsAcrossCases({ from: new Date().toISOString() }),
        notificationApi.getUnreadCount(),
      ]).then(([casesRes, hearingsRes, notifsRes]) => {
        if (!isMounted) return;
        let totalCases = 0;
        let upcomingHearings = 0;
        let unreadNotifications = 0;

        if (casesRes.status === 'fulfilled') {
          const val = casesRes.value;
          totalCases =
            val?.pagination?.total ||
            val?.data?.total ||
            (Array.isArray(val?.items) ? val.items.length : 0);
        }
        if (hearingsRes.status === 'fulfilled') {
          const val = hearingsRes.value;
          const list =
            val?.data ||
            val?.hearings ||
            (Array.isArray(val) ? val : []);
          upcomingHearings = Array.isArray(list) ? list.length : 0;
        }
        if (notifsRes.status === 'fulfilled') {
          unreadNotifications = notifsRes.value?.count || 0;
        }

        setCaseMetrics({
          totalCases,
          upcomingHearings,
          unreadNotifications,
        });
      });
    }

    return () => {
      isMounted = false;
    };
  }, [user?.role]);

  // Derived metrics calculations
  const lawyerMetrics = {
    pending: appointments.filter((a) => a.status === 'requested' || a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    revenue: appointments
      .filter((a) => a.status === 'paid' || a.status === 'completed')
      .reduce((sum, a) => sum + (Number(a.feePkr) || 0), 0),
    activeEngagements: engagements.filter((e) => e.status === 'active').length,
  };

  const clientMetrics = {
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    accepted: appointments.filter((a) => a.status === 'accepted').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    total: appointments.length,
    activeEngagements: engagements.filter((e) => e.status === 'active').length,
  };

  return (
    <div className="dashboard-page">
      <PageHeader
        title="Dashboard"
        subtitle={`Assalam-o-Alaikum, ${user?.name || 'User'}. Welcome to your LegalHub portal.`}
        badge={<StatusChip status={user?.role} />}
        actions={
          <Link to="/lawyers" className="btn btn-secondary btn-sm">
            Browse Directory
          </Link>
        }
      />

      {/* =========================================================================
          1. ADVOCATE PORTAL (REAL API DRIVEN DATA)
          ========================================================================= */}
      {user?.role === ROLES.LAWYER && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          {appLoading ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-2)' }}>
                <ClockIcon size={28} color="var(--color-primary)" />
              </div>
              <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                Loading verified Bar Council licensing records...
              </p>
            </div>
          ) : appError ? (
            <div className="card" style={{ borderColor: 'var(--color-border-error)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--color-danger)' }}>
                <ShieldIcon size={16} color="var(--color-danger)" />
                <strong>Unable to load application details:</strong>
              </div>
              <p style={{ margin: 'var(--spacing-2) 0 0 0', color: 'var(--color-text-muted)' }}>{appError}</p>
            </div>
          ) : !application ? (
            <EmptyState
              icon={<DocumentIcon size={44} color="var(--color-primary)" />}
              title="No Bar Council Application on Record"
              description="To be published to the public legal directory, you must submit your Bar Council licensing credentials for administrative audit."
              action={
                <Link to="/lawyer/application" className="btn btn-primary">
                  Submit Bar Council Application
                </Link>
              }
            />
          ) : (
            <div
              className="card"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderLeft: `4px solid ${
                  application.status === APPLICATION_STATUS.APPROVED
                    ? 'var(--color-success)'
                    : application.status === APPLICATION_STATUS.REJECTED
                    ? 'var(--color-danger)'
                    : 'var(--color-warning)'
                }`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 'var(--spacing-3)',
                  marginBottom: 'var(--spacing-4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                  <DocumentIcon size={22} color="var(--color-primary)" />
                  <h3 style={{ margin: 0 }}>Bar Council Licensing Status</h3>
                </div>
                <StatusChip status={application.status} />
              </div>

              {/* Status Explanation Alert */}
              {application.status === APPLICATION_STATUS.REJECTED && (
                <div
                  className="alert alert-danger"
                  style={{
                    backgroundColor: 'var(--color-danger-light)',
                    borderLeft: '4px solid var(--color-danger)',
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--spacing-4)',
                  }}
                  role="alert"
                >
                  <strong style={{ color: 'var(--color-danger)', display: 'block', marginBottom: 'var(--spacing-1)' }}>
                    Action Required — Scrutiny Rejection Notice:
                  </strong>
                  <span style={{ color: 'var(--color-text)' }}>
                    {application.rejectionReason || 'Please review your credentials and re-submit.'}
                  </span>
                </div>
              )}

              {application.status === APPLICATION_STATUS.PENDING && (
                <div
                  style={{
                    backgroundColor: 'var(--color-warning-light)',
                    borderLeft: '4px solid var(--color-warning)',
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--spacing-4)',
                    fontSize: 'var(--font-size-sm)',
                    color: '#92400e',
                  }}
                >
                  Your submitted credentials are queued for verification by a court administrator. You will be notified once reviewed.
                </div>
              )}

              {application.status === APPLICATION_STATUS.APPROVED && (
                <div
                  style={{
                    backgroundColor: 'var(--color-success-light)',
                    borderLeft: '4px solid var(--color-success)',
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--spacing-4)',
                    fontSize: 'var(--font-size-sm)',
                    color: '#166534',
                  }}
                >
                  Your credentials have been verified by administrators. Your profile is visible in the public legal directory.
                </div>
              )}

              {/* Verified Application Attributes */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 'var(--spacing-3)',
                  padding: 'var(--spacing-3)',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--spacing-4)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <div>
                  <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-xs)' }}>
                    Bar Council:
                  </span>
                  <strong>{application.barCouncil || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-xs)' }}>
                    Enrolment Number:
                  </span>
                  <code>{application.enrolmentNo || 'N/A'}</code>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-xs)' }}>
                    Court Jurisdiction:
                  </span>
                  <strong>{application.courtLevel || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-xs)' }}>
                    Station / City:
                  </span>
                  <strong>{application.city || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-xs)' }}>
                    Experience:
                  </span>
                  <strong>{application.experienceYears ? `${application.experienceYears} Years` : 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-xs)' }}>
                    Practice Areas:
                  </span>
                  <strong>
                    {Array.isArray(application.practiceAreas) && application.practiceAreas.length > 0
                      ? application.practiceAreas.join(', ')
                      : 'None specified'}
                  </strong>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                {application.status === APPLICATION_STATUS.APPROVED && (
                  <Link to="/lawyer/profile" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <BriefcaseIcon size={14} />
                    <span>Manage Chamber Profile &amp; Fees</span>
                  </Link>
                )}
                <Link
                  to="/lawyer/application"
                  className={`btn ${application.status === APPLICATION_STATUS.APPROVED ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                >
                  {application.status === APPLICATION_STATUS.REJECTED
                    ? 'Update & Re-Submit Application'
                    : 'View Application Details'}
                </Link>
                <Link to="/bookings" className="btn btn-secondary btn-sm">
                  View All Appointments
                </Link>
              </div>
            </div>
          )}

          {/* Advocate Connected Cases & Cause List Panel */}
          <div className="card" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
              <div>
                <h3 style={{ margin: 0 }}>Active Litigation &amp; Court Cause List</h3>
                <p style={{ margin: 'var(--spacing-1) 0 0 0', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                  Connected case dossiers, upcoming court hearings, and pending procedural alerts.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                <Link to="/cases/new" className="btn btn-primary btn-sm">
                  + New Case File
                </Link>
                <Link to="/cases" className="btn btn-secondary btn-sm">
                  All Case Files
                </Link>
                <Link to="/calendar" className="btn btn-secondary btn-sm">
                  Court Calendar
                </Link>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-3)',
              }}
            >
              <Link
                to="/cases"
                style={{
                  textDecoration: 'none',
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#1e40af', fontWeight: 600 }}>Active Case Files</span>
                <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#1d4ed8' }}>{caseMetrics.totalCases}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#1e40af' }}>Dossiers in chamber</span>
              </Link>

              <Link
                to="/calendar"
                style={{
                  textDecoration: 'none',
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#92400e', fontWeight: 600 }}>Upcoming Hearings</span>
                <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#b45309' }}>{caseMetrics.upcomingHearings}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#92400e' }}>Fixed on cause list</span>
              </Link>

              <Link
                to="/notifications"
                style={{
                  textDecoration: 'none',
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#f5f3ff',
                  border: '1px solid #ddd6fe',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#5b21b6', fontWeight: 600 }}>Unread Alerts</span>
                <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#6d28d9' }}>{caseMetrics.unreadNotifications}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#5b21b6' }}>Case &amp; booking notices</span>
              </Link>
            </div>
          </div>

          {/* Advocate Real Practice Analytics & Quick Actions */}
          <div className="card" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
              <div>
                <h3 style={{ margin: 0 }}>Chamber Appointments &amp; Practice Metrics</h3>
                <p style={{ margin: 'var(--spacing-1) 0 0 0', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                  Real-time consultation activity, revenue, and ongoing legal engagements.
                </p>
              </div>
              <Link to="/bookings" className="btn btn-secondary btn-sm">
                Open Appointments Manager
              </Link>
            </div>

            {/* Metric KPI Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: 'var(--spacing-3)',
                marginBottom: 'var(--spacing-5)',
              }}
            >
              <div style={{ padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#92400e', fontWeight: 600, display: 'block' }}>Pending Requests</span>
                <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#b45309' }}>{lawyerMetrics.pending}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#92400e', display: 'block', marginTop: '4px' }}>Awaiting chamber review</span>
              </div>

              <div style={{ padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#1e40af', fontWeight: 600, display: 'block' }}>Confirmed Sessions</span>
                <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#1d4ed8' }}>{lawyerMetrics.confirmed}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#1e40af', display: 'block', marginTop: '4px' }}>Ready for consultation</span>
              </div>

              <div style={{ padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#166534', fontWeight: 600, display: 'block' }}>Completed</span>
                <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#15803d' }}>{lawyerMetrics.completed}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#166534', display: 'block', marginTop: '4px' }}>Notes &amp; advice issued</span>
              </div>

              <div style={{ padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#6b21a8', fontWeight: 600, display: 'block' }}>Chamber Revenue</span>
                <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: '#7e22ce' }}>PKR {lawyerMetrics.revenue.toLocaleString()}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#6b21a8', display: 'block', marginTop: '4px' }}>Collected fees</span>
              </div>

              <div style={{ padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#334155', fontWeight: 600, display: 'block' }}>Active Engagements</span>
                <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#0f172a' }}>{lawyerMetrics.activeEngagements}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#64748b', display: 'block', marginTop: '4px' }}>Formal representation</span>
              </div>
            </div>

            {/* Recent Appointments Quick Action List */}
            <h4 style={{ margin: '0 0 var(--spacing-3) 0', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-subtle)' }}>
              Recent Consultation Appointments
            </h4>
            {loadingAppointments ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>Loading appointments...</p>
            ) : appointments.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>No consultation appointments recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                {appointments.slice(0, 4).map((apt) => (
                  <div
                    key={apt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--spacing-3)',
                      backgroundColor: 'var(--color-bg)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                      flexWrap: 'wrap',
                      gap: 'var(--spacing-2)',
                    }}
                  >
                    <div>
                      <strong>{apt.client?.name || 'Citizen Client'}</strong>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'flex', gap: 'var(--spacing-2)', marginTop: '2px' }}>
                        <span>{new Date(apt.startsAt).toLocaleString('en-PK', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'short' })}</span>
                        <span>•</span>
                        <span>Mode: {apt.mode?.toUpperCase()}</span>
                        <span>•</span>
                        <span>PKR {apt.feePkr}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                      <StatusChip status={apt.status} size="sm" />
                      <Link to={`/bookings/${apt.id}`} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: 'var(--font-size-xs)' }}>
                        Manage
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          2. CITIZEN / CLIENT PORTAL (REAL API DRIVEN DATA)
          ========================================================================= */}
      {user?.role === ROLES.CLIENT && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          {/* Action Required Alert for Accepted Consultations */}
          {clientMetrics.accepted > 0 && (
            <div
              className="alert"
              style={{
                backgroundColor: '#fffbeb',
                borderLeft: '4px solid #f59e0b',
                padding: 'var(--spacing-4)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--spacing-3)',
              }}
            >
              <div>
                <strong style={{ color: '#b45309', display: 'block', fontSize: 'var(--font-size-md)' }}>
                  Action Required: Advocate Accepted Your Consultation
                </strong>
                <span style={{ color: '#92400e', fontSize: 'var(--font-size-sm)' }}>
                  You have {clientMetrics.accepted} appointment(s) awaiting payment. Please complete sandbox payment to confirm your scheduled slot.
                </span>
              </div>
              <Link to="/bookings?status=accepted" className="btn btn-primary btn-sm">
                Complete Payment Now
              </Link>
            </div>
          )}

          {/* Citizen Connected Cases & Cause List Panel */}
          <div className="card" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
              <div>
                <h3 style={{ margin: 0 }}>My Active Lawsuits &amp; Court Schedule</h3>
                <p style={{ margin: 'var(--spacing-1) 0 0 0', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                  Transparent timeline, shared documents, and upcoming hearing dates.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                <Link to="/cases" className="btn btn-secondary btn-sm">
                  View My Case Files
                </Link>
                <Link to="/calendar" className="btn btn-secondary btn-sm">
                  Court Hearing Calendar
                </Link>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-3)',
              }}
            >
              <Link
                to="/cases"
                style={{
                  textDecoration: 'none',
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#1e40af', fontWeight: 600 }}>Active Case Files</span>
                <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#1d4ed8' }}>{caseMetrics.totalCases}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#1e40af' }}>Represented matters</span>
              </Link>

              <Link
                to="/calendar"
                style={{
                  textDecoration: 'none',
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#92400e', fontWeight: 600 }}>Upcoming Court Dates</span>
                <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#b45309' }}>{caseMetrics.upcomingHearings}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#92400e' }}>Upcoming appearances</span>
              </Link>

              <Link
                to="/notifications"
                style={{
                  textDecoration: 'none',
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#f5f3ff',
                  border: '1px solid #ddd6fe',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#5b21b6', fontWeight: 600 }}>Pending Alerts</span>
                <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#6d28d9' }}>{caseMetrics.unreadNotifications}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#5b21b6' }}>Unread notifications</span>
              </Link>
            </div>
          </div>

          {/* Citizen Metrics Grid */}
          <div className="card" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
              <div>
                <h3 style={{ margin: 0 }}>My Consultations &amp; Legal Engagements</h3>
                <p style={{ margin: 'var(--spacing-1) 0 0 0', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                  Track your scheduled appointments, consultation notes, and ongoing legal cases.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                <Link to="/lawyers" className="btn btn-primary btn-sm">
                  Find an Advocate
                </Link>
                <Link to="/bookings" className="btn btn-secondary btn-sm">
                  My Bookings
                </Link>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 'var(--spacing-3)',
                marginBottom: 'var(--spacing-5)',
              }}
            >
              <div style={{ padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#1e40af', fontWeight: 600, display: 'block' }}>Upcoming Sessions</span>
                <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#1d4ed8' }}>{clientMetrics.confirmed}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#1e40af', display: 'block', marginTop: '4px' }}>Confirmed on calendar</span>
              </div>

              <div style={{ padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#92400e', fontWeight: 600, display: 'block' }}>Payment Pending</span>
                <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#b45309' }}>{clientMetrics.accepted}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#92400e', display: 'block', marginTop: '4px' }}>Awaiting your payment</span>
              </div>

              <div style={{ padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#166534', fontWeight: 600, display: 'block' }}>Completed</span>
                <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#15803d' }}>{clientMetrics.completed}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#166534', display: 'block', marginTop: '4px' }}>With legal action items</span>
              </div>

              <div style={{ padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#6b21a8', fontWeight: 600, display: 'block' }}>Active Engagements</span>
                <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#7e22ce' }}>{clientMetrics.activeEngagements}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: '#6b21a8', display: 'block', marginTop: '4px' }}>Formal representation</span>
              </div>
            </div>

            {/* Quick Action Appointments List */}
            <h4 style={{ margin: '0 0 var(--spacing-3) 0', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-subtle)' }}>
              Recent Consultations
            </h4>
            {loadingAppointments ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>Loading consultations...</p>
            ) : appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-6) 0' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-3)' }}>
                  You have not scheduled any legal consultations yet.
                </p>
                <Link to="/lawyers" className="btn btn-primary btn-sm">
                  Find an Advocate
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                {appointments.slice(0, 4).map((apt) => (
                  <div
                    key={apt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--spacing-3)',
                      backgroundColor: 'var(--color-bg)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                      flexWrap: 'wrap',
                      gap: 'var(--spacing-2)',
                    }}
                  >
                    <div>
                      <strong>{apt.lawyer?.name || 'Advocate'}</strong>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'flex', gap: 'var(--spacing-2)', marginTop: '2px' }}>
                        <span>{new Date(apt.startsAt).toLocaleString('en-PK', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'short' })}</span>
                        <span>•</span>
                        <span>Mode: {apt.mode?.toUpperCase()}</span>
                        <span>•</span>
                        <span>PKR {apt.feePkr}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                      <StatusChip status={apt.status} size="sm" />
                      <Link to={`/bookings/${apt.id}`} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: 'var(--font-size-xs)' }}>
                        {apt.status === 'accepted' ? 'Pay Fee' : 'View Session'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Find Legal Representation Discovery Card */}
          <div
            className="card"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderLeft: '4px solid var(--color-primary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <SearchIcon size={22} color="var(--color-primary)" />
              <h3 style={{ margin: 0 }}>Need Legal Assistance?</h3>
            </div>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-4)', lineHeight: 1.5 }}>
              Browse practicing advocates across Pakistan's High Court benches and District Courts. Filter by practice domain, station, and verified licensing credentials.
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
              <Link to="/lawyers" className="btn btn-primary">
                Search Advocate Directory
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. COURT ADMINISTRATOR PORTAL
          ========================================================================= */}
      {user?.role === ROLES.ADMIN && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div
            className="card"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderLeft: '4px solid var(--color-danger)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <ShieldIcon size={22} color="var(--color-danger)" />
              <h3 style={{ margin: 0 }}>Court Administrator Control Center</h3>
            </div>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-4)', lineHeight: 1.5 }}>
              Audit incoming advocate license applications against provincial Bar Council rosters. Approve or reject submissions with constructive explanations.
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
              <Link to="/admin/queue" className="btn btn-primary">
                Open Verification Queue
              </Link>
              <Link to="/bookings" className="btn btn-secondary">
                Audit Consultations
              </Link>
              <Link to="/lawyers" className="btn btn-secondary">
                Audit Public Directory
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. UNIFIED ACCOUNT PROFILE SUMMARY CARD (REAL DATA)
          ========================================================================= */}
      <div className="card" style={{ marginTop: 'var(--spacing-6)' }}>
        <h4 style={{ margin: '0 0 var(--spacing-4) 0' }}>Account Profile Summary</h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--spacing-4)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <div>
            <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-xs)' }}>
              Full Name:
            </span>
            <strong>{user?.name}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-xs)' }}>
              Registered Email:
            </span>
            <strong>{user?.email}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-xs)' }}>
              Account Role:
            </span>
            <StatusChip status={user?.role} size="sm" />
          </div>
          <div>
            <span style={{ color: 'var(--color-text-subtle)', display: 'block', fontSize: 'var(--font-size-xs)' }}>
              Account Identifier (UUID):
            </span>
            <code style={{ fontSize: 'var(--font-size-xs)' }}>{user?.id}</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
