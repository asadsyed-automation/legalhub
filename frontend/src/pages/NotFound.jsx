import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <div className="page-container" style={{ textAlign: 'center', padding: 'var(--spacing-16) var(--spacing-4)' }}>
      <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-2)' }}>⚖️ 404</div>
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
