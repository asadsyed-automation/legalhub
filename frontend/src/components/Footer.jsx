import { Link } from 'react-router-dom';
import { APP_NAME, PROJECT_METADATA } from '../config/brand';
import { ScalesIcon } from './Icons';
import './Footer.css';

export const Footer = () => {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-top">
          {/* Brand Info & Academic Context */}
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <ScalesIcon size={20} color="var(--color-primary)" />
              <h2>{APP_NAME}</h2>
            </div>
            <p>
              An academic digital chamber access and case diary platform developed at {PROJECT_METADATA.institution}. Connecting citizens with admin-reviewed advocates across Pakistan under ethical Bar Council standards.
            </p>
          </div>

          {/* Platform Navigation */}
          <div className="footer-nav-col">
            <h3>Platform</h3>
            <Link to="/">Home</Link>
            <Link to="/lawyers">Find Lawyers</Link>
            <Link to="/register?role=lawyer">Chamber Enrollment</Link>
            <Link to="/login">Account Login</Link>
          </div>

          {/* Institutional & Legal Disclosures */}
          <div className="footer-nav-col">
            <h3>Institutional &amp; Legal</h3>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/disclaimer">Regulatory Disclaimer</Link>
            <Link to="/refund-policy">Refund &amp; Sandbox Policy</Link>
            <Link to="/contact">Academic Contact</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            © {PROJECT_METADATA.academicYear} {APP_NAME} Pakistan. Final Year Project — {PROJECT_METADATA.department}, {PROJECT_METADATA.institution}.
          </div>
          <div className="footer-academic-badge">
            <span>Developed by: Syed Asad, Muhammad Aqeel, Mubashir Mehmood</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
