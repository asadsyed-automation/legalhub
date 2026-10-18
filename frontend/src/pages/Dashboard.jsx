import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { ROLES } from '../constants';

export const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="page-container">
      {/* Top Welcome Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--spacing-4)',
          marginBottom: 'var(--spacing-8)',
          paddingBottom: 'var(--spacing-4)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <h1>Dashboard</h1>
            <StatusBadge role={user?.role} />
          </div>
          <p style={{ fontSize: 'var(--font-size-base)' }}>
            Assalam-o-Alaikum, <strong>{user?.name}</strong>. Welcome to your LegalHub portal.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
          <Link to="/lawyers" className="btn btn-secondary btn-sm">
            Browse Directory
          </Link>
        </div>
      </div>

      {/* Role-Specific Portal Modules */}
      {user?.role === ROLES.CLIENT && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div
            className="card"
            style={{
              backgroundColor: 'var(--color-primary-light)',
              borderColor: '#BBF7D0',
            }}
          >
            <h3 style={{ color: 'var(--color-primary)' }}>Looking for Legal Representation?</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-4)' }}>
              Explore Pakistan's verified advocate directory. You can filter practitioners by jurisdiction (Lower Courts, High Court, Supreme Court), city (Lahore, Karachi, Islamabad, etc.), and specialized practice areas.
            </p>
            <Link to="/lawyers" className="btn btn-primary">
              Search Legal Directory
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--spacing-4)',
            }}
          >
            <div className="card">
              <h4>1. Search & Filter</h4>
              <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-2)' }}>
                Filter across 15+ major Pakistani cities and specialized legal domains including Corporate, Civil, Criminal, Property, and Family law.
              </p>
            </div>
            <div className="card">
              <h4>2. Verified Credentials</h4>
              <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-2)' }}>
                Only advocates with verified provincial Bar Council licensing are displayed in the public directory.
              </p>
            </div>
            <div className="card">
              <h4>3. Zero Hidden Surprises</h4>
              <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-2)' }}>
                Review court levels, years of legal experience, and professional biographies before reaching out.
              </p>
            </div>
          </div>
        </div>
      )}

      {user?.role === ROLES.LAWYER && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div
            className="card"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderLeft: '4px solid var(--color-primary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <span style={{ fontSize: '1.5rem' }}>📜</span>
              <h3>Bar Council Verification Status</h3>
            </div>
            <p style={{ marginBottom: 'var(--spacing-4)' }}>
              As an advocate on LegalHub, your profile will be published to the public marketplace once your Bar Council credentials have been scrutinized and approved by our administrative team.
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
              <Link to="/lawyer/application" className="btn btn-primary">
                View / Submit Application
              </Link>
              <Link to="/lawyers" className="btn btn-secondary">
                View Public Directory
              </Link>
            </div>
          </div>

          <div className="card">
            <h4>Licensing Compliance Guidelines</h4>
            <ul style={{ paddingLeft: 'var(--spacing-5)', marginTop: 'var(--spacing-3)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
              <li>Ensure your <strong>Bar Council</strong> selection matches your official license card (e.g., Punjab, Sindh, Islamabad Bar Council).</li>
              <li>Enter your exact <strong>Enrolment Number</strong> (e.g. <code>LHC-2024-9871</code>). Duplicate entries under the same council are rejected.</li>
              <li>Select between 1 and 5 <strong>Practice Areas</strong> representing your primary legal specialties.</li>
              <li>If an application is rejected, an administrative explanation will be provided and you can update and re-submit.</li>
            </ul>
          </div>
        </div>
      )}

      {user?.role === ROLES.ADMIN && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div
            className="card"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderLeft: '4px solid var(--color-warning)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <span style={{ fontSize: '1.5rem' }}>🛡️</span>
              <h3>Court Administrator Control Center</h3>
            </div>
            <p style={{ marginBottom: 'var(--spacing-4)' }}>
              You have privileged access to scrutinize and audit advocate applications. Review applicant Bar Council licensing, years of experience, and chamber details before granting verified status.
            </p>
            <Link to="/admin/queue" className="btn btn-primary">
              Open Verification Queue
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 'var(--spacing-4)',
            }}
          >
            <div className="card">
              <h4>Strict Audit Trails</h4>
              <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-2)' }}>
                Every approval or rejection permanently stamps your administrator ID and an immutable timestamp into the audit record.
              </p>
            </div>
            <div className="card">
              <h4>Mandatory Rejection Reasons</h4>
              <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-2)' }}>
                Rejections require a constructive explanation of at least 10 characters so the advocate can rectify their submission.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account Profile Card */}
      <div className="card" style={{ marginTop: 'var(--spacing-8)' }}>
        <h4 style={{ marginBottom: 'var(--spacing-4)' }}>Account Profile Summary</h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--spacing-4)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <div>
            <span style={{ color: 'var(--color-text-subtle)', display: 'block' }}>Account Name:</span>
            <strong>{user?.name}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-subtle)', display: 'block' }}>Registered Email:</span>
            <strong>{user?.email}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-subtle)', display: 'block' }}>Role Category:</span>
            <StatusBadge role={user?.role} />
          </div>
          <div>
            <span style={{ color: 'var(--color-text-subtle)', display: 'block' }}>Account ID:</span>
            <code style={{ fontSize: 'var(--font-size-xs)' }}>{user?.id}</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
