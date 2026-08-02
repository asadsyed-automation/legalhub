import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { Button, Card } from '../components/ui';

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const CrossIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const FAQS = [
  {
    q: 'Can I start with a free trial?',
    a: 'Yes! All new advocates and law firms receive a 14-day full access free trial on the Professional Advocate plan with zero commitment or credit card required.'
  },
  {
    q: 'Can I switch between monthly and annual billing?',
    a: 'You can upgrade, downgrade, or switch between monthly and annual billing at any time from your Account Settings.'
  },
  {
    q: 'What payment methods are supported in Pakistan?',
    a: 'We support local Pakistani payment channels including JazzCash, EasyPaisa, Bank Direct Transfers, Visa, and MasterCard.'
  },
  {
    q: 'Are client files and court documents secure under Pakistani legal standards?',
    a: 'Absolutely. LegalHub enforces 256-bit SSL encryption, restricted role-based access control, and automated daily backups compliant with Bar Council regulations.'
  }
];

function PricingPage() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [openFaq, setOpenFaq] = useState(null);

  const discountMultiplier = billingCycle === 'annual' ? 0.8 : 1.0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <PublicNavbar />

      {/* ── 1. HERO PRICING HEADER ────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #0A291C 0%, #0F5C3C 100%)',
        color: '#FFFFFF',
        padding: '60px 24px 70px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span style={{
            fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            padding: '4px 14px', borderRadius: '9999px', backgroundColor: 'rgba(201,162,39,0.18)',
            color: '#C9A227', border: '1px solid rgba(201,162,39,0.35)', marginBottom: '16px', display: 'inline-block'
          }}>
            Simple & Transparent Pricing
          </span>

          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4.5vw, 44px)', fontWeight: 800, margin: '0 0 16px', color: '#FFFFFF' }}>
            Predictable Plans for Every Legal Practice
          </h1>

          <p style={{ fontSize: 'clamp(14px, 2vw, 16.5px)', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: '0 0 32px' }}>
            Whether you are an independent High Court advocate, a growing law firm, or a citizen seeking legal help, choose the plan built for your needs.
          </p>

          {/* Billing Cycle Toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', padding: '4px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '8px 20px', borderRadius: '9999px', border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '13px',
                backgroundColor: billingCycle === 'monthly' ? '#FFFFFF' : 'transparent',
                color: billingCycle === 'monthly' ? 'var(--color-primary)' : '#FFFFFF',
                transition: 'all 0.2s ease'
              }}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              style={{
                padding: '8px 20px', borderRadius: '9999px', border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: billingCycle === 'annual' ? '#FFFFFF' : 'transparent',
                color: billingCycle === 'annual' ? 'var(--color-primary)' : '#FFFFFF',
                transition: 'all 0.2s ease'
              }}
            >
              <span>Annual Billing</span>
              <span style={{ backgroundColor: '#C9A227', color: '#1A1A1A', padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 800 }}>
                SAVE 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. PRICING CARDS GRID ─────────────────────────────────────────── */}
      <section style={{ padding: '60px 24px 80px', backgroundColor: '#F9FAFB' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '32px', textAlign: 'left', alignItems: 'stretch' }}>
            {[
              {
                title: 'Starter Free',
                price: 'PKR 0',
                period: 'Forever Free',
                desc: 'Essential legal workspace tools for new advocates & citizens.',
                features: ['Up to 5 Active Cases', 'Basic Cause List Reminders', 'Lawyer Marketplace Listing', 'Standard Document Storage', 'Email Support'],
                cta: 'Get Started Free',
                popular: false
              },
              {
                title: 'Professional Advocate',
                price: `PKR ${Math.round(2500 * discountMultiplier).toLocaleString()}`,
                period: billingCycle === 'annual' ? '/ mo (billed annually)' : '/ month',
                desc: 'Complete suite for active High Court & District Court practitioners.',
                features: ['Unlimited Active Cases', 'AI Petition History Tracker & Summaries', 'Priority Marketplace Verification', 'Real-Time Case Client Messaging', 'Full Fee Ledger & Invoicing', 'Dedicated Cause List Alerts'],
                cta: 'Start 14-Day Free Trial',
                popular: true
              },
              {
                title: 'Enterprise Law Firm',
                price: `PKR ${Math.round(8000 * discountMultiplier).toLocaleString()}`,
                period: billingCycle === 'annual' ? '/ mo (billed annually)' : '/ month',
                desc: 'Collaborative management platform for multi-lawyer firms.',
                features: ['Multi-Lawyer Firm Account', 'Unlimited Associate Seats', 'Shared Case Vault & Firm Repository', 'Admin Privilege & Audit Controls', '24/7 Priority VIP Support', 'Custom Branding'],
                cta: 'Contact Firm Sales',
                popular: false
              }
            ].map((plan, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '36px 28px',
                  borderRadius: 'var(--radius-lg)',
                  border: plan.popular ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: plan.popular ? '0 12px 32px rgba(15,92,60,0.14)' : '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                {plan.popular && (
                  <span style={{
                    position: 'absolute', top: '-14px', right: '24px',
                    backgroundColor: 'var(--color-primary)', color: '#FFF',
                    fontSize: '11px', fontWeight: 800, padding: '4px 14px',
                    borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>
                    Most Popular
                  </span>
                )}

                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-secondary)', margin: '0 0 8px' }}>
                    {plan.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 20px', lineHeight: 1.5, minHeight: '38px' }}>
                    {plan.desc}
                  </p>

                  <div style={{ fontSize: '34px', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>
                    {plan.price} <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{plan.period}</span>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '20px 0' }} />

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px', color: 'var(--color-text-secondary)' }}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}><CheckIcon /></span> {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => navigate('/register')}
                  style={{
                    width: '100%',
                    backgroundColor: plan.popular ? 'var(--color-primary)' : 'transparent',
                    color: plan.popular ? '#FFFFFF' : 'var(--color-primary)',
                    border: plan.popular ? 'none' : '1.5px solid var(--color-primary)',
                    padding: '12px', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '14px'
                  }}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. FEATURE COMPARISON MATRIX ─────────────────────────────────── */}
      <section style={{ padding: '70px 24px', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 800, color: 'var(--color-secondary)', margin: '0 0 10px' }}>
              Compare All Platform Features
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>
              See full capability breakdown across LegalHub subscription tiers.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-secondary)' }}>Feature</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-secondary)', textAlign: 'center' }}>Free</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-primary)', textAlign: 'center' }}>Professional</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-secondary)', textAlign: 'center' }}>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Active Case Limit', free: '5 Cases', pro: 'Unlimited', ent: 'Unlimited' },
                  { name: 'Cause List & Hearing Alerts', free: 'Basic Email', pro: 'Email + In-App', ent: 'Priority SMS + App' },
                  { name: 'AI Petition History Summaries', free: false, pro: true, ent: true },
                  { name: 'Lawyer Marketplace Listing', free: true, pro: 'Verified Badge', ent: 'Featured Verification' },
                  { name: 'Real-Time Case Chat', free: true, pro: true, ent: true },
                  { name: 'Cloud Document Storage', free: '50 MB', pro: '5 GB', ent: '50 GB' },
                  { name: 'Law Firm Associate Seats', free: '1 Seat', pro: '1 Seat', ent: 'Unlimited Seats' },
                  { name: 'Admin Audit Logs', free: false, pro: false, ent: true },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text)' }}>{row.name}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      {typeof row.free === 'boolean' ? (row.free ? <CheckIcon /> : <CrossIcon />) : row.free}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {typeof row.pro === 'boolean' ? (row.pro ? <CheckIcon /> : <CrossIcon />) : row.pro}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--color-text)' }}>
                      {typeof row.ent === 'boolean' ? (row.ent ? <CheckIcon /> : <CrossIcon />) : row.ent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 4. FREQUENTLY ASKED QUESTIONS (FAQ) ─────────────────────────── */}
      <section style={{ padding: '70px 24px', backgroundColor: '#F9FAFB', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 800, color: 'var(--color-secondary)', margin: '0 0 10px' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ fontSize: '14.5px', color: 'var(--color-text-secondary)' }}>
              Everything you need to know about LegalHub pricing and billing in Pakistan.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {FAQS.map((faq, idx) => (
              <Card key={idx} style={{ padding: '18px 20px', cursor: 'pointer' }} onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-secondary)' }}>
                    {faq.q}
                  </h4>
                  <span style={{ fontSize: '18px', color: 'var(--color-primary)', fontWeight: 700 }}>
                    {openFaq === idx ? '−' : '+'}
                  </span>
                </div>
                {openFaq === idx && (
                  <p style={{ margin: '12px 0 0', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                    {faq.a}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. BOTTOM CTA BANNER ────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #0A2B1D 0%, #0F5C3C 100%)',
        color: '#FFFFFF', padding: '60px 24px', textAlign: 'center'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '30px', fontWeight: 800, margin: '0 0 14px' }}>
            Ready to Upgrade Your Legal Practice?
          </h2>
          <p style={{ fontSize: '15.5px', color: 'rgba(255,255,255,0.85)', marginBottom: '28px' }}>
            Join over 500+ verified Pakistani advocates managing cases, tracking cause lists, and acquiring clients.
          </p>
          <Button onClick={() => navigate('/register')} style={{ backgroundColor: '#C9A227', color: '#1A1A1A', fontWeight: 800, padding: '14px 32px', fontSize: '15px' }}>
            Create Your Account Now →
          </Button>
        </div>
      </section>

      {/* ── 6. PUBLIC FOOTER ─────────────────────────────────────────────── */}
      <PublicFooter />
    </div>
  );
}

export default PricingPage;
