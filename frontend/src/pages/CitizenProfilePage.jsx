import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyCitizenProfile, updateMyCitizenProfile } from '../api/citizenApi';
import { Card, Button, Input } from '../components/ui';

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Faisalabad', 'Multan', 'Quetta', 'Sialkot'];
const SPECIALIZATIONS = [
  'General Legal Assistance',
  'Family Law & Divorce',
  'Criminal Defense',
  'Corporate & Business Law',
  'Property & Real Estate Disputes',
  'Taxation & Revenue',
  'Constitutional Law'
];

function CitizenProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Lahore');
  const [legalSummary, setLegalSummary] = useState('');
  const [preferredSpec, setPreferredSpec] = useState('General Legal Assistance');
  const [budgetRange, setBudgetRange] = useState('Flexible');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError('');
    try {
      const data = await getMyCitizenProfile();
      if (data) {
        setPhone(data.phone_number || '');
        setCity(data.city || 'Lahore');
        setLegalSummary(data.legal_summary || '');
        setPreferredSpec(data.preferred_specialization || 'General Legal Assistance');
        setBudgetRange(data.budget_range || 'Flexible');
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load client profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateMyCitizenProfile({
        phone_number: phone,
        city,
        legal_summary: legalSummary,
        preferred_specialization: preferredSpec,
        budget_range: budgetRange,
        avatar_url: avatarUrl
      });
      setSuccess('🎉 Your Client Profile has been saved successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save client profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: 'var(--color-text-secondary)' }}>Loading client profile…</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--spacing-3)' }}>
        <h1 style={{ margin: '0 0 var(--spacing-1)', fontFamily: 'var(--font-heading)', fontSize: '24px' }}>
          My Client Profile
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Your client profile is displayed to advocates when you request legal consultations or message them (Fiverr/Freelancer client buyer profile).
        </p>
      </div>

      {success && (
        <div style={{
          padding: '12px 16px', marginBottom: 'var(--spacing-3)', borderRadius: 'var(--radius-sm)',
          backgroundColor: '#ECFDF5', border: '1px solid var(--color-success)', color: '#065F46',
          fontWeight: 600, fontSize: '14px'
        }}>
          {success}
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px 16px', marginBottom: 'var(--spacing-3)', borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(214,69,69,0.08)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)',
          fontWeight: 600, fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Avatar Preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
            <img
              src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
              alt={user?.name}
              style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }}
            />
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-secondary)' }}>{user?.name}</h3>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {user?.email} · <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Verified Client</span>
              </p>
            </div>
          </div>

          <Input
            label="Avatar Image URL"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Contact Phone / WhatsApp Number *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
              required
            />

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                City / Region *
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{
                  width: '100%', padding: '9.5px 12px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)', fontSize: '14px', fontFamily: 'var(--font-body)'
                }}
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                Primary Legal Area Needed
              </label>
              <select
                value={preferredSpec}
                onChange={(e) => setPreferredSpec(e.target.value)}
                style={{
                  width: '100%', padding: '9.5px 12px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)', fontSize: '14px', fontFamily: 'var(--font-body)'
                }}
              >
                {SPECIALIZATIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <Input
              label="Budget Range (Optional)"
              value={budgetRange}
              onChange={(e) => setBudgetRange(e.target.value)}
              placeholder="e.g. PKR 25,000 - 50,000"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
              Legal Needs Summary & Requirements (Shown to Advocates)
            </label>
            <textarea
              value={legalSummary}
              onChange={(e) => setLegalSummary(e.target.value)}
              rows={4}
              placeholder="Describe your legal requirement (e.g. Seeking family property dispute advocate in High Court Lahore...)"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)', fontSize: '14px', fontFamily: 'var(--font-body)',
                outline: 'none', resize: 'vertical', boxSizing: 'border-box'
              }}
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? 'Saving Profile…' : 'Save Client Profile'}
          </Button>

        </form>
      </Card>
    </div>
  );
}

export default CitizenProfilePage;
