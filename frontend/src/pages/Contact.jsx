import { useState } from 'react';
import { motion } from 'framer-motion';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

const fadeUp = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } };

const MapPinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubscribed(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 1000);
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)', backgroundColor: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar />

      {/* Header */}
      <section style={{
        background: 'linear-gradient(135deg, #072E1E 0%, #0F5C3C 60%, #051F14 100%)',
        color: '#FFFFFF', padding: '70px 24px', textAlign: 'center'
      }}>
        <motion.div variants={fadeUp} initial="initial" animate="animate" transition={{ duration: 0.4 }} style={{ maxWidth: '700px', margin: '0 auto' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            padding: '4px 14px', borderRadius: '9999px', backgroundColor: 'rgba(201,162,39,0.18)',
            color: '#C9A227', border: '1px solid rgba(201,162,39,0.3)', marginBottom: '16px'
          }}>
            Support & Platform Inquiries
          </span>
          <h1 style={{ fontSize: 'clamp(30px, 4vw, 46px)', fontWeight: 800, marginBottom: '14px', fontFamily: 'var(--font-heading)', color: '#FFFFFF' }}>
            Get in Touch with LegalHub
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
            Have questions regarding advocate marketplace verification, enterprise law firm accounts, or platform support? Our team is here to assist.
          </p>
        </motion.div>
      </section>

      {/* Main Content: Info & Form */}
      <section style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto', flex: 1, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px' }}>
          
          {/* Contact Details Column */}
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Direct Contact
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-secondary)', margin: '8px 0 24px', fontFamily: 'var(--font-heading)' }}>
              We'd Love to Hear From You
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '36px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(15,92,60,0.08)', color: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <MapPinIcon />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 700, color: 'var(--color-secondary)' }}>Head Office</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    High Court Bar Association Area, Lahore, Pakistan
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(15,92,60,0.08)', color: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <MailIcon />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 700, color: 'var(--color-secondary)' }}>Email Support</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    <a href="mailto:support@legalhub.pk" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>support@legalhub.pk</a>
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(15,92,60,0.08)', color: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <PhoneIcon />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 700, color: 'var(--color-secondary)' }}>Phone / WhatsApp Support</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    +92 42 111 534 254 (09:00 - 18:00 PKT)
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(15,92,60,0.08)', color: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <ClockIcon />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 700, color: 'var(--color-secondary)' }}>Response Guarantee</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    Our dedicated support team responds within &lt; 24 hours.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Column */}
          <div style={{
            backgroundColor: '#F9FAFB', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', padding: '36px 30px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-secondary)', margin: '0 0 20px', fontFamily: 'var(--font-heading)' }}>
              Send Us a Message
            </h3>

            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{
                backgroundColor: 'rgba(34,160,107,0.1)', border: '1px solid var(--color-success)',
                padding: '24px', borderRadius: 'var(--radius-md)', textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>✓</div>
                <h4 style={{ margin: '0 0 6px', color: 'var(--color-secondary)', fontSize: '17px', fontWeight: 700 }}>Message Sent Successfully!</h4>
                <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  Thank you for reaching out to LegalHub. A platform representative will respond to your email shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubscribed(false)}
                  style={{
                    backgroundColor: 'var(--color-primary)', color: '#FFF', border: 'none',
                    borderRadius: 'var(--radius-sm)', padding: '8px 18px', fontWeight: 600, fontSize: '13px', cursor: 'pointer'
                  }}
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '5px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Adv. Mohammad Ali"
                    required
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)', fontSize: '14px', fontFamily: 'var(--font-body)',
                      outline: 'none', backgroundColor: '#FFFFFF', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '5px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="advocate@example.com"
                    required
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)', fontSize: '14px', fontFamily: 'var(--font-body)',
                      outline: 'none', backgroundColor: '#FFFFFF', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '5px' }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Advocate Verification / Enterprise Account Inquiry"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)', fontSize: '14px', fontFamily: 'var(--font-body)',
                      outline: 'none', backgroundColor: '#FFFFFF', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '5px' }}>
                    Message *
                  </label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="How can we assist your law practice or account?"
                    required
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)', fontSize: '14px', fontFamily: 'var(--font-body)',
                      outline: 'none', backgroundColor: '#FFFFFF', resize: 'vertical', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  style={{
                    width: '100%', padding: '12px', backgroundColor: 'var(--color-primary)',
                    color: '#FFFFFF', border: 'none', borderRadius: 'var(--radius-sm)',
                    fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.75 : 1, boxShadow: '0 4px 14px rgba(15,92,60,0.25)', marginTop: '4px'
                  }}
                >
                  {loading ? 'Sending Message…' : 'Send Message →'}
                </motion.button>
              </form>
            )}
          </div>

        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

export default Contact;
