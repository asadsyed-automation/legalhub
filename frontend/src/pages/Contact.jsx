import { useState } from 'react';
import { APP_NAME, CONTACT_EMAIL, PROJECT_METADATA } from '../config/brand';
import { ScalesIcon } from '../components/Icons';
import './LegalPage.css';

export const Contact = () => {
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!formName.trim() || !formEmail.trim() || !formMessage.trim()) {
      setError('Please fill in your name, email, and message.');
      return;
    }

    if (formMessage.trim().length < 10) {
      setError('Message must be at least 10 characters long.');
      return;
    }

    // Academic submission confirmation
    setSubmitted(true);
  };

  return (
    <div className="legal-page-container">
      <div className="legal-page-header">
        <div className="legal-page-meta">
          <span className="legal-page-meta__badge">Academic Project</span>
          <span>Last updated: October 2026</span>
          <span>Emerson University Multan</span>
        </div>
        <h1>Contact the {APP_NAME} Development Team</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Direct inquiries, academic feedback, and institutional information regarding the {APP_NAME} Final Year Project.
        </p>
      </div>

      <div className="contact-grid">
        {/* Left Column: Project Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <div className="contact-card">
            <h3>Academic Institution</h3>
            <p>
              <strong>{PROJECT_METADATA.institution}</strong><br />
              {PROJECT_METADATA.department}<br />
              {PROJECT_METADATA.degree} ({PROJECT_METADATA.academicYear})<br />
              {PROJECT_METADATA.location}
            </p>
          </div>

          <div className="contact-card">
            <h3>Student Developers</h3>
            <ul style={{ margin: 0, paddingLeft: 'var(--spacing-4)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              {PROJECT_METADATA.developers.map((dev) => (
                <li key={dev.name}>
                  <strong>{dev.name}</strong> — {dev.role}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Email: Rendered ONLY if CONTACT_EMAIL is configured */}
          {CONTACT_EMAIL && (
            <div className="contact-card" style={{ borderColor: 'var(--color-primary-light)' }}>
              <h3>Direct Team Inquiries</h3>
              <p>
                You can reach our development inbox directly at:{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-weight-semibold)' }}
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          )}

          <div className="contact-card" style={{ backgroundColor: 'var(--color-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
              <ScalesIcon size={18} color="var(--color-text-subtle)" />
              <h3 style={{ fontSize: 'var(--font-size-sm)', margin: 0 }}>Academic Purpose Notice</h3>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)' }}>
              This platform is developed strictly for undergraduate academic evaluation. We do not provide statutory legal advice or accept real monetary payments.
            </p>
          </div>
        </div>

        {/* Right Column: Feedback & Message Form */}
        <div>
          <div className="contact-form">
            <h2 style={{ fontSize: 'var(--font-size-lg)', margin: 0 }}>Send Academic Inquiry</h2>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
              Submit questions regarding architecture, testing, or system capabilities to the student project team.
            </p>

            {submitted ? (
              <div
                style={{
                  backgroundColor: 'var(--color-success-light, #dcfce7)',
                  border: '1px solid var(--color-success, #16a34a)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--spacing-4)',
                  color: '#166534',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <strong>Thank you!</strong> Your message has been recorded. As an academic project prototype, the student team reviews inquiries periodically.
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                {error && (
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
                    {error}
                  </div>
                )}

                <div className="form-field">
                  <label htmlFor="contact-name" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)' }}>
                    Your Name *
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Asad Ali"
                    required
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-2) var(--spacing-3)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="contact-email" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)' }}>
                    Email Address *
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-2) var(--spacing-3)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="contact-subject" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)' }}>
                    Subject
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="e.g. FYP Evaluation Inquiry"
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-2) var(--spacing-3)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="contact-message" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)' }}>
                    Message *
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    placeholder="Type your message or project evaluation query..."
                    required
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-2) var(--spacing-3)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-sm)',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ alignSelf: 'flex-start', marginTop: 'var(--spacing-1)' }}
                >
                  Send Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
