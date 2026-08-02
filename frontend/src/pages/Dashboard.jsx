import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCases } from '../api/caseApi';
import { getNotifications } from '../api/notificationApi';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

// Energetic Vector Icons
const FolderIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 8.07 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
  </svg>
);

const ZapIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const BellIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);

const MessageIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const StoreIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/>
  </svg>
);

const UserIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const BuildingIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
  </svg>
);

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

const listVariants = {
  animate: { transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

/* Skeleton block */
function Skel({ w = '100%', h = '16px', style }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: 'var(--radius-sm)', ...style }} />;
}

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCases(), getNotifications()])
      .then(([c, n]) => { setCases(c); setNotifications(n); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openCases   = cases.filter(c => c.status === 'Open' || c.status === 'In Progress');
  const unreadNotifs = notifications.filter(n => !n.is_read);

  const stats = [
    { label: 'Total Cases', value: cases.length, color: 'var(--color-primary)', bg: 'rgba(15,92,60,0.1)', icon: <FolderIcon /> },
    { label: 'Active Cases', value: openCases.length, color: 'var(--color-warning)', bg: 'rgba(217,119,6,0.1)', icon: <ZapIcon /> },
    { label: 'Unread Alerts', value: unreadNotifs.length, color: 'var(--color-danger)', bg: 'rgba(214,69,69,0.1)', icon: <BellIcon /> },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontFamily: 'var(--font-heading)', fontSize: '22px',
          fontWeight: 700, color: 'var(--color-secondary)', margin: '0 0 4px',
        }}>
          Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Here's an overview of your LegalHub workspace activity.
        </p>
      </div>

      {/* Energetic Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {loading
          ? [1,2,3].map(i => (
              <div key={i} style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                <Skel w="40px" h="40px" style={{ borderRadius: '10px', marginBottom: '12px' }} />
                <Skel w="60%" h="28px" style={{ marginBottom: '6px' }} />
                <Skel w="80%" h="14px" />
              </div>
            ))
          : stats.map((s) => (
              <motion.div
                key={s.label}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  borderTop: `3px solid ${s.color}`,
                }}
              >
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  backgroundColor: s.bg, color: s.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '12px'
                }}>
                  {s.icon}
                </div>
                <p style={{ fontSize: '28px', fontWeight: 800, color: s.color, margin: '0 0 4px', lineHeight: 1 }}>
                  {s.value}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, fontWeight: 600 }}>{s.label}</p>
              </motion.div>
            ))
        }
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <Button onClick={() => navigate('/cases')} style={{ marginTop: 0 }}>
          <FolderIcon size={16} /> View Cases
        </Button>
        <Button variant="secondary" onClick={() => navigate('/messages')} style={{ marginTop: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <MessageIcon size={16} /> Messages
        </Button>
        <Button variant="secondary" onClick={() => navigate('/marketplace')} style={{ marginTop: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <StoreIcon size={16} /> Marketplace
        </Button>

        {user?.role === 'citizen' && (
          <Button variant="secondary" onClick={() => navigate('/citizen/profile')} style={{ marginTop: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <UserIcon size={16} /> My Client Profile
          </Button>
        )}

        {user?.role === 'lawyer' && (
          <Button variant="secondary" onClick={() => navigate('/firm')} style={{ marginTop: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <BuildingIcon size={16} /> My Firm
          </Button>
        )}
      </div>

      {/* Recent cases */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-secondary)' }}>
            Recent Cases
          </h2>
          <button onClick={() => navigate('/cases')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '13px', fontWeight: 600 }}>
            View all →
          </button>
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <Skel w="40%" h="16px" style={{ marginBottom: '8px' }} />
                  <Skel w="60%" h="12px" />
                </div>
                <Skel w="60px" h="22px" style={{ borderRadius: '9999px' }} />
              </div>
            ))}
          </div>
        )}

        {!loading && cases.length === 0 && (
          <Card>
            <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', fontSize: '14px', padding: '8px 0' }}>
              No cases yet. {user?.role === 'lawyer' ? 'Create your first case.' : 'No cases assigned.'}
            </p>
          </Card>
        )}

        {!loading && (
          <motion.div variants={listVariants} initial="initial" animate="animate">
            {cases.slice(0, 5).map((c) => (
              <motion.div key={c.id} variants={itemVariants}>
                <Card
                  style={{ marginBottom: '10px' }}
                  onClick={() => navigate(`/cases/${c.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 700, margin: '0 0 3px', fontSize: '14px' }}>{c.case_number}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {c.court_name} · {c.case_type}
                      </p>
                    </div>
                    <Badge status={c.status} />
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default Dashboard;