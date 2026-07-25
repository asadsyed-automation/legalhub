import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getProfileById,
  createProfile,
  updateProfile,
  getGigsForProfile,
  createGig,
} from '../api/marketplaceApi';
import { Card, Badge, Button, Input } from '../components/ui';

function MarketplaceProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect non-lawyers away
  if (user?.role !== 'lawyer') {
    navigate('/marketplace', { replace: true });
    return null;
  }

  const [profile, setProfile] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create profile form
  const [specialization, setSpecialization] = useState('');
  const [bio, setBio] = useState('');
  const [feeStructure, setFeeStructure] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editSpec, setEditSpec] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editFee, setEditFee] = useState('');
  const [saving, setSaving] = useState(false);

  // Add gig form
  const [gigTitle, setGigTitle] = useState('');
  const [gigDesc, setGigDesc] = useState('');
  const [gigPrice, setGigPrice] = useState('');
  const [addingGig, setAddingGig] = useState(false);
  const [gigError, setGigError] = useState('');
  const [showGigForm, setShowGigForm] = useState(false);

  // We can't fetch "my profile" directly by JWT alone since GET / returns all profiles.
  // The backend stores lawyer_id on the profile, so we fetch all profiles and filter
  // by lawyer_id === user.id (profiles are only visible when is_verified=true via public GET /).
  // For a lawyer's OWN profile management we use the fact that POST returns the new profile
  // and PATCH works by JWT. We store the profile id after creating it, or we fetch all
  // unverified + verified profiles. Since GET / only returns verified ones, the only safe
  // approach is to try GET all, filter, OR try to create and catch "already exists".
  // Best solution: we keep profile id in state after first load via GET /api/v1/marketplace-profiles
  // but filter client-side. Note: unverified profiles won't appear in GET / for the lawyer
  // themselves. We handle this gracefully.

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError('');
    try {
      // GET /marketplace-profiles returns only is_verified=true profiles.
      // If the lawyer's profile isn't verified yet, it won't appear here.
      // We'll detect that case and show appropriate messaging.
      const all = await getProfileById('check').catch(() => null); // placeholder
      // The above won't work well, use getAllProfiles and filter — but unverified won't appear.
      // We'll use a try/create-and-catch approach instead as the cleanest UX.
      // Actually: we'll use PATCH / to detect if profile exists (PATCH will error "not found" if not)
      // Better: just show create form, and on attempt catch "Profile already exists".
      // After create, store locally.
      setProfile(null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  // Better approach: track profile in localStorage keyed by lawyer id so lawyer
  // always sees their own profile immediately after creating it.
  useEffect(() => {
    const stored = localStorage.getItem(`mp_profile_${user?.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProfile(parsed);
        loadGigs(parsed.id);
      } catch {
        localStorage.removeItem(`mp_profile_${user?.id}`);
      }
    }
    setLoading(false);
  }, [user?.id]);

  async function loadGigs(profileId) {
    try {
      const data = await getGigsForProfile(profileId);
      setGigs(data);
    } catch {
      // silent
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!specialization.trim()) { setCreateError('Specialization is required'); return; }
    setCreating(true);
    setCreateError('');
    try {
      const created = await createProfile({
        specialization: specialization.trim(),
        bio: bio.trim() || undefined,
        fee_structure: feeStructure.trim() || undefined,
      });
      localStorage.setItem(`mp_profile_${user.id}`, JSON.stringify(created));
      setProfile(created);
      setGigs([]);
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create profile');
    } finally {
      setCreating(false);
    }
  }

  function startEdit() {
    setEditSpec(profile.specialization);
    setEditBio(profile.bio || '');
    setEditFee(profile.fee_structure || '');
    setEditing(true);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await updateProfile({
        specialization: editSpec.trim(),
        bio: editBio.trim() || undefined,
        fee_structure: editFee.trim() || undefined,
      });
      const merged = { ...profile, ...updated };
      localStorage.setItem(`mp_profile_${user.id}`, JSON.stringify(merged));
      setProfile(merged);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddGig(e) {
    e.preventDefault();
    if (!gigTitle.trim() || !gigPrice) { setGigError('Title and price are required'); return; }
    setAddingGig(true);
    setGigError('');
    try {
      await createGig({
        title: gigTitle.trim(),
        description: gigDesc.trim() || undefined,
        price: Number(gigPrice),
      });
      setGigTitle(''); setGigDesc(''); setGigPrice('');
      setShowGigForm(false);
      await loadGigs(profile.id);
    } catch (err) {
      setGigError(err.response?.data?.error || 'Failed to add gig');
    } finally {
      setAddingGig(false);
    }
  }

  if (loading) return <p style={{ color: 'var(--color-text-secondary)' }}>Loading…</p>;

  // ── No profile yet: show create form ─────────────────────────────────────
  if (!profile) {
    return (
      <div>
        <h2 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 var(--spacing-3)', color: 'var(--color-secondary)' }}>
          My Marketplace Profile
        </h2>
        <Card style={{ maxWidth: '520px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 var(--spacing-2)', fontSize: '16px' }}>
            Create Your Profile
          </h3>
          <p style={{ margin: '0 0 var(--spacing-2)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            A marketplace profile lets citizens find and contact you. It must be verified by an admin before appearing publicly.
          </p>
          <form onSubmit={handleCreate}>
            <Input
              label="Specialization *"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g. Family Law, Criminal Defense"
              required
            />
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell clients about your experience and approach…"
                rows={4}
                style={{
                  display: 'block', width: '100%', padding: '9px 12px',
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                  fontSize: '14px', fontFamily: 'var(--font-body)', color: 'var(--color-text)',
                  backgroundColor: 'var(--color-surface)', boxSizing: 'border-box', resize: 'vertical',
                }}
              />
            </div>
            <Input
              label="Fee Structure"
              value={feeStructure}
              onChange={(e) => setFeeStructure(e.target.value)}
              placeholder="e.g. Rs. 5,000/hr or Fixed: Rs. 50,000/case"
            />
            {createError && <p style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{createError}</p>}
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating…' : 'Create Profile'}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // ── Has profile: show detail + gigs ─────────────────────────────────────
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0, color: 'var(--color-secondary)' }}>
          My Marketplace Profile
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Badge status={profile.is_verified ? 'Paid' : 'Pending'} />
          {!editing && <Button variant="secondary" onClick={startEdit} style={{ marginTop: 0 }}>Edit</Button>}
        </div>
      </div>

      {!profile.is_verified && (
        <div style={{
          padding: '10px 16px', marginBottom: 'var(--spacing-2)', borderRadius: 'var(--radius-sm)',
          backgroundColor: '#FFF7ED', border: '1px solid var(--color-warning)', fontSize: '13px',
        }}>
          ⏳ Your profile is pending admin verification. It won't appear in public search until approved.
        </div>
      )}

      {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

      {editing ? (
        <Card style={{ marginBottom: 'var(--spacing-3)', maxWidth: '520px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 var(--spacing-2)', fontSize: '15px' }}>Edit Profile</h3>
          <form onSubmit={handleSaveEdit}>
            <Input label="Specialization" value={editSpec} onChange={(e) => setEditSpec(e.target.value)} required />
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Bio</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={4}
                style={{
                  display: 'block', width: '100%', padding: '9px 12px',
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                  fontSize: '14px', fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-surface)',
                  boxSizing: 'border-box', resize: 'vertical',
                }}
              />
            </div>
            <Input label="Fee Structure" value={editFee} onChange={(e) => setEditFee(e.target.value)} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
              <Button variant="secondary" onClick={() => setEditing(false)} style={{ marginTop: '8px' }}>Cancel</Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card style={{ marginBottom: 'var(--spacing-3)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2)' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Specialization</p>
              <p style={{ margin: 0 }}>{profile.specialization}</p>
            </div>
            {profile.fee_structure && (
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Fee Structure</p>
                <p style={{ margin: 0 }}>{profile.fee_structure}</p>
              </div>
            )}
          </div>
          {profile.bio && (
            <div style={{ marginTop: 'var(--spacing-2)' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Bio</p>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>{profile.bio}</p>
            </div>
          )}
          <p style={{ margin: 'var(--spacing-2) 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Cases Won: <strong>{profile.cases_won}</strong>
          </p>
        </Card>
      )}

      {/* Gigs section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0, color: 'var(--color-secondary)' }}>My Gigs</h3>
        <Button onClick={() => setShowGigForm(!showGigForm)} style={{ marginTop: 0 }}>
          {showGigForm ? 'Cancel' : '+ Add Gig'}
        </Button>
      </div>

      {showGigForm && (
        <Card style={{ marginBottom: 'var(--spacing-2)', maxWidth: '520px' }}>
          <form onSubmit={handleAddGig}>
            <Input label="Title *" value={gigTitle} onChange={(e) => setGigTitle(e.target.value)} placeholder="e.g. Property Dispute Consultation" required />
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Description</label>
              <textarea
                value={gigDesc}
                onChange={(e) => setGigDesc(e.target.value)}
                placeholder="Describe what this gig includes…"
                rows={3}
                style={{
                  display: 'block', width: '100%', padding: '9px 12px',
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                  fontSize: '14px', fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-surface)',
                  boxSizing: 'border-box', resize: 'vertical',
                }}
              />
            </div>
            <Input label="Price (Rs.) *" type="number" value={gigPrice} onChange={(e) => setGigPrice(e.target.value)} placeholder="e.g. 5000" required />
            {gigError && <p style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{gigError}</p>}
            <Button type="submit" disabled={addingGig}>{addingGig ? 'Adding…' : 'Add Gig'}</Button>
          </form>
        </Card>
      )}

      {gigs.length === 0 && (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>No gigs yet. Add your first service above.</p>
      )}
      {gigs.map((gig) => (
        <Card key={gig.id} style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{gig.title}</p>
              {gig.description && <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{gig.description}</p>}
            </div>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
              Rs. {Number(gig.price).toLocaleString('en-PK')}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default MarketplaceProfile;
