import { Link } from 'react-router-dom';
import { ScalesIcon } from '../components/Icons';

export const NotFound = () => {
  return (
    <div className="page-container" style={{ textAlign: 'center', padding: 'var(--spacing-16) var(--spacing-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-2)' }}>
        <ScalesIcon size={44} color="var(--color-primary)" />
        <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--color-text)' }}>404</span>
      </div>
      <h2 style={{ marginBottom: 'var(--spacing-2)' }}>Page Not Found</h2>
      <p style={{ maxWidth: '460px', margin: '0 auto var(--spacing-6) auto' }}>
        The legal document, portal, or resource you requested does not exist or has been relocated within the LegalHub registry.
      </p>
      <Link to="/" className="btn btn-primary">
        Return to LegalHub Home
      </Link>
    </div>
  );
};

export default NotFound;
